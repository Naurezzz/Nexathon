"""
AEGIS-AI Blockchain Core
Full blockchain implementation with Proof of Work
"""

import hashlib
import json
import time
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MerkleTree:
    """Merkle tree for efficient document verification"""
    
    @staticmethod
    def calculate_merkle_root(transactions: List[Dict]) -> str:
        """Calculate Merkle root from list of transactions"""
        if not transactions:
            return hashlib.sha256(b"").hexdigest()
        
        # Create leaf nodes (hash each transaction)
        current_level = [
            hashlib.sha256(json.dumps(tx, sort_keys=True).encode()).hexdigest()
            for tx in transactions
        ]
        
        # Build tree bottom-up
        while len(current_level) > 1:
            next_level = []
            
            # Pair nodes and hash
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                
                combined = (left + right).encode()
                parent_hash = hashlib.sha256(combined).hexdigest()
                next_level.append(parent_hash)
            
            current_level = next_level
        
        return current_level[0]


class Block:
    """
    Blockchain Block
    Contains document validation records with cryptographic proof
    """
    
    def __init__(
        self,
        index: int,
        transactions: List[Dict],
        previous_hash: str,
        timestamp: Optional[float] = None,
        nonce: int = 0
    ):
        self.index = index
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.timestamp = timestamp or time.time()
        self.nonce = nonce
        self.merkle_root = MerkleTree.calculate_merkle_root(transactions)
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate SHA-256 hash of block"""
        block_data = {
            'index': self.index,
            'transactions': self.transactions,
            'previous_hash': self.previous_hash,
            'timestamp': self.timestamp,
            'nonce': self.nonce,
            'merkle_root': self.merkle_root
        }
        
        block_string = json.dumps(block_data, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int) -> None:
        """
        Proof of Work mining
        Find nonce such that hash starts with 'difficulty' number of zeros
        """
        target = '0' * difficulty
        
        logger.info(f"⛏️  Mining block #{self.index} (difficulty: {difficulty})...")
        start_time = time.time()
        
        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.calculate_hash()
            
            # Progress indicator
            if self.nonce % 10000 == 0:
                logger.debug(f"   Tried {self.nonce} hashes...")
        
        mining_time = time.time() - start_time
        logger.info(f"✅ Block mined! Nonce: {self.nonce} | Time: {mining_time:.2f}s | Hash: {self.hash[:16]}...")
    
    def to_dict(self) -> Dict:
        """Convert block to dictionary"""
        return {
            'index': self.index,
            'transactions': self.transactions,
            'previous_hash': self.previous_hash,
            'timestamp': self.timestamp,
            'timestamp_readable': datetime.fromtimestamp(self.timestamp).isoformat(),
            'nonce': self.nonce,
            'merkle_root': self.merkle_root,
            'hash': self.hash
        }
    
    @staticmethod
    def from_dict(data: Dict) -> 'Block':
        """Create block from dictionary"""
        block = Block(
            index=data['index'],
            transactions=data['transactions'],
            previous_hash=data['previous_hash'],
            timestamp=data['timestamp'],
            nonce=data['nonce']
        )
        block.hash = data['hash']
        block.merkle_root = data['merkle_root']
        return block


class Blockchain:
    """
    AEGIS-AI Blockchain
    Immutable ledger for document validation records
    """
    
    def __init__(self, difficulty: int = 4):
        self.chain: List[Block] = []
        self.difficulty = difficulty
        self.pending_transactions: List[Dict] = []
        self.mining_reward = 1.0
        
        # Create genesis block
        self.create_genesis_block()
        
        logger.info("="*70)
        logger.info("🔗 AEGIS-AI BLOCKCHAIN INITIALIZED")
        logger.info(f"   Difficulty: {self.difficulty}")
        logger.info(f"   Genesis block: {self.chain[0].hash[:16]}...")
        logger.info("="*70)
    
    def create_genesis_block(self) -> None:
        """Create the first block in the chain"""
        genesis_transactions = [{
            'type': 'GENESIS',
            'message': 'AEGIS-AI Blockchain Genesis Block',
            'timestamp': datetime.now().isoformat(),
            'system': 'AegisAI v2.0'
        }]
        
        genesis_block = Block(
            index=0,
            transactions=genesis_transactions,
            previous_hash='0' * 64,
            timestamp=time.time()
        )
        
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)
    
    def get_latest_block(self) -> Block:
        """Get the most recent block"""
        return self.chain[-1]
    
    def add_transaction(self, transaction: Dict) -> bool:
        """
        Add transaction to pending pool
        Transaction will be included in next mined block
        """
        # Validate transaction
        required_fields = ['document_id', 'document_hash', 'validation_result']
        if not all(field in transaction for field in required_fields):
            logger.error("Invalid transaction: missing required fields")
            return False
        
        # Add timestamp if not present
        if 'timestamp' not in transaction:
            transaction['timestamp'] = datetime.now().isoformat()
        
        self.pending_transactions.append(transaction)
        logger.info(f"📝 Transaction added to pool: {transaction['document_id']}")
        
        return True
    
    def mine_pending_transactions(self, miner_address: str = "AEGIS_AI_SYSTEM") -> Block:
        """
        Mine a new block with pending transactions
        """
        if not self.pending_transactions:
            logger.warning("No transactions to mine")
            return None
        
        # Create reward transaction for miner
        reward_transaction = {
            'type': 'MINING_REWARD',
            'miner': miner_address,
            'reward': self.mining_reward,
            'timestamp': datetime.now().isoformat()
        }
        
        # Create new block
        block = Block(
            index=len(self.chain),
            transactions=self.pending_transactions + [reward_transaction],
            previous_hash=self.get_latest_block().hash
        )
        
        # Mine block (Proof of Work)
        block.mine_block(self.difficulty)
        
        # Add to chain
        self.chain.append(block)
        
        # Clear pending transactions
        self.pending_transactions = []
        
        logger.info(f"✅ Block #{block.index} added to blockchain")
        
        return block
    
    def is_chain_valid(self) -> bool:
        """
        Validate entire blockchain
        Checks:
        1. Each block's hash is correct
        2. Each block links to previous block
        3. Proof of Work is valid
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]
            
            # Check hash integrity
            if current_block.hash != current_block.calculate_hash():
                logger.error(f"❌ Block #{i} hash mismatch")
                return False
            
            # Check chain linkage
            if current_block.previous_hash != previous_block.hash:
                logger.error(f"❌ Block #{i} chain break")
                return False
            
            # Check Proof of Work
            if not current_block.hash.startswith('0' * self.difficulty):
                logger.error(f"❌ Block #{i} invalid PoW")
                return False
        
        return True
    
    def get_block_by_index(self, index: int) -> Optional[Block]:
        """Get block by index"""
        if 0 <= index < len(self.chain):
            return self.chain[index]
        return None
    
    def get_blocks_by_document_id(self, document_id: str) -> List[Block]:
        """Find all blocks containing specific document"""
        matching_blocks = []
        
        for block in self.chain:
            for tx in block.transactions:
                if tx.get('document_id') == document_id:
                    matching_blocks.append(block)
                    break
        
        return matching_blocks
    
    def get_chain_info(self) -> Dict:
        """Get blockchain statistics"""
        total_transactions = sum(len(block.transactions) for block in self.chain)
        
        return {
            'length': len(self.chain),
            'difficulty': self.difficulty,
            'total_transactions': total_transactions,
            'pending_transactions': len(self.pending_transactions),
            'latest_block_hash': self.get_latest_block().hash,
            'is_valid': self.is_chain_valid(),
            'genesis_timestamp': datetime.fromtimestamp(self.chain[0].timestamp).isoformat()
        }
    
    def to_dict(self) -> Dict:
        """Convert blockchain to dictionary for serialization"""
        return {
            'difficulty': self.difficulty,
            'chain': [block.to_dict() for block in self.chain],
            'pending_transactions': self.pending_transactions
        }
    
    @staticmethod
    def from_dict(data: Dict) -> 'Blockchain':
        """Load blockchain from dictionary"""
        blockchain = Blockchain.__new__(Blockchain)
        blockchain.difficulty = data['difficulty']
        blockchain.chain = [Block.from_dict(block_data) for block_data in data['chain']]
        blockchain.pending_transactions = data['pending_transactions']
        blockchain.mining_reward = 1.0
        
        logger.info(f"✅ Loaded blockchain with {len(blockchain.chain)} blocks")
        
        return blockchain


# Global blockchain instance
BLOCKCHAIN = Blockchain(difficulty=4)
