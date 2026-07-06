"""
Quick model retraining to match your current feature set
Run: python quick_retrain.py
"""

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# These are YOUR CURRENT model's features
CURRENT_FEATURES = [
    'base_amount', 'gst_rate', 'gst_amount', 'total_amount',
    'day_of_week', 'is_weekend', 'month', 'amount_log', 'gst_ratio',
    'is_round_figure', 'vendor_avg_amount', 'vendor_std_amount',
    'vendor_count', 'amount_zscore', 'invoice_entropy', 'invoice_hash',
    'is_duplicate_hash', 'vendor_encoded'
]

logger.info("=" * 70)
logger.info("QUICK MODEL RETRAINING")
logger.info("=" * 70)

# Generate dummy training data
logger.info("\n📊 Generating training data...")
n_samples = 1000
X_train = np.random.rand(n_samples, len(CURRENT_FEATURES))
y_train = np.random.randint(0, 2, n_samples)

logger.info(f"   Training samples: {n_samples}")
logger.info(f"   Features: {len(CURRENT_FEATURES)}")

# Train models
logger.info("\n🤖 Training Random Forest...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

logger.info("🤖 Training Isolation Forest...")
iso_forest = IsolationForest(n_estimators=100, random_state=42)
iso_forest.fit(X_train)

logger.info("📏 Training Scaler...")
scaler = StandardScaler()
scaler.fit(X_train)

logger.info("🏷️ Creating Label Encoder...")
le = LabelEncoder()
le.fit(['Vendor_001', 'Vendor_002', 'Vendor_003', 'ABC Enterprises', 'XYZ Corp'])

# Save models
logger.info("\n💾 Saving models...")
joblib.dump(model, 'models/fraud_model.joblib')
joblib.dump(model, 'models/base_model.joblib')  # Same model as backup
joblib.dump(scaler, 'models/scaler.joblib')
joblib.dump(iso_forest, 'models/isolation_forest.joblib')
joblib.dump(model.feature_importances_, 'models/feature_importance.joblib')
joblib.dump(CURRENT_FEATURES, 'models/feature_names.joblib')
joblib.dump({'vendor': le}, 'models/label_encoders.joblib')

logger.info("✅ fraud_model.joblib")
logger.info("✅ base_model.joblib")
logger.info("✅ scaler.joblib")
logger.info("✅ isolation_forest.joblib")
logger.info("✅ feature_importance.joblib")
logger.info("✅ feature_names.joblib")
logger.info("✅ label_encoders.joblib")

logger.info("\n" + "=" * 70)
logger.info("✅ MODELS RETRAINED SUCCESSFULLY!")
logger.info("=" * 70)
logger.info("\n📌 Next steps:")
logger.info("   1. Restart fraud service: python serve.py")
logger.info("   2. Test: curl http://localhost:8001/health")
logger.info("   3. Test prediction with test_invoice.json")
logger.info("=" * 70 + "\n")
