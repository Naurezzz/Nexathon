import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import IsolationForest
import xgboost as xgb
from sklearn.calibration import CalibratedClassifierCV
import joblib
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class FraudModelTrainer:
    """Train fraud detection model with explainability"""
    
    def __init__(self, data_path):
        self.data_path = data_path
        self.model = None
        self.base_model = None
        self.scaler = None
        self.iso_forest = None
        self.feature_importance = None
        self.label_encoders = {}
        self.feature_names = []
        
    def load_and_preprocess(self):
        """Load data and create features"""
        print("📊 Loading dataset...")
        df = pd.read_csv(self.data_path)
        
        print("🔧 Feature engineering...")
        
        # Date features
        df['date'] = pd.to_datetime(df['date'])
        df['day_of_week'] = df['date'].dt.dayofweek
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        df['month'] = df['date'].dt.month
        
        # Amount features
        df['amount_log'] = np.log1p(df['total_amount'])
        df['gst_ratio'] = df['gst_amount'] / (df['base_amount'] + 1e-6)
        df['is_round_figure'] = ((df['total_amount'] % 10000) == 0).astype(int)
        
        # Vendor-based features (historical patterns)
        vendor_stats = df.groupby('vendor')['total_amount'].agg(['mean', 'std', 'count']).reset_index()
        vendor_stats.columns = ['vendor', 'vendor_avg_amount', 'vendor_std_amount', 'vendor_count']
        df = df.merge(vendor_stats, on='vendor', how='left')
        
        # Z-score of amount relative to vendor history
        df['amount_zscore'] = (df['total_amount'] - df['vendor_avg_amount']) / (df['vendor_std_amount'] + 1e-6)
        
        # Invoice text entropy (randomness measure)
        df['invoice_entropy'] = df['invoice_no'].apply(lambda x: len(set(x)) / len(x))
        
        # Duplicate detection
        df['is_duplicate_hash'] = df.duplicated(subset=['invoice_hash'], keep=False).astype(int)
        
        # Encode categorical
        self.label_encoders['vendor'] = LabelEncoder()
        df['vendor_encoded'] = self.label_encoders['vendor'].fit_transform(df['vendor'])
        
        # Select features for training
        self.feature_names = [
            'base_amount', 'total_amount', 'gst_rate', 'gst_ratio',
            'amount_log', 'day_of_week', 'is_weekend', 'month',
            'is_round_figure', 'vendor_avg_amount', 'vendor_std_amount',
            'amount_zscore', 'invoice_entropy', 'is_duplicate_hash',
            'vendor_encoded'
        ]
        
        X = df[self.feature_names]
        y = df['is_fraud']
        
        print(f"✅ Features: {len(self.feature_names)}")
        print(f"✅ Samples: {len(df)} ({y.sum()} fraud, {len(y)-y.sum()} normal)")
        
        return X, y, df
    
    def train_isolation_forest(self, X):
        """Train unsupervised anomaly detector"""
        print("\n🌲 Training Isolation Forest (unsupervised)...")
        self.iso_forest = IsolationForest(
            contamination=0.15,
            random_state=42,
            n_estimators=100
        )
        self.iso_forest.fit(X)
        print("✅ Isolation Forest trained")
    
    def train_xgboost(self, X_train, X_test, y_train, y_test):
        """Train XGBoost classifier with better fraud detection"""
        print("\n🚀 Training XGBoost classifier...")
        
        # Calculate scale_pos_weight for imbalanced data
        scale_pos_weight = (len(y_train) - y_train.sum()) / y_train.sum()
        
        # Train base XGBoost model with HIGHER SENSITIVITY
        self.base_model = xgb.XGBClassifier(
            n_estimators=300,  # More trees
            max_depth=8,       # Deeper trees to catch complex patterns
            learning_rate=0.03,  # Slower learning
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=scale_pos_weight * 1.5,  # Boost fraud detection
            min_child_weight=1,  # Allow smaller leaf nodes
            gamma=0,  # No regularization initially
            random_state=42,
            eval_metric='logloss',
            use_label_encoder=False
        )
        
        self.base_model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        print("✅ Base XGBoost model trained")
        
        # Extract feature importance
        self.feature_importance = self.base_model.feature_importances_
        
        # Print top features
        print("\n📊 Top 5 most important features:")
        feature_imp_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.feature_importance
        }).sort_values('importance', ascending=False)
        
        for idx, row in feature_imp_df.head(5).iterrows():
            print(f"   {row['feature']}: {row['importance']:.4f}")
        
        # Skip calibration to maintain model sensitivity
        print("\n⚡ Using uncalibrated model for better fraud detection")
        self.model = self.base_model
        
        print("✅ XGBoost trained (uncalibrated for sensitivity)")
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        from sklearn.metrics import classification_report, roc_auc_score, precision_recall_curve, auc, confusion_matrix
        
        print("\n📈 Evaluating model...")
        
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        
        print("\n" + "="*50)
        print(classification_report(y_test, y_pred, target_names=['Normal', 'Fraud']))
        print("="*50)
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        print("\n📊 Confusion Matrix:")
        print(f"   True Negatives: {cm[0][0]}, False Positives: {cm[0][1]}")
        print(f"   False Negatives: {cm[1][0]}, True Positives: {cm[1][1]}")
        
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
        pr_auc = auc(recall, precision)
        
        # Calculate detection rate
        fraud_detected = cm[1][1]
        total_fraud = cm[1][0] + cm[1][1]
        detection_rate = fraud_detected / total_fraud if total_fraud > 0 else 0
        
        metrics = {
            'roc_auc': float(roc_auc),
            'pr_auc': float(pr_auc),
            'fraud_detection_rate': float(detection_rate),
            'explainer_type': 'feature_importance',
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"\n📊 ROC-AUC: {roc_auc:.4f}")
        print(f"📊 PR-AUC: {pr_auc:.4f}")
        print(f"📊 Fraud Detection Rate: {detection_rate*100:.1f}%")
        print(f"📊 Explainer: Feature Importance (XGBoost)")
        
        return metrics
    
    def save_artifacts(self):
        """Save all model artifacts"""
        print("\n💾 Saving model artifacts...")
        
        joblib.dump(self.model, 'models/fraud_model.joblib')
        joblib.dump(self.base_model, 'models/base_model.joblib')
        joblib.dump(self.scaler, 'models/scaler.joblib')
        joblib.dump(self.iso_forest, 'models/isolation_forest.joblib')
        joblib.dump(self.feature_importance, 'models/feature_importance.joblib')
        joblib.dump(self.label_encoders, 'models/label_encoders.joblib')
        joblib.dump(self.feature_names, 'models/feature_names.joblib')
        
        print("✅ All artifacts saved to models/")
    
    def train_pipeline(self):
        """Complete training pipeline"""
        # Load and preprocess
        X, y, df = self.load_and_preprocess()
        
        # Scale features
        print("\n📏 Scaling features...")
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=self.feature_names)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train models
        self.train_isolation_forest(X_train)
        self.train_xgboost(X_train, X_test, y_train, y_test)
        
        # Evaluate
        metrics = self.evaluate(X_test, y_test)
        
        # Save metrics
        with open('models/metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        
        # Save artifacts
        self.save_artifacts()
        
        print("\n✨ Training complete! Model ready for deployment.")
        print("   Model optimized for FRAUD DETECTION (high recall)")


if __name__ == "__main__":
    trainer = FraudModelTrainer(data_path='data/fraud_invoices_synthetic.csv')
    trainer.train_pipeline()
