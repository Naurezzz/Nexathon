"""
Train models compatible with serve.py
Generates all required artifacts in models/ folder
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, IsolationForest
import xgboost as xgb
import joblib
import os
from datetime import datetime, timedelta

# Create models directory
os.makedirs('models', exist_ok=True)

def generate_training_data(n_samples=10000):
    """Generate realistic invoice fraud dataset"""
    np.random.seed(42)
    
    data = []
    vendors = [f"Vendor_{i}" for i in range(100)]
    
    for i in range(n_samples):
        invoice_date = datetime.now() - timedelta(days=np.random.randint(0, 365))
        vendor = np.random.choice(vendors)
        base_amount = np.random.lognormal(10, 2)
        gst_rate = np.random.choice([5, 12, 18, 28])
        
        is_fraud = np.random.random() < 0.15
        
        if is_fraud:
            if np.random.random() < 0.3:
                base_amount *= np.random.uniform(5, 20)
            if np.random.random() < 0.3:
                base_amount = round(base_amount / 1000) * 1000
        
        gst_amount = base_amount * (gst_rate / 100)
        total_amount = base_amount + gst_amount
        
        data.append({
            'invoice_no': f'INV-{i:06d}',
            'vendor': vendor,
            'date': invoice_date.strftime('%Y-%m-%d'),
            'base_amount': round(base_amount, 2),
            'gst_rate': gst_rate,
            'gst_amount': round(gst_amount, 2),
            'total_amount': round(total_amount, 2),
            'is_fraud': int(is_fraud)
        })
    
    return pd.DataFrame(data)

def create_features(df):
    """Create features matching serve.py expectations"""
    df['date'] = pd.to_datetime(df['date'])
    df['day_of_week'] = df['date'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['month'] = df['date'].dt.month
    df['amount_log'] = np.log1p(df['total_amount'])
    df['gst_ratio'] = df['gst_amount'] / (df['base_amount'] + 1e-6)
    df['is_round_figure'] = ((df['total_amount'] % 10000) == 0).astype(int)
    
    # Vendor statistics
    vendor_stats = df.groupby('vendor')['total_amount'].agg(['mean', 'std', 'count']).reset_index()
    vendor_stats.columns = ['vendor', 'vendor_avg_amount', 'vendor_std_amount', 'vendor_count']
    df = df.merge(vendor_stats, on='vendor', how='left')
    df['vendor_std_amount'].fillna(0, inplace=True)
    df['amount_zscore'] = (df['total_amount'] - df['vendor_avg_amount']) / (df['vendor_std_amount'] + 1e-6)
    
    # Invoice features
    df['invoice_entropy'] = df['invoice_no'].apply(lambda x: len(set(x)) / len(x) if len(x) > 0 else 0)
    
    # Encode vendor
    le_vendor = LabelEncoder()
    df['vendor_encoded'] = le_vendor.fit_transform(df['vendor'])
    
    return df, le_vendor

print("="*70)
print("TRAINING MODELS FOR serve.py")
print("="*70)

# Generate data
print("\n📊 Generating training data...")
df = generate_training_data(10000)
print(f"✅ Generated {len(df)} samples ({df['is_fraud'].sum()} fraud)")

# Create features
print("\n🔧 Engineering features...")
df, le_vendor = create_features(df)

# Feature columns
feature_cols = [
    'base_amount', 'gst_rate', 'gst_amount', 'total_amount',
    'day_of_week', 'is_weekend', 'month', 'amount_log',
    'gst_ratio', 'is_round_figure', 'vendor_avg_amount',
    'vendor_std_amount', 'vendor_count', 'amount_zscore',
    'invoice_entropy', 'vendor_encoded'
]

X = df[feature_cols]
y = df['is_fraud']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"   Features: {len(feature_cols)}")
print(f"   Training samples: {len(X_train)}")

# Scale features
print("\n⚖️ Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train base model (Random Forest)
print("\n🌳 Training Random Forest (base model)...")
base_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
base_model.fit(X_train_scaled, y_train)

# Train main model (XGBoost)
print("\n🤖 Training XGBoost (main model)...")
main_model = xgb.XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.1, random_state=42)
main_model.fit(X_train_scaled, y_train)

# Train Isolation Forest for anomaly detection
print("\n🔍 Training Isolation Forest (anomaly detection)...")
iso_forest = IsolationForest(contamination=0.15, random_state=42)
iso_forest.fit(X_train_scaled)

# Evaluate
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

y_pred = main_model.predict(X_test_scaled)
y_proba = main_model.predict_proba(X_test_scaled)[:, 1]

print("\n📊 Model Performance:")
print(f"   Accuracy: {accuracy_score(y_test, y_pred)*100:.2f}%")
print(f"   ROC-AUC: {roc_auc_score(y_test, y_proba):.4f}")

# Save all artifacts
print("\n💾 Saving model artifacts to models/...")

joblib.dump(main_model, 'models/fraud_model.joblib')
joblib.dump(base_model, 'models/base_model.joblib')
joblib.dump(scaler, 'models/scaler.joblib')
joblib.dump(iso_forest, 'models/isolation_forest.joblib')
joblib.dump(main_model.feature_importances_, 'models/feature_importance.joblib')
joblib.dump({'vendor': le_vendor}, 'models/label_encoders.joblib')
joblib.dump(feature_cols, 'models/feature_names.joblib')

print("✅ All models saved successfully!")
print("\nSaved files in models/:")
print("  • fraud_model.joblib")
print("  • base_model.joblib")
print("  • scaler.joblib")
print("  • isolation_forest.joblib")
print("  • feature_importance.joblib")
print("  • label_encoders.joblib")
print("  • feature_names.joblib")

print("\n🎉 Training complete! Your serve.py is ready to use!")
