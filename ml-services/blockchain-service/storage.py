"""
AEGIS-AI Blockchain - Persistent Storage
Save and load blockchain from disk
"""

import json
import os
from typing import Optional
from datetime import datetime
import logging
from blockchain_core import Blockchain

logger = logging.getLogger(__name__)


class BlockchainStorage:
    """Manage blockchain persistence"""
    
    def __init__(self, storage_path: str = "blockchain_data"):
        self.storage_path = storage_path
        self.blockchain_file = os.path.join(storage_path, "blockchain.json")
        self.backup_path = os.path.join(storage_path, "backups")
        
        # Create directories
        os.makedirs(storage_path, exist_ok=True)
        os.makedirs(self.backup_path, exist_ok=True)
    
    def save_blockchain(self, blockchain: Blockchain) -> bool:
        """Save blockchain to disk"""
        try:
            # Convert to dict
            blockchain_data = blockchain.to_dict()
            
            # Add metadata
            blockchain_data['saved_at'] = datetime.now().isoformat()
            blockchain_data['version'] = '2.0.0'
            
            # Save to file
            with open(self.blockchain_file, 'w') as f:
                json.dump(blockchain_data, f, indent=2)
            
            logger.info(f"✅ Blockchain saved ({len(blockchain.chain)} blocks)")
            
            return True
        
        except Exception as e:
            logger.error(f"❌ Failed to save blockchain: {e}")
            return False
    
    def load_blockchain(self) -> Optional[Blockchain]:
        """Load blockchain from disk"""
        try:
            if not os.path.exists(self.blockchain_file):
                logger.warning("⚠️ No saved blockchain found")
                return None
            
            # Load from file
            with open(self.blockchain_file, 'r') as f:
                blockchain_data = json.load(f)
            
            # Validate version
            if blockchain_data.get('version') != '2.0.0':
                logger.warning("⚠️ Blockchain version mismatch")
            
            # Reconstruct blockchain
            blockchain = Blockchain.from_dict(blockchain_data)
            
            # Verify integrity
            if not blockchain.is_chain_valid():
                logger.error("❌ Loaded blockchain is invalid!")
                return None
            
            logger.info(f"✅ Blockchain loaded ({len(blockchain.chain)} blocks)")
            
            return blockchain
        
        except Exception as e:
            logger.error(f"❌ Failed to load blockchain: {e}")
            return None
    
    def create_backup(self, blockchain: Blockchain) -> bool:
        """Create timestamped backup"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = os.path.join(self.backup_path, f"blockchain_{timestamp}.json")
            
            blockchain_data = blockchain.to_dict()
            blockchain_data['backup_at'] = datetime.now().isoformat()
            
            with open(backup_file, 'w') as f:
                json.dump(blockchain_data, f, indent=2)
            
            logger.info(f"✅ Backup created: {backup_file}")
            
            return True
        
        except Exception as e:
            logger.error(f"❌ Backup failed: {e}")
            return False
    
    def auto_save(self, blockchain: Blockchain, interval_blocks: int = 10):
        """Auto-save blockchain every N blocks"""
        if len(blockchain.chain) % interval_blocks == 0:
            self.save_blockchain(blockchain)
            self.create_backup(blockchain)


# Global storage manager
STORAGE = BlockchainStorage()
