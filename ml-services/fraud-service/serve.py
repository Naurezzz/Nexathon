from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
import hashlib
import logging
import re
import httpx
from ocr_service import InvoiceExtractor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AEGIS-AI Fraud Detection", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_ARTIFACTS = {}

VALID_GST_RATES = {0, 0.25, 3, 5, 12, 18, 28}
GSTIN_PATTERN = re.compile(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')

GSTIN_API_KEY = "fc8756af88e15852e48259a3be084d57"
GSTIN_API_URL = "https://sheet.gstincheck.co.in/check"


def load_models():
    try:
        logger.info("Loading model artifacts...")
        MODEL_ARTIFACTS['model'] = joblib.load('models/fraud_model.joblib')
        MODEL_ARTIFACTS['base_model'] = joblib.load('models/base_model.joblib')
        MODEL_ARTIFACTS['scaler'] = joblib.load('models/scaler.joblib')
        MODEL_ARTIFACTS['iso_forest'] = joblib.load('models/isolation_forest.joblib')
        MODEL_ARTIFACTS['feature_importance'] = joblib.load('models/feature_importance.joblib')
        
        try:
            MODEL_ARTIFACTS['label_encoders'] = joblib.load('models/label_encoders.joblib')
        except:
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            le.fit(['Vendor_001', 'Vendor_002', 'Vendor_003'])
            MODEL_ARTIFACTS['label_encoders'] = {'vendor': le}
        
        MODEL_ARTIFACTS['feature_names'] = joblib.load('models/feature_names.joblib')
        logger.info(f"✅ Models loaded. Features: {MODEL_ARTIFACTS['feature_names']}")
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise


@app.on_event("startup")
async def startup_event():
    load_models()


class InvoiceRow(BaseModel):
    invoice_no: str
    vendor: str
    date: str
    base_amount: float
    gst_rate: float
    gst_amount: float
    total_amount: float
    gstin: Optional[str] = None


class FraudRequest(BaseModel):
    upload_id: str
    company_id: str
    rows: List[InvoiceRow]


class RuleViolation(BaseModel):
    rule: str
    severity: str
    description: str
    confidence: float


class RowPrediction(BaseModel):
    row_id: int
    invoice_no: str
    vendor: str
    amount: float
    fraud_score: float
    fraud_probability: float
    is_suspicious: bool
    risk_category: str
    anomaly_score: float
    rule_violations: List[RuleViolation]
    top_reasons: List[Dict[str, Any]]
    recommendation: str
    gstin_status: Optional[Dict[str, Any]] = None


class FraudResponse(BaseModel):
    upload_id: str
    company_id: str
    timestamp: str
    summary: Dict[str, Any]
    predictions: List[RowPrediction]
    model_version: str


def validate_gst(base: float, rate: float, gst: float, total: float) -> List[RuleViolation]:
    violations = []
    
    if rate not in VALID_GST_RATES:
        violations.append(RuleViolation(
            rule="INVALID_GST_RATE",
            severity="CRITICAL",
            description=f"GST rate {rate}% invalid in India. Valid: {sorted(VALID_GST_RATES)}",
            confidence=1.0
        ))
    
    expected_gst = round(base * (rate / 100), 2)
    if abs(gst - expected_gst) > 1.0:
        violations.append(RuleViolation(
            rule="GST_CALCULATION_ERROR",
            severity="CRITICAL",
            description=f"GST ₹{gst:,.2f} ≠ expected ₹{expected_gst:,.2f}",
            confidence=1.0
        ))
    
    expected_total = round(base + gst, 2)
    if abs(total - expected_total) > 1.0:
        violations.append(RuleViolation(
            rule="TOTAL_AMOUNT_ERROR",
            severity="CRITICAL",
            description=f"Total ₹{total:,.2f} ≠ expected ₹{expected_total:,.2f}",
            confidence=1.0
        ))
    
    return violations


def validate_gstin(gstin: str) -> Optional[RuleViolation]:
    if not gstin:
        return None
    if not GSTIN_PATTERN.match(gstin):
        return RuleViolation(
            rule="INVALID_GSTIN",
            severity="HIGH",
            description=f"GSTIN '{gstin}' format invalid",
            confidence=1.0
        )
    return None


async def verify_gstin_api(gstin: str) -> Dict[str, Any]:
    """Verify GSTIN against Government API - FIXED for new response format"""
    if not gstin or not GSTIN_PATTERN.match(gstin):
        return {
            "valid": False,
            "status": "INVALID_FORMAT",
            "message": "❌ Invalid GSTIN format"
        }
    
    try:
        url = f"{GSTIN_API_URL}/{GSTIN_API_KEY}/{gstin}"
        logger.info(f"🔍 Verifying GSTIN: {gstin}")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"   API Response: {result}")
                
                # ✅ Check if GSTIN was found
                if result.get('flag') and result.get('data'):
                    data = result['data']  # 👈 Get nested data object
                    
                    return {
                        "valid": True,
                        "status": data.get('sts', 'ACTIVE'),  # Active/Cancelled
                        "legal_name": data.get('lgnm', 'N/A'),
                        "trade_name": data.get('tradeNam', 'N/A'),
                        "gstin": data.get('gstin', gstin),
                        "registration_date": data.get('rgdt', 'N/A'),
                        "state": data.get('pradr', {}).get('addr', {}).get('stcd', 'N/A'),
                        "district": data.get('pradr', {}).get('addr', {}).get('dst', 'N/A'),
                        "business_type": data.get('ctb', 'N/A'),
                        "message": f"✅ GSTIN verified: {data.get('lgnm', 'N/A')}"
                    }
                
                # ❌ GSTIN not found or invalid
                return {
                    "valid": False,
                    "status": "NOT_FOUND",
                    "message": "⚠️ GSTIN not found in Government database"
                }
            
            # API error
            logger.warning(f"   API returned status {response.status_code}")
            return {
                "valid": False,
                "status": "API_ERROR",
                "message": f"⚠️ API returned error: {response.status_code}"
            }
            
    except Exception as e:
        logger.error(f"   ❌ API Error: {e}")
        return {
            "valid": False,
            "status": "API_UNAVAILABLE",
            "message": f"⚠️ API temporarily unavailable: {str(e)}"
        }


def validate_amounts(df: pd.DataFrame) -> Dict[int, List[RuleViolation]]:
    violations = {}
    
    for idx, row in df.iterrows():
        v = []
        amount = row['total_amount']
        
        thresholds = {50000: "₹50K", 100000: "₹1L", 200000: "₹2L"}
        for thresh, label in thresholds.items():
            if thresh - 2000 <= amount < thresh:
                v.append(RuleViolation(
                    rule="JUST_BELOW_THRESHOLD",
                    severity="HIGH",
                    description=f"Amount ₹{amount:,.0f} suspiciously close to {label} threshold",
                    confidence=0.85
                ))
        
        if amount > 10000 and amount % 10000 == 0:
            v.append(RuleViolation(
                rule="ROUND_FIGURE",
                severity="MEDIUM",
                description=f"Suspiciously round amount: ₹{amount:,.0f}",
                confidence=0.6
            ))
        
        if v:
            violations[idx] = v
    
    return violations


def detect_duplicates(df: pd.DataFrame) -> Dict[int, List[RuleViolation]]:
    violations = {}
    dupes = df[df.duplicated(subset=['invoice_no'], keep=False)]
    
    for idx in dupes.index:
        violations[idx] = [RuleViolation(
            rule="DUPLICATE_INVOICE",
            severity="CRITICAL",
            description=f"Duplicate invoice number: {df.loc[idx, 'invoice_no']}",
            confidence=1.0
        )]
    
    return violations


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create features - FIXED to handle hash properly"""
    df['date'] = pd.to_datetime(df['date'])
    df['day_of_week'] = df['date'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['month'] = df['date'].dt.month
    df['amount_log'] = np.log1p(df['total_amount'])
    df['gst_ratio'] = df['gst_amount'] / (df['base_amount'] + 1e-6)
    df['is_round_figure'] = ((df['total_amount'] % 10000) == 0).astype(int)
    
    vendor_stats = df.groupby('vendor')['total_amount'].agg(['mean', 'std', 'count']).reset_index()
    vendor_stats.columns = ['vendor', 'vendor_avg_amount', 'vendor_std_amount', 'vendor_count']
    df = df.merge(vendor_stats, on='vendor', how='left')
    df['vendor_std_amount'].fillna(0, inplace=True)
    df['amount_zscore'] = (df['total_amount'] - df['vendor_avg_amount']) / (df['vendor_std_amount'] + 1e-6)
    
    df['invoice_entropy'] = df['invoice_no'].apply(lambda x: len(set(x)) / len(x) if len(x) > 0 else 0)
    
    # Generate hash and convert to numeric (first 8 chars as hex -> int)
    df['invoice_hash_str'] = df.apply(
        lambda row: hashlib.md5(f"{row['vendor']}_{row['base_amount']}_{row['date'].strftime('%Y%m%d')}".encode()).hexdigest()[:8],
        axis=1
    )
    # Convert hex string to integer for ML model
    df['invoice_hash'] = df['invoice_hash_str'].apply(lambda x: int(x, 16) % 1000000)  # Keep manageable size
    
    df['is_duplicate_hash'] = df.duplicated(subset=['invoice_hash_str'], keep=False).astype(int)
    
    le = MODEL_ARTIFACTS['label_encoders']['vendor']
    df['vendor_encoded'] = df['vendor'].apply(lambda x: le.transform([x])[0] if x in le.classes_ else -1)
    
    return df


def categorize_risk(score: float, violations: List[RuleViolation]) -> str:
    if any(v.severity == "CRITICAL" for v in violations) or score > 0.9:
        return "CRITICAL"
    elif len([v for v in violations if v.severity == "HIGH"]) >= 2 or score > 0.75:
        return "HIGH"
    elif any(v.severity == "HIGH" for v in violations) or score > 0.6:
        return "MEDIUM"
    elif score > 0.4:
        return "LOW"
    return "SAFE"


def get_recommendation(category: str) -> str:
    recs = {
        "CRITICAL": "🚨 CRITICAL: BLOCK PAYMENT immediately. Escalate to fraud investigation team.",
        "HIGH": "⛔ HIGH RISK: DO NOT process. Requires mandatory verification and manager approval.",
        "MEDIUM": "⚠️ MEDIUM RISK: Flag for review. Verify with vendor before processing.",
        "LOW": "⚡ LOW RISK: Minor anomalies detected. Standard verification recommended.",
        "SAFE": "✅ SAFE: No significant fraud indicators. Safe to process."
    }
    return recs.get(category, "Review required")


@app.get("/")
async def root():
    return {
        "service": "AEGIS-AI Fraud Detection",
        "status": "operational",
        "version": "3.0.0",
        "features": [
            "ML Ensemble (XGBoost + Random Forest)",
            "Rule-based Validation",
            "GST Verification",
            "GSTIN Validation & API",
            "Duplicate Detection",
            "Amount Pattern Analysis",
            "OCR Invoice Extraction (PDF/Image)"
        ]
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models": list(MODEL_ARTIFACTS.keys()),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict", response_model=FraudResponse)
async def predict_fraud(request: FraudRequest):
    try:
        logger.info(f"Processing {len(request.rows)} invoices")
        
        df = pd.DataFrame([r.model_dump() for r in request.rows])
        df['row_id'] = range(len(df))
        
        # Rule-based validations
        amount_violations = validate_amounts(df)
        duplicate_violations = detect_duplicates(df)
        
        # Feature engineering
        df = create_features(df)
        features = MODEL_ARTIFACTS['feature_names']
        X = df[features]
        
        # ML predictions
        X_scaled = MODEL_ARTIFACTS['scaler'].transform(X)
        anomaly_scores = MODEL_ARTIFACTS['iso_forest'].score_samples(X_scaled)
        fraud_probs = MODEL_ARTIFACTS['model'].predict_proba(X_scaled)[:, 1]
        
        # GSTIN verification
        gstin_results = []
        for row in request.rows:
            if row.gstin:
                gstin_results.append(await verify_gstin_api(row.gstin))
            else:
                gstin_results.append(None)
        
        # Combine results
        predictions = []
        risk_counts = {'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0, 'SAFE': 0}
        
        for idx, row in df.iterrows():
            score = float(fraud_probs[idx])
            
            violations = []
            violations.extend(validate_gst(row['base_amount'], row['gst_rate'], row['gst_amount'], row['total_amount']))
            
            if request.rows[idx].gstin:
                v = validate_gstin(request.rows[idx].gstin)
                if v:
                    violations.append(v)
            
            violations.extend(amount_violations.get(idx, []))
            violations.extend(duplicate_violations.get(idx, []))
            
            if any(v.severity == "CRITICAL" for v in violations):
                score = max(score, 0.95)
            
            category = categorize_risk(score, violations)
            risk_counts[category] += 1
            
            predictions.append(RowPrediction(
                row_id=int(row['row_id']),
                invoice_no=row['invoice_no'],
                vendor=row['vendor'],
                amount=float(row['total_amount']),
                fraud_score=score,
                fraud_probability=score * 100,
                is_suspicious=category in ['CRITICAL', 'HIGH', 'MEDIUM'],
                risk_category=category,
                anomaly_score=float(anomaly_scores[idx]),
                rule_violations=violations,
                top_reasons=[],
                recommendation=get_recommendation(category),
                gstin_status=gstin_results[idx]
            ))
        
        logger.info(f"✅ Complete: {risk_counts}")
        
        return FraudResponse(
            upload_id=request.upload_id,
            company_id=request.company_id,
            timestamp=datetime.now().isoformat(),
            summary={
                'total_invoices': len(df),
                'risk_breakdown': risk_counts,
                'suspicious_count': sum([risk_counts[k] for k in ['CRITICAL', 'HIGH', 'MEDIUM']]),
                'clean_count': risk_counts['LOW'] + risk_counts['SAFE'],
                'critical_count': risk_counts['CRITICAL']
            },
            predictions=predictions,
            model_version="v3.0.0-production"
        )
        
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract")
async def extract_invoice(file: UploadFile = File(...)):
    """Extract invoice data from PDF/Image using OCR"""
    try:
        logger.info(f"📄 Extracting from: {file.filename}")
        
        result = await InvoiceExtractor.extract_from_file(file)
        
        if result['success']:
            return {
                "success": True,
                "filename": file.filename,
                "raw_text": result['raw_text'],
                "parsed_data": result['parsed_data']
            }
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        logger.error(f"❌ Extraction failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract-and-analyze")
async def extract_and_analyze(file: UploadFile = File(...)):
    """Extract invoice from PDF/Image and immediately run fraud detection"""
    try:
        logger.info(f"📄 Extract & Analyze: {file.filename}")
        
        # Step 1: Extract
        extraction = await InvoiceExtractor.extract_from_file(file)
        
        if not extraction['success']:
            raise HTTPException(status_code=400, detail="Extraction failed")
        
        parsed = extraction['parsed_data']
        logger.info(f"✅ Extracted fields: {list(parsed.keys())}")
        
        # Step 2: Validate required fields
        required = ['invoice_no', 'date', 'total_amount']
        missing = [f for f in required if f not in parsed]
        
        if missing:
            return {
                "success": False,
                "error": f"Could not extract required fields: {', '.join(missing)}",
                "parsed_data": parsed,
                "suggestion": "Please enter missing fields manually"
            }
        
        # Step 3: Prepare invoice row with defaults for missing fields
        invoice_row = InvoiceRow(
            invoice_no=parsed.get('invoice_no', 'UNKNOWN'),
            vendor=parsed.get('vendor', 'UNKNOWN'),
            date=parsed.get('date', datetime.now().strftime('%Y-%m-%d')),
            base_amount=parsed.get('base_amount', 0),
            gst_rate=parsed.get('gst_rate', 18),
            gst_amount=parsed.get('gst_amount', 0),
            total_amount=parsed.get('total_amount', 0),
            gstin=parsed.get('gstin')
        )
        
        # Step 4: Run fraud detection
        fraud_request = FraudRequest(
            upload_id=f"extracted_{int(datetime.now().timestamp())}",
            company_id="uploaded",
            rows=[invoice_row]
        )
        
        fraud_result = await predict_fraud(fraud_request)
        
        return {
            "success": True,
            "extraction": parsed,
            "fraud_analysis": fraud_result
        }
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
