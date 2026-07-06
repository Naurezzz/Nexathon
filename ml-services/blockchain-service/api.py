"""
AEGIS-AI Blockchain Service API
FastAPI endpoints for blockchain operations
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
from datetime import datetime
import os

from blockchain_core import BLOCKCHAIN, Block
from crypto_utils import CRYPTO_MANAGER, SYSTEM_PRIVATE_KEY, SYSTEM_PUBLIC_KEY
from storage import STORAGE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AEGIS-AI Blockchain Service",
    description="Document validation blockchain with Proof of Work",
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

# Request/Response Models
class DocumentTransaction(BaseModel):
    document_id: str
    document_hash: str
    validation_result: str
    authenticity_score: float
    document_type: str
    verified_by: str
    metadata: Optional[Dict] = {}

class BlockResponse(BaseModel):
    success: bool
    message: str
    block_index: Optional[int] = None
    block_hash: Optional[str] = None
    transaction_count: Optional[int] = None

class ChainInfoResponse(BaseModel):
    length: int
    difficulty: int
    total_transactions: int
    pending_transactions: int
    latest_block_hash: str
    is_valid: bool
    genesis_timestamp: str

# Load blockchain on startup
@app.on_event("startup")
async def startup_event():
    """Initialize blockchain on startup"""
    global BLOCKCHAIN
    
    logger.info("="*70)
    logger.info("🔗 AEGIS-AI BLOCKCHAIN SERVICE STARTING")
    logger.info("="*70)
    
    # Try to load existing blockchain
    loaded_blockchain = STORAGE.load_blockchain()
    
    if loaded_blockchain:
        BLOCKCHAIN = loaded_blockchain
        logger.info(f"✅ Loaded existing blockchain ({len(BLOCKCHAIN.chain)} blocks)")
    else:
        logger.info("🆕 Created new blockchain")
    
    logger.info(f"   Public Key: {SYSTEM_PUBLIC_KEY[:50]}...")
    logger.info("="*70)
    logger.info("Endpoints:")
    logger.info("  • POST /add_transaction - Add document validation to blockchain")
    logger.info("  • POST /mine - Mine pending transactions")
    logger.info("  • GET /chain - Get full blockchain")
    logger.info("  • GET /chain/info - Get blockchain statistics")
    logger.info("  • GET /block/{index} - Get specific block")
    logger.info("  • GET /document/{document_id} - Get document history")
    logger.info("  • GET /verify - Verify blockchain integrity")
    logger.info("  • GET /explorer - Blockchain explorer UI")
    logger.info("="*70)

@app.get("/health")
def health_check():
    """Health check"""
    return {
        "status": "healthy",
        "service": "blockchain-service",
        "blockchain_length": len(BLOCKCHAIN.chain),
        "is_valid": BLOCKCHAIN.is_chain_valid()
    }

@app.post("/add_transaction", response_model=BlockResponse)
async def add_transaction(transaction: DocumentTransaction):
    """
    Add document validation transaction to blockchain
    """
    try:
        # Create transaction dict
        tx_data = {
            'document_id': transaction.document_id,
            'document_hash': transaction.document_hash,
            'validation_result': transaction.validation_result,
            'authenticity_score': transaction.authenticity_score,
            'document_type': transaction.document_type,
            'verified_by': transaction.verified_by,
            'metadata': transaction.metadata,
            'timestamp': datetime.now().isoformat()
        }
        
        # Sign transaction
        CRYPTO_MANAGER.load_private_key(SYSTEM_PRIVATE_KEY)
        signature = CRYPTO_MANAGER.sign_data(tx_data)
        tx_data['signature'] = signature
        tx_data['signed_by'] = 'AEGIS_AI_SYSTEM'
        
        # Add to pending pool
        success = BLOCKCHAIN.add_transaction(tx_data)
        
        if not success:
            raise HTTPException(status_code=400, detail="Invalid transaction")
        
        return BlockResponse(
            success=True,
            message="Transaction added to pending pool",
            transaction_count=len(BLOCKCHAIN.pending_transactions)
        )
    
    except Exception as e:
        logger.error(f"Transaction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mine", response_model=BlockResponse)
async def mine_block(background_tasks: BackgroundTasks, miner: str = "AEGIS_AI"):
    """
    Mine pending transactions into new block
    """
    try:
        if not BLOCKCHAIN.pending_transactions:
            raise HTTPException(status_code=400, detail="No transactions to mine")
        
        # Mine block
        block = BLOCKCHAIN.mine_pending_transactions(miner_address=miner)
        
        # Save blockchain in background
        background_tasks.add_task(STORAGE.save_blockchain, BLOCKCHAIN)
        
        return BlockResponse(
            success=True,
            message="Block mined successfully",
            block_index=block.index,
            block_hash=block.hash,
            transaction_count=len(block.transactions)
        )
    
    except Exception as e:
        logger.error(f"Mining error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chain")
def get_chain():
    """Get full blockchain"""
    return {
        "success": True,
        "length": len(BLOCKCHAIN.chain),
        "chain": [block.to_dict() for block in BLOCKCHAIN.chain]
    }

@app.get("/chain/info", response_model=ChainInfoResponse)
def get_chain_info():
    """Get blockchain statistics"""
    info = BLOCKCHAIN.get_chain_info()
    return ChainInfoResponse(**info)

@app.get("/block/{index}")
def get_block(index: int):
    """Get specific block by index"""
    block = BLOCKCHAIN.get_block_by_index(index)
    
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    return {
        "success": True,
        "block": block.to_dict()
    }

@app.get("/document/{document_id}")
def get_document_history(document_id: str):
    """Get all blocks containing specific document"""
    blocks = BLOCKCHAIN.get_blocks_by_document_id(document_id)
    
    return {
        "success": True,
        "document_id": document_id,
        "blocks_found": len(blocks),
        "blocks": [block.to_dict() for block in blocks]
    }

@app.get("/verify")
def verify_blockchain():
    """Verify blockchain integrity"""
    is_valid = BLOCKCHAIN.is_chain_valid()
    
    return {
        "success": True,
        "is_valid": is_valid,
        "message": "Blockchain is valid ✅" if is_valid else "Blockchain is INVALID ❌",
        "chain_length": len(BLOCKCHAIN.chain)
    }

@app.get("/explorer", response_class=HTMLResponse)
async def blockchain_explorer():
    """Blockchain explorer UI"""
    # Return HTML file if exists, otherwise return basic HTML
    explorer_path = "explorer.html"
    
    if os.path.exists(explorer_path):
        return FileResponse(explorer_path)
    
    # Basic HTML if file doesn't exist
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AEGIS-AI Blockchain Explorer</title>
        <style>
            body { font-family: Arial; padding: 20px; background: #f5f5f5; }
            .block { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #4CAF50; }
            .hash { font-family: monospace; font-size: 12px; color: #666; }
            h1 { color: #333; }
        </style>
    </head>
    <body>
        <h1>🔗 AEGIS-AI Blockchain Explorer</h1>
        <p>Loading blockchain data...</p>
        <div id="blockchain"></div>
        <script>
            fetch('/chain')
                .then(r => r.json())
                .then(data => {
                    const container = document.getElementById('blockchain');
                    container.innerHTML = data.chain.map(block => `
                        <div class="block">
                            <h3>Block #${block.index}</h3>
                            <p><strong>Hash:</strong> <span class="hash">${block.hash}</span></p>
                            <p><strong>Previous:</strong> <span class="hash">${block.previous_hash.slice(0, 32)}...</span></p>
                            <p><strong>Transactions:</strong> ${block.transactions.length}</p>
                            <p><strong>Time:</strong> ${block.timestamp_readable}</p>
                            <p><strong>Nonce:</strong> ${block.nonce}</p>
                        </div>
                    `).join('');
                });
        </script>
    </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
