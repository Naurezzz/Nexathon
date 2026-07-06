"""
CyberSecurity Agent - Phishing URL Detection API
RandomForest + IsolationForest ensemble with explainability
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import pandas as pd
import numpy as np
import joblib
import json
import sys
sys.path.insert(0, '.')
from utils.url_features import extract_url_features, get_feature_explanation
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="CyberSecurity Agent API",
    description="Phishing URL detection with explainable AI",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
RF_MODEL = None
ISO_MODEL = None
SCALER = None
FEATURE_NAMES = None

@app.on_event("startup")
async def load_models():
    """Load all model artifacts on startup"""
    global RF_MODEL, ISO_MODEL, SCALER, FEATURE_NAMES
    
    try:
        logger.info("="*70)
        logger.info("🚀 STARTING CYBERSECURITY AGENT")
        logger.info("="*70)
        
        logger.info("📂 Loading model artifacts...")
        RF_MODEL = joblib.load('models/rf_model.pkl')
        logger.info("   ✅ RandomForest loaded")
        
        ISO_MODEL = joblib.load('models/iso_model.pkl')
        logger.info("   ✅ IsolationForest loaded")
        
        SCALER = joblib.load('models/scaler.pkl')
        logger.info("   ✅ Scaler loaded")
        
        with open('models/feature_names.json', 'r') as f:
            FEATURE_NAMES = json.load(f)
        logger.info(f"   ✅ Feature names loaded ({len(FEATURE_NAMES)} features)")
        
        logger.info("="*70)
        logger.info("✅ CYBERSECURITY AGENT READY!")
        logger.info("="*70)
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        raise

# Pydantic models
class URLCheckRequest(BaseModel):
    url: str

class SecurityIndicator(BaseModel):
    name: str
    value: float
    severity: str
    explanation: str

class URLCheckResponse(BaseModel):
    url: str
    prediction: str
    confidence: float
    risk_score: float
    indicators: List[SecurityIndicator]
    recommendation: str
    timestamp: str

def get_prediction_label(rf_prob: float, iso_pred: int) -> tuple:
    """
    Determine final prediction based on both models
    """
    # IsolationForest: -1 = anomaly (phishing), 1 = normal
    is_anomaly = (iso_pred == -1)
    
    # Ensemble logic
    if rf_prob > 0.7 or (rf_prob > 0.4 and is_anomaly):
        return "Phishing", "high"
    elif rf_prob > 0.4 or is_anomaly:
        return "Suspicious", "medium"
    else:
        return "Safe", "low"

def generate_recommendation(prediction: str, indicators: List[Dict]) -> str:
    """Generate actionable security recommendation"""
    
    if prediction == "Phishing":
        rec = "🚨 HIGH RISK: DO NOT visit this URL or enter any credentials. "
        rec += "This appears to be a phishing attempt. "
        
        if any(ind['name'] == 'has_ip' and ind['value'] == 1 for ind in indicators):
            rec += "URL uses IP address instead of domain name. "
        
        if any(ind['name'] == 'uses_https' and ind['value'] == 0 for ind in indicators):
            rec += "Connection is not encrypted (no HTTPS). "
        
        rec += "Block this URL and report to your IT security team."
        
    elif prediction == "Suspicious":
        rec = "⚠️ CAUTION: This URL shows suspicious characteristics. "
        rec += "Verify the legitimacy through official channels before visiting. "
        rec += "Do not enter sensitive information unless you're absolutely certain it's safe."
        
    else:  # Safe
        rec = "✅ This URL appears legitimate. However, always verify URLs carefully, "
        rec += "check for HTTPS, and be cautious about entering sensitive information."
    
    return rec

@app.get("/")
async def root():
    return {
        "service": "CyberSecurity Agent",
        "version": "1.0.0",
        "status": "operational",
        "model": "RandomForest + IsolationForest Ensemble",
        "capabilities": ["phishing_detection", "url_analysis", "risk_scoring"]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "rf_model_loaded": RF_MODEL is not None,
        "iso_model_loaded": ISO_MODEL is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/check-url", response_model=URLCheckResponse)
async def check_url(request: URLCheckRequest):
    """
    Analyze URL for phishing indicators
    Returns prediction with explainable indicators
    """
    try:
        logger.info(f"🔍 Analyzing URL: {request.url}")
        
        # Extract features
        features = extract_url_features(request.url)
        
        # Create DataFrame with all expected features
        X = pd.DataFrame(0, index=[0], columns=FEATURE_NAMES)
        for feat, val in features.items():
            if feat in FEATURE_NAMES:
                X[feat] = val
        
        # Scale features
        X_scaled = SCALER.transform(X)
        
        # Get predictions from both models
        rf_proba = RF_MODEL.predict_proba(X_scaled)[0, 1]
        iso_pred = ISO_MODEL.predict(X_scaled)[0]
        
        # Determine final prediction
        prediction, severity = get_prediction_label(rf_proba, iso_pred)
        
        # Calculate risk score (0-1)
        risk_score = rf_proba
        
        # Get confidence
        confidence = max(RF_MODEL.predict_proba(X_scaled)[0])
        
        # Extract top indicators
        feature_importance = RF_MODEL.feature_importances_
        top_indices = feature_importance.argsort()[-10:][::-1]
        
        indicators = []
        for idx in top_indices:
            feat_name = FEATURE_NAMES[idx]
            feat_value = features.get(feat_name, 0)
            
            # Determine severity
            if feat_name in ['has_ip', 'has_suspicious_keyword', 'has_suspicious_tld', 'has_punycode']:
                sev = "high" if feat_value == 1 else "low"
            elif feat_name in ['uses_https']:
                sev = "high" if feat_value == 0 else "low"
            elif feat_name in ['url_length', 'num_suspicious_keywords']:
                sev = "high" if feat_value > 2 else "medium" if feat_value > 0 else "low"
            else:
                sev = "medium"
            
            indicators.append(SecurityIndicator(
                name=feat_name,
                value=float(feat_value),
                severity=sev,
                explanation=get_feature_explanation(feat_name, feat_value)
            ))
        
        # Generate recommendation
        recommendation = generate_recommendation(
            prediction,
            [ind.dict() for ind in indicators]
        )
        
        logger.info(f"✅ Analysis complete: {prediction} (risk: {risk_score:.3f})")
        
        return URLCheckResponse(
            url=request.url,
            prediction=prediction,
            confidence=float(confidence),
            risk_score=float(risk_score),
            indicators=indicators,
            recommendation=recommendation,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"❌ Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"URL analysis failed: {str(e)}")

@app.post("/check-urls")
async def check_urls(urls: List[str]):
    """
    Batch URL analysis
    """
    try:
        results = []
        for url in urls[:50]:  # Limit to 50 URLs
            try:
                result = await check_url(URLCheckRequest(url=url))
                results.append(result)
            except:
                continue
        
        return {"results": results, "total": len(results)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    
    print("="*70)
    print("🛡️ CYBERSECURITY AGENT API")
    print("Phishing URL Detection with Explainable AI")
    print("="*70)
    
    uvicorn.run(app, host="0.0.0.0", port=8007)
