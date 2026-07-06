"""
AEGIS-AI: Business Document Forgery Detection Service
FastAPI with ResNet50 Model | Dual-Task Detection
WITH BLOCKCHAIN INTEGRATION
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import pytesseract
import io
import numpy as np
import json
import logging
import hashlib
from datetime import datetime
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AEGIS-AI Document Forgery Detection",
    description="Business document validation with ResNet50 + Dual-Task Learning + Blockchain",
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

# Blockchain API endpoint
BLOCKCHAIN_API = "http://localhost:8007"

# Document classes (Business documents only - matches training)
DOCUMENT_CLASSES = {
    0: 'INVOICE',
    1: 'RECEIPT',
    2: 'CONTRACT',
    3: 'STATEMENT',
    4: 'CERTIFICATE'
}

FORGERY_LABELS = {
    0: 'AUTHENTIC',
    1: 'FORGED'
}

# ✅ CORRECTED MODEL ARCHITECTURE (matches training script exactly)
class DocumentForgeryDetector(nn.Module):
    """
    Dual-Task CNN:
    1. Document Type Classification (5 classes)
    2. Forgery Detection (Binary)
    """
    
    def __init__(self, num_doc_classes=5):
        super().__init__()
        
        # Backbone: ResNet50 (pre-trained on ImageNet)
        self.backbone = models.resnet50(pretrained=False)
        
        # Remove final FC layer
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Identity()
        
        # Document type classifier head
        self.doc_classifier = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_doc_classes)
        )
        
        # Forgery detector head
        self.forgery_detector = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 2)  # Binary: authentic vs forged
        )
    
    def forward(self, x):
        # Extract features
        features = self.backbone(x)
        
        # Dual outputs
        doc_type = self.doc_classifier(features)
        forgery = self.forgery_detector(features)
        
        return doc_type, forgery

# Image preprocessing (matches training)
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Global model
MODEL = None
DEVICE = None

def load_model():
    """Load trained model"""
    global MODEL, DEVICE

    logger.info("Loading document forgery detection model...")

    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {DEVICE}")

    MODEL = DocumentForgeryDetector(num_doc_classes=5)

    try:
        # Load best model
        checkpoint = torch.load('document_forgery_detector_best.pth', map_location=DEVICE)
        MODEL.load_state_dict(checkpoint['model_state_dict'])
        
        forgery_acc = checkpoint.get('forgery_acc', 0)
        roc_auc = checkpoint.get('roc_auc', 0)
        
        logger.info(f"✅ Loaded best model")
        logger.info(f"   Forgery Detection Accuracy: {forgery_acc:.2f}%")
        logger.info(f"   ROC-AUC: {roc_auc:.4f}")
        
    except FileNotFoundError:
        logger.error("❌ Model file not found: document_forgery_detector_best.pth")
        logger.error("   Train model first: python train_document_detector.py")
        raise

    MODEL.to(DEVICE)
    MODEL.eval()
    logger.info("✅ Model ready!")

def add_to_blockchain(document_id: str, document_hash: str, validation_result: dict) -> bool:
    """
    Add document validation to blockchain
    """
    try:
        # Prepare transaction data
        transaction = {
            "document_id": document_id,
            "document_hash": document_hash,
            "validation_result": validation_result['verdict'],
            "authenticity_score": validation_result['authenticity_score'],
            "document_type": validation_result['document_type'],
            "verified_by": "AEGIS_AI_DOCUMENT_VALIDATOR",
            "metadata": {
                "risk_level": validation_result['risk_level'],
                "is_forged": validation_result['is_forged'],
                "forgery_confidence": validation_result['forgery_confidence'],
                "tampering_detected": validation_result['tampering_analysis']['tampering_detected']
            }
        }
        
        # Add transaction to blockchain
        response = requests.post(
            f"{BLOCKCHAIN_API}/add_transaction",
            json=transaction,
            timeout=5
        )
        
        if response.status_code == 200:
            logger.info(f"✅ Document added to blockchain: {document_id}")
            
            # Auto-mine if there are enough pending transactions
            try:
                chain_info = requests.get(f"{BLOCKCHAIN_API}/chain/info", timeout=5).json()
                if chain_info.get('pending_transactions', 0) >= 2:
                    mine_response = requests.post(f"{BLOCKCHAIN_API}/mine", timeout=30)
                    if mine_response.status_code == 200:
                        logger.info("⛏️ Auto-mined new block")
            except Exception as e:
                logger.warning(f"Auto-mining failed: {e}")
            
            return True
        else:
            logger.error(f"❌ Blockchain transaction failed: {response.text}")
            return False
    
    except Exception as e:
        logger.error(f"❌ Blockchain error: {e}")
        return False

def calculate_document_hash(content: bytes) -> str:
    """Calculate SHA-256 hash of document content"""
    return hashlib.sha256(content).hexdigest()

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    load_model()
    logger.info("=" * 70)
    logger.info("🚀 AEGIS-AI DOCUMENT VALIDATOR SERVICE STARTED")
    logger.info("=" * 70)
    logger.info("Model: ResNet50 Dual-Task (Doc Type + Forgery)")
    logger.info("Endpoints:")
    logger.info(" • POST /validate - Validate business document")
    logger.info(" • GET /health - Health check")
    logger.info(" • GET /info - Model information")
    logger.info(" • GET /blockchain/status - Blockchain connection status")
    logger.info("=" * 70)

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "document-validator",
        "model": "ResNet50 Dual-Task",
        "model_loaded": MODEL is not None,
        "device": str(DEVICE),
        "blockchain_enabled": True
    }

@app.get("/blockchain/status")
def blockchain_status():
    """Check blockchain connection"""
    try:
        response = requests.get(f"{BLOCKCHAIN_API}/health", timeout=3)
        if response.status_code == 200:
            return {
                "blockchain_connected": True,
                "blockchain_status": response.json()
            }
        else:
            return {
                "blockchain_connected": False,
                "error": "Blockchain service not responding"
            }
    except Exception as e:
        return {
            "blockchain_connected": False,
            "error": str(e)
        }

@app.get("/info")
def model_info():
    """Get model information"""
    return {
        "model": "ResNet50 + Dual-Task CNN",
        "version": "2.0.0",
        "document_types": list(DOCUMENT_CLASSES.values()),
        "capabilities": [
            "Document type classification",
            "Forgery detection",
            "Tampering analysis",
            "OCR text extraction",
            "Blockchain verification"
        ],
        "supported_formats": ["PNG", "JPEG", "JPG"],
        "max_file_size": "10MB",
        "blockchain_enabled": True
    }

def extract_text_ocr(image: Image.Image) -> str:
    """Extract text using Tesseract OCR"""
    try:
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        logger.error(f"OCR error: {e}")
        return ""

def detect_tampering(image: Image.Image) -> Dict:
    """
    Detect tampering indicators
    - Noise analysis
    - Compression artifacts
    - Inconsistent fonts/colors
    """
    img_array = np.array(image)

    indicators = []

    # 1. Check image quality (low quality = potential re-compression)
    if image.format == 'JPEG':
        # JPEG quality estimation (rough)
        file_size = len(image.tobytes())
        expected_size = img_array.shape[0] * img_array.shape[1] * 3
        compression_ratio = file_size / expected_size

        if compression_ratio < 0.1:
            indicators.append({
                "type": "low_quality",
                "severity": "medium",
                "description": "Image shows signs of heavy compression (potential re-editing)"
            })

    # 2. Check for copy-paste regions (simple edge detection)
    try:
        from scipy import ndimage
        edges = ndimage.sobel(img_array.mean(axis=2))
        edge_variance = edges.std()

        if edge_variance < 10:
            indicators.append({
                "type": "low_edge_variance",
                "severity": "low",
                "description": "Uniform edge patterns detected (possible copy-paste)"
            })
    except:
        pass

    # 3. Check for metadata tampering
    if hasattr(image, '_getexif') and image._getexif():
        exif_data = image._getexif()
        if exif_data:
            # Check for editing software
            software_tag = 305
            if software_tag in exif_data:
                software = exif_data[software_tag]
                if any(editor in software.lower() for editor in ['photoshop', 'gimp', 'paint']):
                    indicators.append({
                        "type": "editing_software",
                        "severity": "high",
                        "description": f"Document edited with: {software}"
                    })

    return {
        "tampering_detected": len(indicators) > 0,
        "indicators": indicators,
        "confidence": min(len(indicators) * 0.3, 1.0)
    }

@app.post("/validate")
async def validate_document(file: UploadFile = File(...)):
    """
    Validate business document for authenticity
    + Add to blockchain for immutable audit trail

    Returns:
        - document_type: Type of document (invoice, receipt, etc.)
        - is_forged: Forgery prediction
        - forgery_confidence: Confidence score
        - tampering_analysis: Tampering indicators
        - extracted_text: OCR text
        - blockchain_record: Transaction ID in blockchain
    """

    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files supported")

    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Calculate document hash
        document_hash = calculate_document_hash(contents)
        
        # Generate unique document ID
        document_id = f"DOC_{datetime.now().strftime('%Y%m%d%H%M%S')}_{document_hash[:8]}"

        # Preprocess for model
        image_tensor = transform(image).unsqueeze(0).to(DEVICE)

        # Model prediction
        with torch.no_grad():
            doc_out, forgery_out = MODEL(image_tensor)

        # Document type
        doc_probs = torch.softmax(doc_out, dim=1)
        doc_class = torch.argmax(doc_probs, dim=1).item()
        doc_confidence = doc_probs[0, doc_class].item()

        # Forgery detection
        forgery_probs = torch.softmax(forgery_out, dim=1)
        is_forged = torch.argmax(forgery_probs, dim=1).item()
        forgery_confidence = forgery_probs[0, is_forged].item()

        # OCR extraction
        extracted_text = extract_text_ocr(image)

        # Tampering analysis
        tampering_analysis = detect_tampering(image)

        # Calculate overall authenticity score
        authenticity_score = (1 - forgery_probs[0, 1].item()) * 100

        # Determine verdict
        if is_forged == 1 or tampering_analysis['tampering_detected']:
            verdict = "FORGED"
            risk_level = "HIGH"
        elif forgery_confidence < 0.7:
            verdict = "SUSPICIOUS"
            risk_level = "MEDIUM"
        else:
            verdict = "AUTHENTIC"
            risk_level = "LOW"

        # Recommendations
        recommendations = []
        if verdict == "FORGED":
            recommendations.append("⚠️ Document shows signs of forgery - Do NOT accept")
            recommendations.append("Verify with original source")
        elif verdict == "SUSPICIOUS":
            recommendations.append("⚠️ Request original document for verification")
            recommendations.append("Cross-check details with issuer")
        else:
            recommendations.append("✅ Document appears authentic")
            recommendations.append("Proceed with standard verification")

        result = {
            "success": True,
            "document_id": document_id,
            "document_hash": document_hash,
            "filename": file.filename,
            "verdict": verdict,
            "risk_level": risk_level,
            "authenticity_score": round(authenticity_score, 2),
            "document_type": DOCUMENT_CLASSES[doc_class],
            "document_confidence": round(doc_confidence * 100, 2),
            "is_forged": bool(is_forged),
            "forgery_confidence": round(forgery_confidence * 100, 2),
            "tampering_analysis": tampering_analysis,
            "extracted_text": extracted_text[:500] if extracted_text else "",  # First 500 chars
            "recommendations": recommendations,
            "metadata": {
                "image_size": f"{image.width}x{image.height}",
                "format": image.format,
                "mode": image.mode
            }
        }
        
        # Add to blockchain
        blockchain_added = add_to_blockchain(document_id, document_hash, result)
        result["blockchain_recorded"] = blockchain_added
        
        if blockchain_added:
            result["blockchain_info"] = {
                "status": "recorded",
                "message": "Document validation recorded on blockchain",
                "document_id": document_id,
                "explorer_url": f"http://localhost:8007/explorer"
            }
        else:
            result["blockchain_info"] = {
                "status": "failed",
                "message": "Blockchain recording failed (validation still valid)",
                "note": "Ensure blockchain service is running on port 8007"
            }

        return result

    except Exception as e:
        logger.error(f"Validation error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
