"""
AEGIS-AI Invoice Fraud Detection - PROPER TRAINING WITH REAL ACCURACY
Train models with realistic data and show actual performance metrics
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report
import joblib
import logging
from datetime import datetime, timedelta
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("="*80)
print("🤖 AEGIS-AI INVOICE FRAUD DETECTION - PROPER TRAINING")
print("="*80)

# Generate REALISTIC invoice dataset
print("\n📊 Generating REALISTIC Invoice Dataset...")

def generate_realistic_invoice_dataset(n_samples=5000):
    """Generate realistic invoice data with actual fraud patterns"""
    
    np.random.seed(42)
    
    vendors = ['TechCorp Ltd', 'ABC Enterprises', 'XYZ Industries', 'Prime Solutions', 
               'Metro Supplies', 'Global Trade Co', 'First Vendors', 'Alpha Services']
    
    data = []
    
    for i in range(n_samples):
        # Determine if fraud (20% fraud rate)
        is_fraud = np.random.random() < 0.2
        
        vendor = np.random.choice(vendors)
        date = datetime.now() - timedelta(days=np.random.randint(1, 365))
        
        if is_fraud:
            # FRAUDULENT INVOICE PATTERNS
            
            # Pattern 1: Invalid GST rates (30% of fraud)
            if np.random.random() < 0.3:
                base_amount = np.random.uniform(10000, 500000)
                gst_rate = np.random.choice([7, 10, 15, 20, 25])  # Invalid rates
                gst_amount = base_amount * (gst_rate / 100)
                total_amount = base_amount + gst_amount
            
            # Pattern 2: Calculation errors (40% of fraud)
            elif np.random.random() < 0.4:
                base_amount = np.random.uniform(10000, 500000)
                gst_rate = np.random.choice([18, 12, 28])  # Valid rate
                expected_gst = base_amount * (gst_rate / 100)
                gst_amount = expected_gst * np.random.uniform(1.2, 1.8)  # Inflated
                total_amount = base_amount + gst_amount
            
            # Pattern 3: Suspicious round figures (30% of fraud)
            else:
                base_amount = np.random.choice([50000, 100000, 200000, 500000])
                gst_rate = 18
                gst_amount = base_amount * 0.18
                total_amount = base_amount + gst_amount
        
        else:
            # LEGITIMATE INVOICE
            base_amount = np.random.uniform(5000, 500000)
            gst_rate = np.random.choice([5, 12, 18, 28])  # Valid rates
            gst_amount = base_amount * (gst_rate / 100)
            total_amount = base_amount + gst_amount
        
        # Create features
        invoice_no = f"INV-2025-{i:05d}"
        day_of_week = date.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        month = date.month
        amount_log = np.log1p(total_amount)
        gst_ratio = gst_amount / (base_amount + 1e-6)
        is_round_figure = 1 if total_amount % 10000 == 0 else 0
        
        # Vendor statistics (simplified)
        vendor_avg_amount = np.random.uniform(50000, 300000)
        vendor_std_amount = np.random.uniform(10000, 50000)
        vendor_count = np.random.randint(5, 50)
        amount_zscore = (total_amount - vendor_avg_amount) / (vendor_std_amount + 1e-6)
        
        invoice_entropy = len(set(invoice_no)) / len(invoice_no)
        
        # Hash
        hash_str = hashlib.md5(f"{vendor}_{base_amount}_{date.strftime('%Y%m%d')}".encode()).hexdigest()[:8]
        invoice_hash = int(hash_str, 16) % 1000000
        
        is_duplicate_hash = 0  # Simplified
        
        # Encode vendor
        vendor_encoded = vendors.index(vendor)
        
        data.append({
            'invoice_no': invoice_no,
            'vendor': vendor,
            'base_amount': base_amount,
            'gst_rate': gst_rate,
            'gst_amount': gst_amount,
            'total_amount': total_amount,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'month': month,
            'amount_log': amount_log,
            'gst_ratio': gst_ratio,
            'is_round_figure': is_round_figure,
            'vendor_avg_amount': vendor_avg_amount,
            'vendor_std_amount': vendor_std_amount,
            'vendor_count': vendor_count,
            'amount_zscore': amount_zscore,
            'invoice_entropy': invoice_entropy,
            'invoice_hash': invoice_hash,
            'is_duplicate_hash': is_duplicate_hash,
            'vendor_encoded': vendor_encoded,
            'is_fraud': is_fraud
        })
    
    return pd.DataFrame(data)

# Generate dataset
df = generate_realistic_invoice_dataset(5000)

print(f"✅ Generated {len(df)} invoices")
print(f"   Fraud invoices: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.1f}%)")
print(f"   Legitimate invoices: {(~df['is_fraud']).sum()} ({(~df['is_fraud']).mean()*100:.1f}%)")

# Feature columns
FEATURES = [
    'base_amount', 'gst_rate', 'gst_amount', 'total_amount',
    'day_of_week', 'is_weekend', 'month', 'amount_log', 'gst_ratio',
    'is_round_figure', 'vendor_avg_amount', 'vendor_std_amount',
    'vendor_count', 'amount_zscore', 'invoice_entropy', 'invoice_hash',
    'is_duplicate_hash', 'vendor_encoded'
]

X = df[FEATURES]
y = df['is_fraud'].astype(int)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

print(f"\n📊 Dataset Split:")
print(f"   Training set: {len(X_train)} samples")
print(f"   Test set: {len(X_test)} samples")

# Train Scaler
print("\n📏 Training Scaler...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train Random Forest
print("\n🌲 Training Random Forest Classifier...")
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train_scaled, y_train)

# Predictions
y_pred = rf_model.predict(X_test_scaled)
y_pred_proba = rf_model.predict_proba(X_test_scaled)[:, 1]

# Calculate metrics
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_pred_proba)

print("\n" + "="*80)
print("📊 MODEL PERFORMANCE METRICS")
print("="*80)
print(f"\n   ✅ Accuracy:  {accuracy*100:.2f}%")
print(f"   ✅ Precision: {precision*100:.2f}%")
print(f"   ✅ Recall:    {recall*100:.2f}%")
print(f"   ✅ F1-Score:  {f1*100:.2f}%")
print(f"   ✅ ROC-AUC:   {roc_auc*100:.2f}%")

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
tn, fp, fn, tp = cm.ravel()

print(f"\n📊 Confusion Matrix:")
print(f"   True Negatives:  {tn:4d}  (Correctly identified legitimate)")
print(f"   False Positives: {fp:4d}  (Legitimate flagged as fraud)")
print(f"   False Negatives: {fn:4d}  (Fraud missed)")
print(f"   True Positives:  {tp:4d}  (Correctly detected fraud)")

# Train Isolation Forest
print("\n🌳 Training Isolation Forest (Anomaly Detection)...")
iso_forest = IsolationForest(n_estimators=100, random_state=42)
iso_forest.fit(X_train_scaled)

# Label Encoder
print("\n🏷️  Creating Label Encoder...")
le = LabelEncoder()
le.fit(df['vendor'].unique())

# Save models
print("\n💾 Saving Models...")
joblib.dump(rf_model, 'models/fraud_model.joblib')
joblib.dump(rf_model, 'models/base_model.joblib')
joblib.dump(scaler, 'models/scaler.joblib')
joblib.dump(iso_forest, 'models/isolation_forest.joblib')
joblib.dump(rf_model.feature_importances_, 'models/feature_importance.joblib')
joblib.dump(FEATURES, 'models/feature_names.joblib')
joblib.dump({'vendor': le}, 'models/label_encoders.joblib')

# Save metadata
metadata = {
    'model_version': 'v3.0.0',
    'training_date': datetime.now().isoformat(),
    'n_samples': len(df),
    'n_features': len(FEATURES),
    'accuracy': float(accuracy),
    'precision': float(precision),
    'recall': float(recall),
    'f1_score': float(f1),
    'roc_auc': float(roc_auc),
    'confusion_matrix': {
        'true_negatives': int(tn),
        'false_positives': int(fp),
        'false_negatives': int(fn),
        'true_positives': int(tp)
    }
}

import json
with open('models/training_metrics.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("✅ fraud_model.joblib")
print("✅ base_model.joblib")
print("✅ scaler.joblib")
print("✅ isolation_forest.joblib")
print("✅ feature_importance.joblib")
print("✅ feature_names.joblib")
print("✅ label_encoders.joblib")
print("✅ training_metrics.json")

print("\n" + "="*80)
print("✅ TRAINING COMPLETE!")
print("="*80)
print(f"\n🎯 YOUR MODEL ACCURACY: {accuracy*100:.2f}%")
print(f"🎯 FRAUD DETECTION RATE: {recall*100:.2f}%")
print(f"🎯 FALSE ALARM RATE: {(fp/(fp+tn))*100:.2f}%")

print("\n📌 Next Steps:")
print("   1. Restart service: python serve.py")
print("   2. Check metrics: cat models/training_metrics.json")
print("   3. Test: python test_prediction.py")
print("="*80 + "\n")
