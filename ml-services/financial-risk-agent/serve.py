"""
Financial Risk Agent - Production API
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
import shap
from io import StringIO
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Financial Risk Agent API",
    description="Bankruptcy prediction with explainable AI (SHAP + Rules)",
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
MODEL = None
SCALER = None
SHAP_EXPLAINER = None
FEATURE_NAMES = None

@app.on_event("startup")
async def load_models():
    """Load all model artifacts on startup"""
    global MODEL, SCALER, SHAP_EXPLAINER, FEATURE_NAMES
    
    try:
        logger.info("="*70)
        logger.info("🚀 STARTING FINANCIAL RISK AGENT")
        logger.info("="*70)
        
        logger.info("📂 Loading model artifacts...")
        MODEL = joblib.load('models/bankruptcy_model.pkl')
        logger.info("   ✅ XGBoost model loaded")
        
        SCALER = joblib.load('models/scaler.pkl')
        logger.info("   ✅ Scaler loaded")
        
        SHAP_EXPLAINER = joblib.load('models/shap_explainer.pkl')
        logger.info("   ✅ SHAP explainer loaded")
        
        with open('models/feature_names.json', 'r') as f:
            FEATURE_NAMES = json.load(f)
        logger.info(f"   ✅ Feature names loaded ({len(FEATURE_NAMES)} features)")
        
        logger.info("="*70)
        logger.info("✅ FINANCIAL RISK AGENT READY!")
        logger.info("="*70)
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
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
    top_factors: List[RiskFactor]
    recommendations: List[str]
    timestamp: str

# Helper functions
def calculate_ratios(data: Dict) -> pd.DataFrame:
    """Calculate financial ratios from balance sheet data"""
    
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
    
    # Core financial ratios
    if current_liabilities > 0:
        ratios['Attr1'] = current_assets / (current_liabilities + eps)
        if cash > 0:
            ratios['Attr2'] = cash / (current_liabilities + eps)
        if inventory >= 0:
            quick_assets = current_assets - inventory
            ratios['Attr3'] = quick_assets / (current_liabilities + eps)
    
    if equity > eps:
        ratios['Attr4'] = total_liabilities / (equity + eps)
    elif equity < 0:
        ratios['Attr4'] = 10.0
    
    if total_assets > 0:
        ratios['Attr5'] = total_liabilities / (total_assets + eps)
    
    if revenue > eps:
        ratios['Attr6'] = net_income / (revenue + eps)
    
    if total_assets > 0:
        ratios['Attr7'] = net_income / (total_assets + eps)
    
    if equity > eps:
        ratios['Attr8'] = net_income / (equity + eps)
    elif equity < 0:
        ratios['Attr8'] = -10.0
    
    if total_assets > 0:
        ratios['Attr9'] = revenue / (total_assets + eps)
    
    if interest_expense > eps:
        ratios['Attr10'] = operating_income / (interest_expense + eps)
    
    ratios['Attr11'] = current_assets - current_liabilities
    
    if 'Attr1' in ratios:
        ratios['Attr12'] = ratios['Attr1'] ** 2
    
    if 'Attr7' in ratios and 'Attr9' in ratios:
        ratios['Attr13'] = ratios['Attr7'] * ratios['Attr9']
    
    if current_assets > 0:
        ratios['Attr14'] = cash / (current_assets + eps)
    
    if total_assets > 0:
        ratios['Attr15'] = equity / (total_assets + eps)
    
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
        logger.info("   ⚠️ Negative equity detected (+0.4 risk)")
    
    # 2. Current ratio (Liquidity - up to 20 points)
    current_ratio = current_assets / max(current_liabilities, 1)
    if current_ratio < 1.0:
        risk_score += 0.2
        logger.info(f"   ⚠️ Current ratio {current_ratio:.2f} < 1.0 (+0.2 risk)")
    elif current_ratio < 1.5:
        risk_score += 0.1
        logger.info(f"   ⚠️ Current ratio {current_ratio:.2f} < 1.5 (+0.1 risk)")
    
    # 3. Debt-to-Assets (Leverage - up to 20 points)
    debt_ratio = total_liabilities / max(total_assets, 1)
    if debt_ratio > 0.8:
        risk_score += 0.2
        logger.info(f"   ⚠️ Debt ratio {debt_ratio:.2f} > 0.8 (+0.2 risk)")
    elif debt_ratio > 0.6:
        risk_score += 0.1
        logger.info(f"   ⚠️ Debt ratio {debt_ratio:.2f} > 0.6 (+0.1 risk)")
    
    # 4. Profitability (15 points)
    if net_income < 0:
        risk_score += 0.15
        logger.info("   ⚠️ Negative net income (+0.15 risk)")
    else:
        profit_margin = net_income / max(revenue, 1)
        if profit_margin < 0.05:
            risk_score += 0.1
            logger.info(f"   ⚠️ Low profit margin {profit_margin:.2%} (+0.1 risk)")
    
    # 5. Cash position (15 points)
    cash_ratio = cash / max(current_liabilities, 1)
    if cash_ratio < 0.1:
        risk_score += 0.15
        logger.info(f"   ⚠️ Very low cash ratio {cash_ratio:.2f} (+0.15 risk)")
    elif cash_ratio < 0.2:
        risk_score += 0.05
        logger.info(f"   ⚠️ Low cash ratio {cash_ratio:.2f} (+0.05 risk)")
    
    final_score = min(risk_score, 1.0)
    logger.info(f"   📊 Rule-based risk score: {final_score:.3f}")
    
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

def generate_recommendations(risk_category: str, data: Dict, ratios: pd.DataFrame) -> List[str]:
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
            recommendations.append("🚨 CRITICAL: Negative equity detected - immediate capital injection or debt restructuring required")
        if net_income < 0:
            recommendations.append("⚠️ Negative profitability - urgent cost reduction and revenue optimization needed")
        if current_assets < current_liabilities:
            recommendations.append("💰 Liquidity crisis - consider asset liquidation, emergency financing, or payment rescheduling")
        
        debt_ratio = total_liabilities / max(total_assets, 1)
        if debt_ratio > 0.7:
            recommendations.append("📉 High leverage - prioritize debt reduction through refinancing or equity financing")
        
        cash_ratio = cash / max(current_liabilities, 1)
        if cash_ratio < 0.2:
            recommendations.append("💵 Critical cash shortage - implement emergency cash preservation measures")
        
        recommendations.append("📊 Engage financial restructuring consultant immediately")
        recommendations.append("🤝 Proactive communication with creditors essential to avoid default")
        
    elif risk_category == "Medium":
        recommendations.append("⚠️ Monitor financial health closely - develop 90-day improvement plan")
        if net_income < 0:
            recommendations.append("📈 Focus on returning to profitability through cost optimization")
        
        current_ratio = current_assets / max(current_liabilities, 1)
        if current_ratio < 1.5:
            recommendations.append("💼 Improve working capital management - accelerate collections, optimize inventory")
        
        recommendations.append("📊 Strengthen balance sheet through improved cash flow management")
        recommendations.append("🎯 Set quarterly financial targets and track progress rigorously")
        
    else:  # Low risk
        recommendations.append("✅ Company shows healthy financial position - maintain current discipline")
        recommendations.append("📈 Continue monitoring key ratios quarterly to prevent deterioration")
        recommendations.append("💡 Maintain strong cash reserves for future opportunities or downturns")
        recommendations.append("🎯 Focus on sustainable growth while preserving financial stability")
    
    return recommendations

# API Routes
@app.get("/")
async def root():
    return {
        "service": "Financial Risk Agent",
        "version": "2.0.0",
        "status": "operational",
        "model": "Hybrid: XGBoost + Rule-Based Scoring",
        "capabilities": ["bankruptcy_prediction", "risk_scoring", "explainable_ai"]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "shap_loaded": SHAP_EXPLAINER is not None,
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
        
        # Calculate rule-based risk (primary)
        rule_risk_score = calculate_rule_based_risk(data_dict)
        
        # Calculate ratios for ML model
        ratios_df = calculate_ratios(data_dict)
        
        # Try ML prediction as secondary validation
        try:
            X = pd.DataFrame(0, index=[0], columns=FEATURE_NAMES)
            for col in ratios_df.columns:
                if col in FEATURE_NAMES:
                    X[col] = ratios_df[col].values[0]
            
            X_scaled = SCALER.transform(X)
            ml_risk_score = float(MODEL.predict_proba(X_scaled)[0, 1])
            
            # Hybrid: 80% rules (reliable), 20% ML (pattern detection)
            final_risk_score = (0.8 * rule_risk_score) + (0.2 * ml_risk_score)
            logger.info(f"   Rule: {rule_risk_score:.3f}, ML: {ml_risk_score:.3f}, Final: {final_risk_score:.3f}")
            
        except Exception as e:
            logger.warning(f"ML prediction failed, using rules only: {e}")
            final_risk_score = rule_risk_score
        
        # Categorize risk
        risk_category = get_risk_category(final_risk_score)
        confidence = 1.0 - abs(final_risk_score - 0.5) * 2  # Higher confidence at extremes
        
        # Generate top factors from rules
        top_factors = []
        
        equity = float(data_dict.get('equity', 0))
        if equity < 0:
            top_factors.append(RiskFactor(
                feature="Negative Equity",
                value=equity,
                impact=0.4,
                explanation=f"Equity is negative (${equity:,.0f}) - critical financial distress indicator"
            ))
        
        current_assets = float(data_dict.get('current_assets', 0))
        current_liabilities = float(data_dict.get('current_liabilities', 1))
        current_ratio = current_assets / max(current_liabilities, 1)
        if current_ratio < 1.5:
            top_factors.append(RiskFactor(
                feature="Current Ratio",
                value=current_ratio,
                impact=0.2 if current_ratio < 1.0 else 0.1,
                explanation=f"Current ratio {current_ratio:.2f} indicates {'severe' if current_ratio < 1 else 'moderate'} liquidity concerns"
            ))
        
        total_liabilities = float(data_dict.get('total_liabilities', 0))
        total_assets = float(data_dict.get('total_assets', 1))
        debt_ratio = total_liabilities / max(total_assets, 1)
        if debt_ratio > 0.6:
            top_factors.append(RiskFactor(
                feature="Debt-to-Assets Ratio",
                value=debt_ratio,
                impact=0.2 if debt_ratio > 0.8 else 0.1,
                explanation=f"Debt ratio {debt_ratio:.2%} shows {'excessive' if debt_ratio > 0.8 else 'elevated'} leverage"
            ))
        
        net_income = float(data_dict.get('net_income', 0))
        if net_income < 0:
            top_factors.append(RiskFactor(
                feature="Net Income",
                value=net_income,
                impact=0.15,
                explanation=f"Negative net income (${net_income:,.0f}) indicates unprofitability"
            ))
        
        cash = float(data_dict.get('cash', 0))
        cash_ratio = cash / max(current_liabilities, 1)
        if cash_ratio < 0.2:
            top_factors.append(RiskFactor(
                feature="Cash Ratio",
                value=cash_ratio,
                impact=0.15 if cash_ratio < 0.1 else 0.05,
                explanation=f"Cash ratio {cash_ratio:.2f} shows {'critical' if cash_ratio < 0.1 else 'low'} cash reserves"
            ))
        
        # Generate recommendations
        recommendations = generate_recommendations(risk_category, data_dict, ratios_df)
        
        logger.info(f"✅ Prediction: {risk_category} ({final_risk_score:.3f})")
        
        return RiskPrediction(
            risk_score=float(final_risk_score),
            risk_category=risk_category,
            confidence=float(confidence),
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
    print("Hybrid ML + Rule-Based Bankruptcy Prediction")
    print("="*70)
    
    uvicorn.run(app, host="0.0.0.0", port=8006)
