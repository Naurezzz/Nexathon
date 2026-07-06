"""
CyberSecurity Agent - Phishing URL Detection API (ULTIMATE VERSION)
XGBoost + GradientBoosting + RandomForest ensemble with 55+ features
Compatible with train_phishing_ultimate.py
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
import joblib
import json
from datetime import datetime
import re
from urllib.parse import urlparse
import tldextract
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="CyberSecurity Agent API - Ultimate",
    description="Phishing URL detection with XGBoost ensemble (95%+ accuracy)",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
ENSEMBLE = None
SCALER = None
FEATURE_NAMES = None
MODEL_CONFIG = None


def extract_elite_features(url):
    """Extract 55+ elite features (SAME as training script)"""
    
    features = {}
    url_lower = url.lower()
    
    try:
        parsed = urlparse(url)
        
        # === BASIC FEATURES (10) ===
        features['url_length'] = len(url)
        features['domain_length'] = len(parsed.netloc)
        features['path_length'] = len(parsed.path)
        features['query_length'] = len(parsed.query)
        features['fragment_length'] = len(parsed.fragment)
        features['num_params'] = parsed.query.count('=')
        features['hostname_length'] = len(parsed.hostname) if parsed.hostname else 0
        features['tld_position'] = url.rfind('.')
        features['path_tokens'] = len(parsed.path.split('/')) if parsed.path else 0
        features['url_depth'] = url.count('/')
        
        # === CHARACTER COUNTS (15) ===
        features['num_dots'] = url.count('.')
        features['num_hyphens'] = url.count('-')
        features['num_underscores'] = url.count('_')
        features['num_slashes'] = url.count('/')
        features['num_questionmarks'] = url.count('?')
        features['num_equals'] = url.count('=')
        features['num_ats'] = url.count('@')
        features['num_ampersands'] = url.count('&')
        features['num_percents'] = url.count('%')
        features['num_digits'] = sum(c.isdigit() for c in url)
        features['num_letters'] = sum(c.isalpha() for c in url)
        features['num_uppercase'] = sum(c.isupper() for c in url)
        features['num_special'] = len(re.findall(r'[^a-zA-Z0-9]', url))
        features['consecutive_consonants'] = len(max(re.findall(r'[bcdfghjklmnpqrstvwxyz]+', url_lower), key=len, default=''))
        features['max_digit_sequence'] = len(max(re.findall(r'\d+', url), key=len, default=''))
        
        # === RATIOS (10) ===
        url_len = max(len(url), 1)
        features['digit_ratio'] = features['num_digits'] / url_len
        features['letter_ratio'] = features['num_letters'] / url_len
        features['special_ratio'] = features['num_special'] / url_len
        features['uppercase_ratio'] = features['num_uppercase'] / url_len
        features['dot_ratio'] = features['num_dots'] / url_len
        features['hyphen_ratio'] = features['num_hyphens'] / url_len
        features['path_domain_ratio'] = features['path_length'] / max(features['domain_length'], 1)
        features['query_domain_ratio'] = features['query_length'] / max(features['domain_length'], 1)
        features['vowel_ratio'] = sum(1 for c in url_lower if c in 'aeiou') / url_len
        features['consonant_ratio'] = sum(1 for c in url_lower if c in 'bcdfghjklmnpqrstvwxyz') / url_len
        
        # === PROTOCOL & SECURITY (5) ===
        features['is_https'] = 1 if url.startswith('https://') else 0
        features['is_http'] = 1 if url.startswith('http://') else 0
        features['has_port'] = 1 if ':' in parsed.netloc and any(c.isdigit() for c in parsed.netloc.split(':')[-1]) else 0
        features['non_standard_port'] = 1 if features['has_port'] and not parsed.netloc.endswith((':80', ':443')) else 0
        features['has_www'] = 1 if 'www.' in parsed.netloc else 0
        
        # === SUSPICIOUS PATTERNS (10) ===
        features['has_ip'] = 1 if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', parsed.netloc) else 0
        features['has_hexadecimal'] = 1 if re.search(r'0x[0-9a-f]+', url_lower) else 0
        features['double_slash_path'] = url.count('//')
        features['suspicious_tld'] = 1 if any(tld in url_lower for tld in ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work', '.click']) else 0
        features['has_redirect'] = 1 if any(word in url_lower for word in ['redirect', 'redir', 'goto', 'out', 'away']) else 0
        features['tiny_url'] = 1 if any(short in parsed.netloc for short in ['bit.ly', 'goo.gl', 'tinyurl', 't.co', 'ow.ly', 'is.gd']) else 0
        features['encoded_chars'] = url.count('%')
        features['base64_like'] = 1 if re.search(r'[A-Za-z0-9+/]{20,}={0,2}', url) else 0
        features['has_dash_domain'] = 1 if '-' in parsed.netloc else 0
        features['has_multiple_subdomains'] = 1 if parsed.netloc.count('.') > 3 else 0
        
        # === TLD & DOMAIN ANALYSIS (8) ===
        try:
            ext = tldextract.extract(url)
            features['subdomain_count'] = len(ext.subdomain.split('.')) if ext.subdomain else 0
            features['subdomain_length'] = len(ext.subdomain) if ext.subdomain else 0
            features['domain_token_count'] = len(ext.domain.split('-')) if ext.domain else 1
            features['domain_has_digits'] = 1 if any(c.isdigit() for c in ext.domain) else 0
            features['tld_length'] = len(ext.suffix)
            features['domain_entropy'] = -sum((ext.domain.count(c)/len(ext.domain)) * np.log2(ext.domain.count(c)/len(ext.domain)) 
                                             for c in set(ext.domain)) if ext.domain else 0
            features['is_common_tld'] = 1 if ext.suffix in ['com', 'org', 'net', 'edu', 'gov'] else 0
            features['domain_word_count'] = len(re.findall(r'[a-z]{3,}', ext.domain.lower())) if ext.domain else 0
        except:
            features.update({f'tld_feat_{i}': 0 for i in range(8)})
        
        # === BRAND IMPERSONATION (5) ===
        brands = ['google', 'facebook', 'amazon', 'microsoft', 'apple', 'paypal', 'netflix', 'instagram']
        domain_str = parsed.netloc.lower()
        features['brand_in_subdomain'] = 1 if any(b in domain_str.split('.')[0] for b in brands) else 0
        features['brand_typosquatting'] = 1 if any(
            (b in domain_str and not domain_str.endswith(f'{b}.com'))
            for b in brands
        ) else 0
        features['multiple_brands'] = sum(1 for b in brands if b in domain_str)
        features['brand_with_dash'] = 1 if any(f'{b}-' in domain_str or f'-{b}' in domain_str for b in brands) else 0
        features['fake_login'] = 1 if 'login' in url_lower and not any(domain_str.endswith(f'{b}.com') for b in brands) else 0
        
        # === SUSPICIOUS KEYWORDS (7) ===
        phishing_keywords = [
            'verify', 'account', 'update', 'secure', 'signin', 'confirm',
            'suspended', 'locked', 'urgent', 'alert', 'notification',
            'banking', 'password', 'credential', 'validate', 'restore'
        ]
        features['phishing_keyword_count'] = sum(1 for kw in phishing_keywords if kw in url_lower)
        features['has_verify'] = 1 if 'verify' in url_lower else 0
        features['has_secure'] = 1 if 'secure' in url_lower else 0
        features['has_account'] = 1 if 'account' in url_lower else 0
        features['has_signin'] = 1 if any(w in url_lower for w in ['signin', 'sign-in', 'login']) else 0
        features['has_suspended'] = 1 if any(w in url_lower for w in ['suspend', 'locked', 'blocked']) else 0
        features['has_urgent'] = 1 if any(w in url_lower for w in ['urgent', 'immediate', 'asap']) else 0
        
    except Exception as e:
        return {f'feature_{i}': 0 for i in range(55)}
    
    return features


@app.on_event("startup")
async def load_models():
    """Load ultimate ensemble models on startup"""
    global ENSEMBLE, SCALER, FEATURE_NAMES, MODEL_CONFIG
    
    try:
        logger.info("="*70)
        logger.info("🚀 STARTING ULTIMATE CYBERSECURITY AGENT")
        logger.info("="*70)
        
        logger.info("📂 Loading ultimate ensemble...")
        ENSEMBLE = joblib.load('models/phishing_ultimate.pkl')
        logger.info(f"   ✅ Loaded {len(ENSEMBLE['models'])} models")
        
        SCALER = joblib.load('models/scaler.pkl')
        logger.info("   ✅ Scaler loaded")
        
        with open('models/feature_names.json', 'r') as f:
            FEATURE_NAMES = json.load(f)
        logger.info(f"   ✅ {len(FEATURE_NAMES)} features loaded")
        
        with open('models/phishing_model_config.json', 'r') as f:
            MODEL_CONFIG = json.load(f)
        logger.info(f"   ✅ Config loaded (Accuracy: {MODEL_CONFIG['metrics']['accuracy']*100:.2f}%)")
        
        logger.info("="*70)
        logger.info("✅ ULTIMATE AGENT READY!")
        logger.info("="*70)
        
    except FileNotFoundError as e:
        logger.error(f"❌ Model files not found: {e}")
        logger.error("⚠️  Please run: python train_phishing_ultimate.py")
        raise
    except Exception as e:
        logger.error(f"❌ Error: {e}")
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
    model_info: Dict


@app.get("/")
async def root():
    accuracy = MODEL_CONFIG['metrics']['accuracy'] * 100 if MODEL_CONFIG else 0
    return {
        "service": "CyberSecurity Agent Ultimate",
        "version": "2.0.0",
        "status": "operational",
        "model": "XGBoost + GradientBoosting + RandomForest Ensemble",
        "accuracy": f"{accuracy:.2f}%",
        "features": len(FEATURE_NAMES) if FEATURE_NAMES else 0
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "models_loaded": ENSEMBLE is not None,
        "accuracy": MODEL_CONFIG['metrics']['accuracy'] * 100 if MODEL_CONFIG else 0,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/check-url", response_model=URLCheckResponse)
async def check_url(request: URLCheckRequest):
    """Analyze URL using ultimate ensemble"""
    try:
        logger.info(f"🔍 Analyzing: {request.url}")
        
        # Extract features
        features = extract_elite_features(request.url)
        
        # Create DataFrame
        X = pd.DataFrame([features])
        
        # Ensure column order matches training
        X = X.reindex(columns=FEATURE_NAMES, fill_value=0)
        
        # Scale
        X_scaled = SCALER.transform(X)
        
        # Get predictions from ensemble
        models = ENSEMBLE['models']
        weights = ENSEMBLE['weights']
        
        # Weighted ensemble prediction
        ensemble_proba = 0
        for name, model in models.items():
            proba = model.predict_proba(X_scaled)[0, 1]
            ensemble_proba += proba * weights[name]
        
        # Determine prediction
        risk_score = float(ensemble_proba)
        
        if risk_score > 0.7:
            prediction = "Phishing"
            confidence = risk_score
        elif risk_score > 0.4:
            prediction = "Suspicious"
            confidence = risk_score
        else:
            prediction = "Safe"
            confidence = 1 - risk_score
        
        # Get top indicators
        indicators = []
        top_features = [
            ('has_ip', features.get('has_ip', 0)),
            ('suspicious_tld', features.get('suspicious_tld', 0)),
            ('is_https', features.get('is_https', 0)),
            ('brand_typosquatting', features.get('brand_typosquatting', 0)),
            ('phishing_keyword_count', features.get('phishing_keyword_count', 0)),
            ('has_dash_domain', features.get('has_dash_domain', 0)),
            ('url_length', features.get('url_length', 0)),
            ('has_port', features.get('has_port', 0)),
        ]
        
        for feat_name, feat_value in top_features:
            severity = "high" if (feat_name in ['has_ip', 'suspicious_tld', 'brand_typosquatting'] and feat_value == 1) else "medium"
            
            explanations = {
                'has_ip': f"URL uses IP address: {'YES - SUSPICIOUS' if feat_value else 'No'}", 
                'suspicious_tld': f"Suspicious TLD (.tk/.ml/.ga): {'YES - HIGH RISK' if feat_value else 'No'}",
                'is_https': f"HTTPS encryption: {'YES - Good' if feat_value else 'NO - RISK'}",
                'brand_typosquatting': f"Brand impersonation: {'DETECTED - PHISHING' if feat_value else 'Not detected'}",
                'phishing_keyword_count': f"Phishing keywords: {int(feat_value)} found",
                'has_dash_domain': f"Domain contains hyphens: {'Yes' if feat_value else 'No'}",
                'url_length': f"URL length: {int(feat_value)} characters",
                'has_port': f"Non-standard port: {'YES - Suspicious' if feat_value else 'No'}"
            }
            
            indicators.append(SecurityIndicator(
                name=feat_name,
                value=float(feat_value),
                severity=severity,
                explanation=explanations.get(feat_name, f"{feat_name}: {feat_value}")
            ))
        
        # Recommendation
        if prediction == "Phishing":
            recommendation = "🚨 HIGH RISK: DO NOT visit this URL. Likely phishing attempt. Block and report."
        elif prediction == "Suspicious":
            recommendation = "⚠️ CAUTION: Verify legitimacy before visiting. Do not enter credentials."
        else:
            recommendation = "✅ URL appears safe. Always verify HTTPS and domain carefully."
        
        logger.info(f"✅ Result: {prediction} (risk: {risk_score:.3f})")
        
        return URLCheckResponse(
            url=request.url,
            prediction=prediction,
            confidence=float(confidence),
            risk_score=risk_score,
            indicators=indicators,
            recommendation=recommendation,
            timestamp=datetime.now().isoformat(),
            model_info={
                "type": "Ultimate Ensemble",
                "accuracy": f"{MODEL_CONFIG['metrics']['accuracy']*100:.2f}%",
                "models": list(models.keys())
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/check-urls")
async def check_urls(urls: List[str]):
    """Batch URL analysis"""
    try:
        results = []
        for url in urls[:50]:
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
    print("🛡️ ULTIMATE CYBERSECURITY AGENT API")
    print("95%+ Accuracy Phishing Detection")
    print("="*70)
    
    uvicorn.run(app, host="0.0.0.0", port=8010)
