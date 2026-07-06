"""
Train phishing detection models
RandomForest + IsolationForest ensemble
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import json
from pathlib import Path
import sys
sys.path.insert(0, '.')
from utils.url_features import extract_url_features

class PhishingModelTrainer:
    def __init__(self):
        self.rf_model = None
        self.iso_model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        
    def load_and_prepare_data(self):
        """Load URLs and extract features"""
        print("\n📂 Loading phishing dataset...")
        
        df = pd.read_csv('data/raw/phishing_raw.csv')
        
        # Detect column names (handle different formats)
        if 'type' in df.columns:
            label_col = 'type'
            url_col = 'url'
        elif 'label' in df.columns:
            label_col = 'label'
            url_col = df.columns[0]  # First column is usually URL
        else:
            # Assume first column is URL, last is label
            url_col = df.columns[0]
            label_col = df.columns[-1]
        
        print(f"   Total URLs: {len(df)}")
        print(f"   Columns: {df.columns.tolist()}")
        print(f"   Label distribution:\n{df[label_col].value_counts()}")
        
        # Sample if dataset is huge (>10K URLs)
        if len(df) > 10000:
            print(f"\n   📊 Sampling 10,000 URLs for faster training...")
            df = df.sample(n=10000, random_state=42)

        
        # Extract features for all URLs
        print("\n🔍 Extracting URL features...")
        features_list = []
        labels = []
        
        for idx, row in df.iterrows():
            if idx % 500 == 0:
                print(f"   Processed {idx}/{len(df)} URLs...")
            
            try:
                features = extract_url_features(row[url_col])
                features_list.append(features)
                
                # Convert label to binary (1 for phishing/malicious, 0 for safe/benign)
                label_val = str(row[label_col]).lower()
                is_phishing = any(word in label_val for word in ['phishing', 'bad', 'malicious', '1'])
                labels.append(1 if is_phishing else 0)
            except Exception as e:
                continue

        
        X = pd.DataFrame(features_list)
        y = np.array(labels)
        
        self.feature_names = X.columns.tolist()
        
        print(f"\n✅ Extracted {len(X.columns)} features from {len(X)} URLs")
        
        return X, y
    
    def train_models(self, X, y):
        """Train RandomForest and IsolationForest"""
        print("\n🎯 Training models...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train RandomForest (supervised)
        print("\n   Training RandomForest...")
        self.rf_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        
        self.rf_model.fit(X_train_scaled, y_train)
        
        # Train IsolationForest (anomaly detection)
        print("   Training IsolationForest...")
        self.iso_model = IsolationForest(
            n_estimators=100,
            contamination=0.3,
            random_state=42,
            n_jobs=-1
        )
        
        # Train on all data (unsupervised)
        self.iso_model.fit(X_train_scaled)
        
        return X_train, X_test, y_train, y_test, X_train_scaled, X_test_scaled
    
    def evaluate(self, X_test_scaled, y_test):
        """Evaluate model performance"""
        print("\n📊 Evaluating models...")
        
        # RandomForest predictions
        rf_pred = self.rf_model.predict(X_test_scaled)
        rf_proba = self.rf_model.predict_proba(X_test_scaled)[:, 1]
        
        # IsolationForest predictions (-1 for anomaly/phishing, 1 for normal)
        iso_pred = self.iso_model.predict(X_test_scaled)
        iso_pred_binary = (iso_pred == -1).astype(int)  # Convert to 0/1
        
        # Ensemble: If either model says phishing, flag it
        ensemble_pred = np.maximum(rf_pred, iso_pred_binary)
        
        print("\n   RandomForest Performance:")
        print(classification_report(y_test, rf_pred, target_names=['Legitimate', 'Phishing']))
        print(f"   ROC-AUC: {roc_auc_score(y_test, rf_proba):.4f}")
        
        print("\n   Ensemble Performance:")
        print(classification_report(y_test, ensemble_pred, target_names=['Legitimate', 'Phishing']))
        
        # Confusion matrix
        cm = confusion_matrix(y_test, ensemble_pred)
        print(f"\n   Confusion Matrix:")
        print(f"   TN: {cm[0,0]}  FP: {cm[0,1]}")
        print(f"   FN: {cm[1,0]}  TP: {cm[1,1]}")
        
        return {
            'rf_auc': float(roc_auc_score(y_test, rf_proba)),
            'confusion_matrix': cm.tolist()
        }
    
    def save_artifacts(self, metrics):
        """Save all models and artifacts"""
        print("\n💾 Saving model artifacts...")
        
        Path('models').mkdir(parents=True, exist_ok=True)
        
        joblib.dump(self.rf_model, 'models/rf_model.pkl')
        print("   ✅ RandomForest saved")
        
        joblib.dump(self.iso_model, 'models/iso_model.pkl')
        print("   ✅ IsolationForest saved")
        
        joblib.dump(self.scaler, 'models/scaler.pkl')
        print("   ✅ Scaler saved")
        
        with open('models/feature_names.json', 'w') as f:
            json.dump(self.feature_names, f)
        print("   ✅ Feature names saved")
        
        with open('models/metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        print("   ✅ Metrics saved")

def main():
    print("="*70)
    print("TRAINING PHISHING DETECTION MODELS")
    print("RandomForest + IsolationForest Ensemble")
    print("="*70)
    
    trainer = PhishingModelTrainer()
    
    # Load and prepare data
    X, y = trainer.load_and_prepare_data()
    
    # Train models
    X_train, X_test, y_train, y_test, X_train_scaled, X_test_scaled = trainer.train_models(X, y)
    
    # Evaluate
    metrics = trainer.evaluate(X_test_scaled, y_test)
    
    # Save
    trainer.save_artifacts(metrics)
    
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETE!")
    print("="*70)
    print(f"\n🎯 Final ROC-AUC: {metrics['rf_auc']:.4f}")

if __name__ == "__main__":
    main()
