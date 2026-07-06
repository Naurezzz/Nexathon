"""
AEGIS-AI: Real Bankruptcy Prediction - UCI Repository API
Uses: Taiwanese Bankruptcy Dataset (6,819 companies, 95 features)
Source: UCI Machine Learning Repository (VERIFIED WORKING)
Target: 92-96% Realistic Accuracy
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import (
    roc_auc_score, classification_report, confusion_matrix,
    f1_score, accuracy_score, precision_score, recall_score
)
import xgboost as xgb
import joblib
import json
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

class RealBankruptcyPredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = None
        
    def download_real_dataset_uci(self):
        """Download REAL dataset from UCI Machine Learning Repository"""
        print("\n🌐 Downloading REAL Taiwan Bankruptcy Dataset from UCI...")
        
        try:
            # Install ucimlrepo if needed
            try:
                from ucimlrepo import fetch_ucirepo
            except ImportError:
                print("   Installing ucimlrepo package...")
                import subprocess
                subprocess.run(['pip', 'install', 'ucimlrepo'], check=True)
                from ucimlrepo import fetch_ucirepo
            
            # Fetch dataset (ID: 572 = Taiwanese Bankruptcy Prediction)
            print("   Fetching from UCI repository...")
            taiwanese_bankruptcy = fetch_ucirepo(id=572)
            
            # Get features and target
            X = taiwanese_bankruptcy.data.features
            y = taiwanese_bankruptcy.data.targets
            
            # Combine for easier handling
            df = pd.concat([X, y], axis=1)
            
            print(f"   ✅ SUCCESS! Downloaded {len(df)} real companies")
            print(f"   ✅ Features: {X.shape[1]}")
            print(f"   ✅ Source: Taiwan Economic Journal (1999-2009)")
            
            return df, True
            
        except Exception as e:
            print(f"   ⚠️  UCI download failed: {str(e)[:80]}")
            return None, False
    
    def download_polish_dataset_uci(self):
        """Fallback: Polish Companies Bankruptcy Dataset"""
        print("\n   Trying Polish bankruptcy dataset...")
        
        try:
            from ucimlrepo import fetch_ucirepo
            
            # Fetch Polish dataset (ID: 365)
            polish_bankruptcy = fetch_ucirepo(id=365)
            
            X = polish_bankruptcy.data.features
            y = polish_bankruptcy.data.targets
            
            df = pd.concat([X, y], axis=1)
            
            print(f"   ✅ SUCCESS! Downloaded {len(df)} Polish companies")
            
            return df, True
            
        except Exception as e:
            print(f"   ⚠️  Polish dataset failed: {str(e)[:80]}")
            return None, False
    
    def create_realistic_synthetic(self):
        """High-quality synthetic as last resort"""
        print("\n   📝 Creating realistic synthetic dataset...")
        
        np.random.seed(42)
        
        n_samples = 6000
        n_bankrupt = int(n_samples * 0.036)
        n_healthy = n_samples - n_bankrupt
        
        # Create realistic overlapping distributions
        healthy_data = {
            'ROA': np.random.normal(0.06, 0.08, n_healthy).clip(-0.2, 0.4),
            'Current_Ratio': np.random.normal(1.3, 0.6, n_healthy).clip(0.3, 6),
            'Debt_Ratio': np.random.normal(0.45, 0.20, n_healthy).clip(0, 1.5),
            'Net_Profit_Margin': np.random.normal(0.08, 0.12, n_healthy).clip(-0.3, 0.6),
            'Operating_Profit': np.random.normal(0.10, 0.10, n_healthy).clip(-0.2, 0.5),
            'Cash_Flow_Ratio': np.random.normal(0.12, 0.10, n_healthy).clip(-0.1, 0.6),
            'Interest_Coverage': np.random.lognormal(1.3, 0.8, n_healthy).clip(0, 30),
            'Quick_Ratio': np.random.normal(1.0, 0.4, n_healthy).clip(0.2, 5),
            'Asset_Turnover': np.random.normal(0.9, 0.4, n_healthy).clip(0.1, 4),
            'Equity_Ratio': np.random.normal(1.5, 0.8, n_healthy).clip(0.2, 8),
            'Bankrupt?': np.zeros(n_healthy)
        }
        
        bankrupt_data = {
            'ROA': np.random.normal(-0.03, 0.10, n_bankrupt).clip(-0.6, 0.15),
            'Current_Ratio': np.random.normal(0.9, 0.5, n_bankrupt).clip(0.1, 3),
            'Debt_Ratio': np.random.normal(0.68, 0.22, n_bankrupt).clip(0.2, 1.8),
            'Net_Profit_Margin': np.random.normal(-0.02, 0.15, n_bankrupt).clip(-0.8, 0.2),
            'Operating_Profit': np.random.normal(0.01, 0.12, n_bankrupt).clip(-0.5, 0.3),
            'Cash_Flow_Ratio': np.random.normal(0.05, 0.08, n_bankrupt).clip(-0.3, 0.3),
            'Interest_Coverage': np.random.lognormal(0.3, 0.9, n_bankrupt).clip(0, 10),
            'Quick_Ratio': np.random.normal(0.6, 0.3, n_bankrupt).clip(0.05, 2),
            'Asset_Turnover': np.random.normal(0.7, 0.3, n_bankrupt).clip(0.05, 2.5),
            'Equity_Ratio': np.random.normal(0.8, 0.5, n_bankrupt).clip(0.05, 3),
            'Bankrupt?': np.ones(n_bankrupt)
        }
        
        df_healthy = pd.DataFrame(healthy_data)
        df_bankrupt = pd.DataFrame(bankrupt_data)
        df = pd.concat([df_healthy, df_bankrupt], ignore_index=True)
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)
        
        # Add noise
        mask = np.random.random(df.shape) < 0.02
        df = df.mask(mask)
        
        print(f"   ✅ Created realistic dataset: {len(df)} samples")
        
        return df, False
    
    def load_data(self):
        """Load data with multiple fallbacks"""
        print("\n📂 LOADING REAL BANKRUPTCY DATA")
        print("="*70)
        
        # Try UCI Taiwan dataset first
        df, is_real = self.download_real_dataset_uci()
        
        # Fallback 1: Polish dataset
        if df is None:
            df, is_real = self.download_polish_dataset_uci()
        
        # Fallback 2: Realistic synthetic
        if df is None:
            df, is_real = self.create_realistic_synthetic()
        
        # Identify target column
        possible_targets = ['Bankrupt?', 'Bankruptcy', 'class', 'target', 'Y']
        target_col = None
        
        for col in possible_targets:
            if col in df.columns:
                target_col = col
                break
        
        if target_col is None:
            target_col = df.columns[-1]
        
        print(f"\n   Target column: {target_col}")
        
        X = df.drop(target_col, axis=1)
        y = df[target_col].astype(int)
        
        # Clean data
        X = X.select_dtypes(include=[np.number])
        X = X.fillna(X.median())
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(X.median())
        
        # Remove constants
        constant_cols = [col for col in X.columns if X[col].nunique() <= 1]
        if constant_cols:
            X = X.drop(constant_cols, axis=1)
        
        self.feature_names = X.columns.tolist()
        
        print(f"\n   ✅ DATA SUMMARY:")
        print(f"      Dataset type: {'REAL' if is_real else 'SYNTHETIC'}")
        print(f"      Features: {len(self.feature_names)}")
        print(f"      Total samples: {len(X)}")
        print(f"      Bankruptcy rate: {y.mean()*100:.2f}%")
        print(f"      Healthy: {(y==0).sum()}")
        print(f"      Bankrupt: {(y==1).sum()}")
        
        return X, y, is_real
    
    def train_model(self, X, y):
        """Train with realistic parameters"""
        print("\n🎯 TRAINING XGBoost MODEL")
        print("="*70)
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale
        self.scaler = RobustScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        X_train_scaled = pd.DataFrame(X_train_scaled, columns=X_train.columns)
        X_test_scaled = pd.DataFrame(X_test_scaled, columns=X_test.columns)
        
        # Calculate class weight
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
        
        # Realistic XGBoost parameters
        params = {
            'objective': 'binary:logistic',
            'eval_metric': 'auc',
            'max_depth': 6,
            'learning_rate': 0.05,
            'n_estimators': 300,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'min_child_weight': 3,
            'gamma': 0.2,
            'reg_alpha': 0.3,
            'reg_lambda': 1.5,
            'scale_pos_weight': scale_pos_weight,
            'random_state': 42,
        }
        
        print(f"\n   Hyperparameters:")
        print(f"      Max depth: {params['max_depth']}")
        print(f"      Learning rate: {params['learning_rate']}")
        print(f"      N estimators: {params['n_estimators']}")
        print(f"      Scale pos weight: {scale_pos_weight:.2f}")
        
        self.model = xgb.XGBClassifier(**params)
        
        eval_set = [(X_train_scaled, y_train), (X_test_scaled, y_test)]
        
        print(f"\n   Training...")
        self.model.fit(
            X_train_scaled, y_train,
            eval_set=eval_set,
            verbose=False
        )
        
        print(f"   ✅ Training complete")
        
        return X_train_scaled, X_test_scaled, y_train, y_test
    
    def evaluate(self, X_test, y_test):
        """Evaluate model"""
        print("\n📊 MODEL EVALUATION")
        print("="*70)
        
        y_test_pred = self.model.predict(X_test)
        y_test_proba = self.model.predict_proba(X_test)[:, 1]
        
        test_acc = accuracy_score(y_test, y_test_pred)
        test_auc = roc_auc_score(y_test, y_test_proba)
        test_f1 = f1_score(y_test, y_test_pred, zero_division=0)
        test_precision = precision_score(y_test, y_test_pred, zero_division=0)
        test_recall = recall_score(y_test, y_test_pred, zero_division=0)
        
        print(f"\n🎯 TEST METRICS:")
        print(f"   ✅ Accuracy:   {test_acc*100:.2f}%")
        print(f"   ✅ ROC-AUC:    {test_auc:.4f}")
        print(f"   ✅ F1 Score:   {test_f1:.4f}")
        print(f"   ✅ Precision:  {test_precision:.4f}")
        print(f"   ✅ Recall:     {test_recall:.4f}")
        
        print(f"\n📊 Classification Report:")
        print(classification_report(y_test, y_test_pred, 
                                   target_names=['Healthy', 'Bankrupt'],
                                   digits=4))
        
        cm = confusion_matrix(y_test, y_test_pred)
        tn, fp, fn, tp = cm.ravel()
        
        print(f"\n📊 Confusion Matrix:")
        print(f"   TN: {tn:5d}  |  FP: {fp:5d}")
        print(f"   FN: {fn:5d}  |  TP: {tp:5d}")
        
        # Save plot
        Path('models/plots').mkdir(parents=True, exist_ok=True)
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='RdYlGn_r',
                   xticklabels=['Healthy', 'Bankrupt'],
                   yticklabels=['Healthy', 'Bankrupt'])
        plt.title(f'Bankruptcy Prediction - Accuracy: {test_acc*100:.2f}%')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig('models/plots/confusion_matrix.png', dpi=150)
        plt.close()
        print("\n   ✅ Confusion matrix saved")
        
        if test_acc >= 0.95:
            print("\n🏆 EXCELLENT: 95%+ Accuracy!")
        elif test_acc >= 0.90:
            print(f"\n✅ GOOD: {test_acc*100:.2f}% (Production-ready)")
        else:
            print(f"\n📊 Realistic: {test_acc*100:.2f}% (Real-world performance)")
        
        return {
            'test_accuracy': float(test_acc),
            'test_auc': float(test_auc),
            'test_f1': float(test_f1),
            'test_precision': float(test_precision),
            'test_recall': float(test_recall),
            'confusion_matrix': cm.tolist()
        }
    
    def save_artifacts(self, metrics, is_real):
        """Save model"""
        print("\n💾 Saving model artifacts...")
        Path('models').mkdir(parents=True, exist_ok=True)
        
        joblib.dump(self.model, 'models/bankruptcy_model.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        
        with open('models/feature_names.json', 'w') as f:
            json.dump(self.feature_names, f)
        
        metrics['dataset_type'] = 'real' if is_real else 'synthetic'
        
        with open('models/metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        
        print("   ✅ All artifacts saved")

def main():
    print("="*70)
    print("🏆 AEGIS-AI: REAL BANKRUPTCY PREDICTION")
    print("Source: UCI Machine Learning Repository")
    print("Target: 92-96% Realistic Accuracy")
    print("="*70)
    
    predictor = RealBankruptcyPredictor()
    
    X, y, is_real = predictor.load_data()
    X_train, X_test, y_train, y_test = predictor.train_model(X, y)
    metrics = predictor.evaluate(X_test, y_test)
    predictor.save_artifacts(metrics, is_real)
    
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETE!")
    print("="*70)
    print(f"\n🎯 Final Accuracy: {metrics['test_accuracy']*100:.2f}%")
    print(f"🎯 Final ROC-AUC: {metrics['test_auc']:.4f}")
    print(f"📊 Dataset: {'REAL (UCI)' if is_real else 'SYNTHETIC'}")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
