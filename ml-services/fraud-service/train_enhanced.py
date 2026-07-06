"""
Enhanced Invoice Fraud Detection Training
Using Real-World Datasets for 85%+ Accuracy
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create models directory
Path('models').mkdir(exist_ok=True)

def load_and_prepare_data():
    """Load and prepare enhanced dataset"""
    logger.info("=" * 70)
    logger.info("LOADING ENHANCED DATASET")
    logger.info("=" * 70)
    
    # Load enhanced dataset
    df = pd.read_csv('data/raw/enhanced_invoice_fraud.csv')
    
    logger.info(f"Dataset shape: {df.shape}")
    logger.info(f"Fraud distribution:\n{df['is_fraud'].value_counts()}")
    logger.info(f"Fraud rate: {df['is_fraud'].mean()*100:.2f}%")
    
    return df

def engineer_advanced_features(df):
    """Create advanced fraud detection features"""
    logger.info("\n" + "=" * 70)
    logger.info("ENGINEERING ADVANCED FEATURES")
    logger.info("=" * 70)
    
    # Time-based features
    df['date'] = pd.to_datetime(df['date'])
    df['day'] = df['date'].dt.day
    df['day_of_week'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['is_month_end'] = (df['day'] >= 28).astype(int)
    
    # Amount-based features
    df['is_round_amount'] = ((df['total_amount'] % 1000) == 0).astype(int)
    df['is_high_gst'] = (df['gst_rate'] >= 18).astype(int)
    df['amount_to_gst_ratio'] = df['base_amount'] / (df['gst_amount'] + 1)
    
    # Vendor-based features (already in dataset)
    # - vendor_avg_amount
    # - vendor_std_amount
    # - vendor_invoice_count
    # - amount_deviation
    
    # Duplicate detection
    df['duplicate_count'] = df.groupby('invoice_no')['invoice_no'].transform('count')
    df['is_duplicate'] = (df['duplicate_count'] > 1).astype(int)
    
    # Invoice number patterns
    df['invoice_numeric'] = df['invoice_no'].str.extract('(\d+)').astype(float)
    df['invoice_sequential_gap'] = df['invoice_numeric'].diff().fillna(0)
    df['has_large_gap'] = (df['invoice_sequential_gap'] > 100).astype(int)
    
    # Vendor encoding (label encoding for tree models)
    vendor_encoder = {v: i for i, v in enumerate(df['vendor'].unique())}
    df['vendor_encoded'] = df['vendor'].map(vendor_encoder)
    
    # Save encoder
    joblib.dump(vendor_encoder, 'models/vendor_encoder.joblib')
    
    logger.info(f"Total features: {len(df.columns)}")
    logger.info(f"Feature names: {list(df.columns)}")
    
    return df

def train_models(X_train, X_test, y_train, y_test):
    """Train multiple models and select best"""
    logger.info("\n" + "=" * 70)
    logger.info("TRAINING ENSEMBLE MODELS")
    logger.info("=" * 70)
    
    models = {
        'XGBoost': XGBClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            scale_pos_weight=10,  # Handle imbalance
            random_state=42,
            eval_metric='auc'
        ),
        'RandomForest': RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=10,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        ),
        'GradientBoosting': GradientBoostingClassifier(
            n_estimators=150,
            max_depth=7,
            learning_rate=0.1,
            random_state=42
        )
    }
    
    results = {}
    
    for name, model in models.items():
        logger.info(f"\nTraining {name}...")
        
        # Train
        model.fit(X_train, y_train)
        
        # Predict
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        # Metrics
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        
        logger.info(f"\n{name} Results:")
        logger.info(f"ROC-AUC: {roc_auc:.4f}")
        logger.info("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Genuine', 'Fraud']))
        
        results[name] = {
            'model': model,
            'roc_auc': roc_auc,
            'predictions': y_pred_proba
        }
    
    # Select best model
    best_model_name = max(results, key=lambda x: results[x]['roc_auc'])
    best_model = results[best_model_name]['model']
    
    logger.info(f"\n✅ Best Model: {best_model_name} (ROC-AUC: {results[best_model_name]['roc_auc']:.4f})")
    
    return best_model, results

def save_models(model, feature_names, feature_importance):
    """Save trained models and artifacts"""
    logger.info("\n" + "=" * 70)
    logger.info("SAVING MODEL ARTIFACTS")
    logger.info("=" * 70)
    
    # Save main model
    joblib.dump(model, 'models/fraud_model_enhanced.joblib')
    logger.info("✅ Saved: models/fraud_model_enhanced.joblib")
    
    # Save feature importance
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': feature_importance
    }).sort_values('importance', ascending=False)
    
    importance_df.to_csv('models/feature_importance_enhanced.csv', index=False)
    logger.info("✅ Saved: models/feature_importance_enhanced.csv")
    
    logger.info("\nTop 10 Features:")
    print(importance_df.head(10))
    
    return importance_df

def main():
    logger.info("\n" + "=" * 70)
    logger.info("AEGIS-AI: ENHANCED INVOICE FRAUD DETECTION TRAINING")
    logger.info("Real-World Datasets | XGBoost + RandomForest Ensemble")
    logger.info("=" * 70 + "\n")
    
    # Load data
    df = load_and_prepare_data()
    
    # Engineer features
    df = engineer_advanced_features(df)
    
    # Prepare features and target
    feature_cols = [
        'base_amount', 'gst_rate', 'gst_amount', 'total_amount',
        'day_of_week', 'month', 'is_weekend', 'is_month_end',
        'is_round_amount', 'is_high_gst', 'amount_to_gst_ratio',
        'vendor_avg_amount', 'vendor_std_amount', 'vendor_invoice_count', 'amount_deviation',
        'duplicate_count', 'is_duplicate',
        'invoice_sequential_gap', 'has_large_gap',
        'vendor_encoded'
    ]
    
    X = df[feature_cols]
    y = df['is_fraud']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    logger.info(f"\nTraining set: {X_train.shape}")
    logger.info(f"Test set: {X_test.shape}")
    logger.info(f"Train fraud rate: {y_train.mean()*100:.2f}%")
    logger.info(f"Test fraud rate: {y_test.mean()*100:.2f}%")
    
    # Handle imbalance with SMOTE
    logger.info("\nApplying SMOTE for class balance...")
    smote = SMOTE(random_state=42)
    X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)
    logger.info(f"Balanced training set: {X_train_balanced.shape}")
    logger.info(f"Balanced fraud rate: {y_train_balanced.mean()*100:.2f}%")
    
    # Train models
    best_model, results = train_models(X_train_balanced, X_test, y_train_balanced, y_test)
    
    # Feature importance
    if hasattr(best_model, 'feature_importances_'):
        feature_importance = best_model.feature_importances_
    else:
        feature_importance = np.zeros(len(feature_cols))
    
    # Save models
    importance_df = save_models(best_model, feature_cols, feature_importance)
    
    logger.info("\n" + "=" * 70)
    logger.info("TRAINING COMPLETE!")
    logger.info("=" * 70)
    logger.info("Next steps:")
    logger.info("  1. Test the model: python test_model.py")
    logger.info("  2. Start the service: python serve.py")
    logger.info("  3. Update frontend to use new model")
    logger.info("=" * 70 + "\n")

if __name__ == "__main__":
    main()
