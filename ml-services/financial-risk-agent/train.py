"""
Train XGBoost bankruptcy prediction model with SHAP explainability
Real-world financial risk assessment with interpretable ML
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score, classification_report, confusion_matrix,
    precision_recall_curve, f1_score
)
import xgboost as xgb
import shap
import joblib
import json
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

class BankruptcyModelTrainer:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
        self.shap_explainer = None
        
    def load_data(self):
        """Load and prepare bankruptcy dataset"""
        print("\n📂 Loading bankruptcy dataset...")
        
        df = pd.read_csv('data/raw/bankruptcy_raw.csv')
        
        # Separate features and target
        if 'class' in df.columns:
            X = df.drop('class', axis=1)
            y = df['class']
        else:
            # If using UCI raw data with numbered attributes
            X = df.iloc[:, :-1]
            y = df.iloc[:, -1]
        
        self.feature_names = X.columns.tolist()
        
        print(f"   Features: {X.shape[1]}")
        print(f"   Samples: {X.shape[0]}")
        print(f"   Bankruptcy rate: {y.mean()*100:.2f}%")
        
        return X, y
    
    def preprocess(self, X, y):
        """Preprocess and split data"""
        print("\n🔧 Preprocessing data...")
        
        # Convert all columns to numeric (handle string values from UCI dataset)
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')
        
        # Handle missing values
        X = X.fillna(X.median())
        
        # Handle infinities
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.median())
        
        # Remove constant columns
        constant_cols = [col for col in X.columns if X[col].nunique() <= 1]
        if constant_cols:
            print(f"   Removing {len(constant_cols)} constant columns")
            X = X.drop(constant_cols, axis=1)
        
        # Update feature names after dropping columns
        self.feature_names = X.columns.tolist()
        
        # Split data (stratified to maintain class balance)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"   Train set: {X_train.shape[0]} samples")
        print(f"   Test set: {X_test.shape[0]} samples")
        print(f"   Final features: {X_train.shape[1]}")
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Convert back to DataFrame to preserve column names
        X_train_scaled = pd.DataFrame(X_train_scaled, columns=X_train.columns)
        X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns)
        
        return X_train_scaled, X_test_scaled, y_train, y_test


    
    def train_model(self, X_train, y_train):
        """Train XGBoost model with optimal hyperparameters"""
        print("\n🎯 Training XGBoost model...")
        
        # Calculate scale_pos_weight for imbalanced classes
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
        
        # XGBoost parameters optimized for bankruptcy prediction
        params = {
            'objective': 'binary:logistic',
            'eval_metric': 'auc',
            'max_depth': 6,
            'learning_rate': 0.05,
            'n_estimators': 200,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'min_child_weight': 3,
            'gamma': 0.1,
            'reg_alpha': 0.1,
            'reg_lambda': 1.0,
            'scale_pos_weight': scale_pos_weight,
            'random_state': 42,
            'tree_method': 'hist'
        }
        
        self.model = xgb.XGBClassifier(**params)
        
        # Train with early stopping
        eval_set = [(X_train, y_train)]
        self.model.fit(
            X_train, y_train,
            eval_set=eval_set,
            verbose=False
        )
        
        print(f"✅ Model trained with {self.model.n_estimators} trees")
        
        return self.model
    
    def evaluate_model(self, X_train, X_test, y_train, y_test):
        """Comprehensive model evaluation"""
        print("\n📊 Evaluating model performance...")
        
        # Predictions
        y_train_pred = self.model.predict(X_train)
        y_test_pred = self.model.predict(X_test)
        
        y_train_proba = self.model.predict_proba(X_train)[:, 1]
        y_test_proba = self.model.predict_proba(X_test)[:, 1]
        
        # Calculate metrics
        train_auc = roc_auc_score(y_train, y_train_proba)
        test_auc = roc_auc_score(y_test, y_test_proba)
        
        train_f1 = f1_score(y_train, y_train_pred)
        test_f1 = f1_score(y_test, y_test_pred)
        
        print(f"\n   Training Metrics:")
        print(f"   • ROC-AUC: {train_auc:.4f}")
        print(f"   • F1 Score: {train_f1:.4f}")
        
        print(f"\n   Test Metrics:")
        print(f"   • ROC-AUC: {test_auc:.4f}")
        print(f"   • F1 Score: {test_f1:.4f}")
        
        # Classification report
        print("\n   Classification Report (Test Set):")
        print(classification_report(y_test, y_test_pred, 
                                   target_names=['Healthy', 'Bankrupt']))
        
        # Confusion Matrix
        cm = confusion_matrix(y_test, y_test_pred)
        print(f"\n   Confusion Matrix:")
        print(f"   TN: {cm[0,0]}  FP: {cm[0,1]}")
        print(f"   FN: {cm[1,0]}  TP: {cm[1,1]}")
        
        # Save confusion matrix plot
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=['Healthy', 'Bankrupt'],
                   yticklabels=['Healthy', 'Bankrupt'])
        plt.title('Confusion Matrix - Bankruptcy Prediction')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        Path('models/plots').mkdir(parents=True, exist_ok=True)
        plt.savefig('models/plots/confusion_matrix.png', dpi=150, bbox_inches='tight')
        print("   ✅ Confusion matrix saved to models/plots/confusion_matrix.png")
        
        return {
            'train_auc': float(train_auc),
            'test_auc': float(test_auc),
            'train_f1': float(train_f1),
            'test_f1': float(test_f1),
            'confusion_matrix': cm.tolist()
        }
    
    def create_shap_explainer(self, X_train):
        """Create SHAP explainer for model interpretability"""
        print("\n🔍 Creating SHAP explainer...")
        
        try:
            # Use TreeExplainer with specific parameters to avoid compatibility issues
            self.shap_explainer = shap.TreeExplainer(
                self.model,
                feature_perturbation='interventional',
                model_output='probability'
            )
            
            # Calculate SHAP values for training set (sample for speed)
            sample_size = min(500, len(X_train))
            X_sample = X_train.sample(n=sample_size, random_state=42)
            
            print(f"   Computing SHAP values for {sample_size} samples...")
            shap_values = self.shap_explainer.shap_values(X_sample)
            
            # For binary classification, shap_values might be a list
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # Take positive class
            
            # Create summary plot
            plt.figure(figsize=(10, 8))
            shap.summary_plot(shap_values, X_sample, show=False, max_display=15)
            plt.tight_layout()
            plt.savefig('models/plots/shap_summary.png', dpi=150, bbox_inches='tight')
            print("   ✅ SHAP summary plot saved")
            plt.close()
            
            # Create feature importance plot
            plt.figure(figsize=(10, 8))
            shap.summary_plot(shap_values, X_sample, plot_type="bar", show=False, max_display=15)
            plt.tight_layout()
            plt.savefig('models/plots/shap_importance.png', dpi=150, bbox_inches='tight')
            print("   ✅ SHAP importance plot saved")
            plt.close()
            
            return self.shap_explainer
            
        except Exception as e:
            print(f"   ⚠️ SHAP explainer creation failed: {e}")
            print("   ℹ️ Continuing without SHAP (will use feature importance instead)")
            
            # Fallback: Create a simple explainer using feature importance
            feature_importance = self.model.feature_importances_
            
            # Create basic feature importance plot
            plt.figure(figsize=(10, 8))
            importance_df = pd.DataFrame({
                'feature': X_train.columns,
                'importance': feature_importance
            }).sort_values('importance', ascending=False).head(15)
            
            plt.barh(importance_df['feature'], importance_df['importance'])
            plt.xlabel('Feature Importance')
            plt.title('XGBoost Feature Importance')
            plt.tight_layout()
            plt.savefig('models/plots/feature_importance.png', dpi=150, bbox_inches='tight')
            print("   ✅ Feature importance plot saved (fallback)")
            plt.close()
            
            # Return None as fallback
            return None

    
    def save_artifacts(self, metrics):
        """Save all model artifacts"""
        print("\n💾 Saving model artifacts...")
        
        Path('models').mkdir(parents=True, exist_ok=True)
        
        # Save model
        joblib.dump(self.model, 'models/bankruptcy_model.pkl')
        print("   ✅ Model saved")
        
        # Save scaler
        joblib.dump(self.scaler, 'models/scaler.pkl')
        print("   ✅ Scaler saved")
        
        # Save feature names
        with open('models/feature_names.json', 'w') as f:
            json.dump(self.feature_names, f)
        print("   ✅ Feature names saved")
        
        # Save metrics
        with open('models/metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        print("   ✅ Metrics saved")
        
        # Save SHAP explainer
        joblib.dump(self.shap_explainer, 'models/shap_explainer.pkl')
        print("   ✅ SHAP explainer saved")

def main():
    print("="*70)
    print("TRAINING BANKRUPTCY PREDICTION MODEL")
    print("XGBoost + SHAP Explainability")
    print("="*70)
    
    # Initialize trainer
    trainer = BankruptcyModelTrainer()
    
    # Load data
    X, y = trainer.load_data()
    
    # Preprocess
    X_train, X_test, y_train, y_test = trainer.preprocess(X, y)
    
    # Train
    model = trainer.train_model(X_train, y_train)
    
    # Evaluate
    metrics = trainer.evaluate_model(X_train, X_test, y_train, y_test)
    
    # Create SHAP explainer
    trainer.create_shap_explainer(X_train)
    
    # Save everything
    trainer.save_artifacts(metrics)
    
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETE!")
    print("="*70)
    print(f"\n🎯 Final Test ROC-AUC: {metrics['test_auc']:.4f}")
    print(f"🎯 Final Test F1 Score: {metrics['test_f1']:.4f}")
    print("\n📦 Artifacts saved in models/")
    print("   • bankruptcy_model.pkl")
    print("   • scaler.pkl")
    print("   • shap_explainer.pkl")
    print("   • feature_names.json")
    print("   • metrics.json")
    print("   • plots/")

if __name__ == "__main__":
    main()
