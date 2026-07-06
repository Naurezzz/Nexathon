"""
Financial Risk Agent - Production API v2.0
Compatible with train1.py (UCI dataset model)
Bankruptcy prediction with hybrid ML + rule-based scoring
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
import joblib
import json
from io import StringIO
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Financial Risk Agent API",
    description="Bankruptcy prediction with explainable AI (XGBoost + Rules)",
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

# Global variables for models
MODEL = None
SCALER = None
FEATURE_NAMES = None
METRICS = None

@app.on_event("startup")
async def load_models():
    """Load all model artifacts on startup"""
    global MODEL, SCALER, FEATURE_NAMES, METRICS
    
    try:
        logger.info("="*70)
        logger.info("🚀 STARTING FINANCIAL RISK AGENT v2.0")
        logger.info("="*70)
        
        logger.info("📂 Loading model artifacts...")
        
        # Load XGBoost model
        MODEL = joblib.load('models/bankruptcy_model.pkl')
        logger.info("   ✅ XGBoost model loaded")
        
        # Load scaler
        SCALER = joblib.load('models/scaler.pkl')
        logger.info("   ✅ Scaler loaded")
        
        # Load feature names
        with open('models/feature_names.json', 'r') as f:
            FEATURE_NAMES = json.load(f)
        logger.info(f"   ✅ Feature names loaded ({len(FEATURE_NAMES)} features)")
        
        # Load metrics (optional)
        if os.path.exists('models/metrics.json'):
            with open('models/metrics.json', 'r') as f:
                METRICS = json.load(f)
            logger.info(f"   ✅ Model metrics loaded (Accuracy: {METRICS.get('test_accuracy', 0)*100:.2f}%)")
        
        logger.info("="*70)
        logger.info("✅ FINANCIAL RISK AGENT READY!")
        logger.info("="*70)
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        logger.error("   Please run: python train1.py")
        raise

# Pydantic models
class FinancialData(BaseModel):
    current_assets: Optional[float] = None
    current_liabilities: Optional[float] = None
    total_assets: Optional[float] = None
    total_liabilities: Optional[float] = None
    equity: Optional[float] = None
    revenue: Optional[float] = None
    net_income: Optional[float] = None
    operating_income: Optional[float] = None
    cash: Optional[float] = None
    inventory: Optional[float] = None
    interest_expense: Optional[float] = None

class RiskFactor(BaseModel):
    feature: str
    value: float
    impact: float
    explanation: str

class RiskPrediction(BaseModel):
    risk_score: float
    risk_category: str
    confidence: float
    ml_prediction: float
    rule_based_score: float
    top_factors: List[RiskFactor]
    recommendations: List[str]
    timestamp: str

# Helper functions
def calculate_financial_ratios(data: Dict) -> pd.DataFrame:
    """Calculate financial ratios matching training data"""
    
    ratios = {}
    
    def get_val(key):
        val = data.get(key, 0)
        return float(val) if val is not None else 0.0
    
    current_assets = get_val('current_assets')
    current_liabilities = get_val('current_liabilities')
    total_assets = get_val('total_assets')
    total_liabilities = get_val('total_liabilities')
    equity = get_val('equity')
    revenue = get_val('revenue')
    net_income = get_val('net_income')
    operating_income = get_val('operating_income')
    cash = get_val('cash')
    inventory = get_val('inventory')
    interest_expense = get_val('interest_expense')
    
    eps = 1e-10
    
    # Calculate core ratios (matching Taiwan bankruptcy dataset features)
    # Current Ratio
    if current_liabilities > 0:
        ratios['Current_Ratio'] = current_assets / (current_liabilities + eps)
        ratios['Quick_Ratio'] = (current_assets - inventory) / (current_liabilities + eps)
        ratios['Cash_Ratio'] = cash / (current_liabilities + eps)
    
    # Leverage ratios
    if total_assets > 0:
        ratios['Debt_Ratio'] = total_liabilities / (total_assets + eps)
        ratios['Equity_Ratio'] = equity / (total_assets + eps)
    
    if equity > eps:
        ratios['Debt_to_Equity'] = total_liabilities / (equity + eps)
    
    # Profitability ratios
    if revenue > eps:
        ratios['Net_Profit_Margin'] = net_income / (revenue + eps)
        ratios['Operating_Margin'] = operating_income / (revenue + eps)
    
    if total_assets > 0:
        ratios['ROA'] = net_income / (total_assets + eps)
        ratios['Asset_Turnover'] = revenue / (total_assets + eps)
    
    if equity > eps:
        ratios['ROE'] = net_income / (equity + eps)
    
    # Interest coverage
    if interest_expense > eps:
        ratios['Interest_Coverage'] = operating_income / (interest_expense + eps)
    
    # Working capital
    ratios['Working_Capital'] = current_assets - current_liabilities
    
    return pd.DataFrame([ratios])

def calculate_rule_based_risk(data: Dict) -> float:
    """
    Rule-based risk scoring for accurate assessment
    Returns risk score between 0.0 (low risk) and 1.0 (high risk)
    """
    risk_score = 0.0
    
    current_assets = float(data.get('current_assets', 0))
    current_liabilities = float(data.get('current_liabilities', 1))
    total_assets = float(data.get('total_assets', 1))
    total_liabilities = float(data.get('total_liabilities', 0))
    equity = float(data.get('equity', 0))
    revenue = float(data.get('revenue', 1))
    net_income = float(data.get('net_income', 0))
    cash = float(data.get('cash', 0))
    
    # 1. Negative equity (CRITICAL - 40 points)
    if equity < 0:
        risk_score += 0.4
        logger.info("   ⚠️ Negative equity (+0.4 risk)")
    
    # 2. Current ratio (Liquidity - up to 20 points)
    current_ratio = current_assets / max(current_liabilities, 1)
    if current_ratio < 1.0:
        risk_score += 0.2
        logger.info(f"   ⚠️ Current ratio {current_ratio:.2f} < 1.0 (+0.2 risk)")
    elif current_ratio < 1.5:
        risk_score += 0.1
    
    # 3. Debt-to-Assets (Leverage - up to 20 points)
    debt_ratio = total_liabilities / max(total_assets, 1)
    if debt_ratio > 0.8:
        risk_score += 0.2
        logger.info(f"   ⚠️ Debt ratio {debt_ratio:.2f} > 0.8 (+0.2 risk)")
    elif debt_ratio > 0.6:
        risk_score += 0.1
    
    # 4. Profitability (15 points)
    if net_income < 0:
        risk_score += 0.15
        logger.info("   ⚠️ Negative net income (+0.15 risk)")
    
    # 5. Cash position (15 points)
    cash_ratio = cash / max(current_liabilities, 1)
    if cash_ratio < 0.1:
        risk_score += 0.15
    elif cash_ratio < 0.2:
        risk_score += 0.05
    
    final_score = min(risk_score, 1.0)
    logger.info(f"   📊 Rule-based risk: {final_score:.3f}")
    
    return final_score

def get_risk_category(score: float) -> str:
    """Categorize risk score"""
    if score < 0.3:
        return "Low"
    elif score < 0.5:
        return "Medium"
    elif score < 0.7:
        return "High"
    else:
        return "Critical"

def generate_recommendations(risk_category: str, data: Dict) -> List[str]:
    """Generate actionable recommendations"""
    recommendations = []
    
    equity = float(data.get('equity', 0))
    net_income = float(data.get('net_income', 0))
    current_assets = float(data.get('current_assets', 0))
    current_liabilities = float(data.get('current_liabilities', 1))
    total_liabilities = float(data.get('total_liabilities', 0))
    total_assets = float(data.get('total_assets', 1))
    cash = float(data.get('cash', 0))
    
    if risk_category in ["Critical", "High"]:
        if equity < 0:
            recommendations.append("🚨 CRITICAL: Negative equity - immediate capital injection or debt restructuring required")
        if net_income < 0:
            recommendations.append("⚠️ Negative profitability - urgent cost reduction and revenue optimization needed")
        if current_assets < current_liabilities:
            recommendations.append("💰 Liquidity crisis - consider asset liquidation or emergency financing")
        
        debt_ratio = total_liabilities / max(total_assets, 1)
        if debt_ratio > 0.7:
            recommendations.append("📉 High leverage - prioritize debt reduction")
        
        recommendations.append("📊 Engage financial restructuring consultant immediately")
        
    elif risk_category == "Medium":
        recommendations.append("⚠️ Monitor financial health closely - develop 90-day improvement plan")
        if net_income < 0:
            recommendations.append("📈 Focus on returning to profitability")
        recommendations.append("💼 Improve working capital management")
        
    else:  # Low risk
        recommendations.append("✅ Healthy financial position - maintain current discipline")
        recommendations.append("📈 Continue monitoring key ratios quarterly")
        recommendations.append("💡 Maintain strong cash reserves")
    
    return recommendations

# API Routes
@app.get("/")
async def root():
    accuracy = METRICS.get('test_accuracy', 0)*100 if METRICS else 0
    return {
        "service": "Financial Risk Agent",
        "version": "2.0.0",
        "status": "operational",
        "model": "XGBoost + Rule-Based (Hybrid)",
        "accuracy": f"{accuracy:.2f}%",
        "dataset": METRICS.get('dataset_type', 'unknown') if METRICS else 'unknown'
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "scaler_loaded": SCALER is not None,
        "features": len(FEATURE_NAMES) if FEATURE_NAMES else 0,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict", response_model=RiskPrediction)
async def predict_risk(data: FinancialData):
    """
    Predict bankruptcy risk using hybrid ML + rule-based approach
    """
    try:
        logger.info("📊 Received prediction request")
        
        data_dict = {k: v for k, v in data.dict().items() if v is not None}
        
        if not data_dict:
            raise HTTPException(status_code=400, detail="No financial data provided")
        
        logger.info(f"   Input: {list(data_dict.keys())}")
        
        # 1. Rule-based scoring (always works)
        rule_risk_score = calculate_rule_based_risk(data_dict)
        
        # 2. ML prediction (if possible)
        ml_risk_score = 0.5  # Default
        try:
            ratios_df = calculate_financial_ratios(data_dict)
            
            # Create feature vector matching training
            X = pd.DataFrame(0, index=[0], columns=FEATURE_NAMES)
            for col in ratios_df.columns:
                if col in FEATURE_NAMES:
                    X[col] = ratios_df[col].values[0]
            
            # Scale and predict
            X_scaled = SCALER.transform(X)
            ml_risk_score = float(MODEL.predict_proba(X_scaled)[0, 1])
            
            logger.info(f"   ML prediction: {ml_risk_score:.3f}")
            
        except Exception as e:
            logger.warning(f"   ML prediction unavailable: {e}")
        
        # 3. Hybrid: 70% rules (reliable) + 30% ML (pattern detection)
        final_risk_score = (0.7 * rule_risk_score) + (0.3 * ml_risk_score)
        logger.info(f"   Final: Rule {rule_risk_score:.3f} + ML {ml_risk_score:.3f} = {final_risk_score:.3f}")
        
        # Categorize risk
        risk_category = get_risk_category(final_risk_score)
        confidence = 1.0 - abs(final_risk_score - 0.5) * 2
        
        # Generate top risk factors
        top_factors = []
        
        equity = float(data_dict.get('equity', 0))
        if equity < 0:
            top_factors.append(RiskFactor(
                feature="Negative Equity",
                value=equity,
                impact=0.4,
                explanation=f"Equity is negative (${equity:,.0f}) - critical distress"
            ))
        
        current_assets = float(data_dict.get('current_assets', 0))
        current_liabilities = float(data_dict.get('current_liabilities', 1))
        current_ratio = current_assets / max(current_liabilities, 1)
        if current_ratio < 1.5:
            top_factors.append(RiskFactor(
                feature="Current Ratio",
                value=current_ratio,
                impact=0.2 if current_ratio < 1.0 else 0.1,
                explanation=f"Current ratio {current_ratio:.2f} indicates liquidity concerns"
            ))
        
        total_liabilities = float(data_dict.get('total_liabilities', 0))
        total_assets = float(data_dict.get('total_assets', 1))
        debt_ratio = total_liabilities / max(total_assets, 1)
        if debt_ratio > 0.6:
            top_factors.append(RiskFactor(
                feature="Debt Ratio",
                value=debt_ratio,
                impact=0.2 if debt_ratio > 0.8 else 0.1,
                explanation=f"Debt ratio {debt_ratio:.2%} shows elevated leverage"
            ))
        
        net_income = float(data_dict.get('net_income', 0))
        if net_income < 0:
            top_factors.append(RiskFactor(
                feature="Net Income",
                value=net_income,
                impact=0.15,
                explanation=f"Negative net income (${net_income:,.0f})"
            ))
        
        # Generate recommendations
        recommendations = generate_recommendations(risk_category, data_dict)
        
        logger.info(f"✅ Prediction: {risk_category} ({final_risk_score:.3f})")
        
        return RiskPrediction(
            risk_score=float(final_risk_score),
            risk_category=risk_category,
            confidence=float(confidence),
            ml_prediction=float(ml_risk_score),
            rule_based_score=float(rule_risk_score),
            top_factors=top_factors[:5],
            recommendations=recommendations,
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/file")
async def predict_from_file(file: UploadFile = File(...)):
    """Predict risk from uploaded CSV/Excel file"""
    try:
        logger.info(f"📂 Received file: {file.filename}")
        
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(StringIO(content.decode('utf-8')))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        if len(df) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        df.columns = [col.lower().strip().replace(' ', '_') for col in df.columns]
        data_dict = df.iloc[0].to_dict()
        financial_data = FinancialData(**{k: v for k, v in data_dict.items() if pd.notna(v)})
        
        return await predict_risk(financial_data)
        
    except Exception as e:
        logger.error(f"❌ File error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    print("="*70)
    print("🚀 FINANCIAL RISK AGENT API v2.0")
    print("Hybrid: XGBoost + Rule-Based Prediction")
    print("="*70)
    
    uvicorn.run(app, host="0.0.0.0", port=8006)
