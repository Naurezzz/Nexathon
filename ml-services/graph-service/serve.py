from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
from graph_analyzer import FraudGraphAnalyzer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AEGIS-AI Risk Graph Engine",
    description="AI-powered fraud network detection and visualization",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = FraudGraphAnalyzer()

class InvoiceData(BaseModel):
    invoice_no: str
    vendor: str
    company_id: Optional[str] = "COMPANY_001"
    total_amount: float
    fraud_score: float

class GraphAnalysisRequest(BaseModel):
    invoices: List[InvoiceData]

@app.get("/")
async def root():
    return {
        "service": "AEGIS-AI Risk Graph Engine",
        "status": "operational",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "analyzer": "loaded"}

@app.post("/analyze-network")
async def analyze_network(request: GraphAnalysisRequest):
    """
    Analyze invoice network and detect fraud patterns
    """
    try:
        logger.info(f"Analyzing network with {len(request.invoices)} invoices")
        
        invoices_data = [inv.dict() for inv in request.invoices]
        result = analyzer.analyze_invoice_network(invoices_data)
        
        logger.info(f"✅ Network analysis complete. Found {result['statistics']['fraud_clusters_detected']} fraud clusters")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Network analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8009)
