"""
AEGIS-AI Blockchain - Cryptographic Utilities
Digital signatures, key generation, and encryption
"""

import hashlib
import json
from typing import Dict, Tuple
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
import base64
import logging

logger = logging.getLogger(__name__)


class CryptoManager:
    """Manage cryptographic operations for blockchain"""
    
    def __init__(self):
        self.private_key = None
        self.public_key = None
    
    def generate_key_pair(self) -> Tuple[str, str]:
        """
        Generate RSA key pair
        Returns: (private_key_pem, public_key_pem)
        """
        # Generate private key
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        # Generate public key
        self.public_key = self.private_key.public_key()
        
        # Serialize to PEM format
        private_pem = self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')
        
        public_pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode('utf-8')
        
        logger.info("✅ RSA key pair generated")
        
        return private_pem, public_pem
    
    def load_private_key(self, private_key_pem: str):
        """Load private key from PEM string"""
        self.private_key = serialization.load_pem_private_key(
            private_key_pem.encode(),
            password=None,
            backend=default_backend()
        )
    
    def load_public_key(self, public_key_pem: str):
        """Load public key from PEM string"""
        self.public_key = serialization.load_pem_public_key(
            public_key_pem.encode(),
            backend=default_backend()
        )
    
    def sign_data(self, data: Dict) -> str:
        """
        Create digital signature for data
        Returns: Base64 encoded signature
        """
        if not self.private_key:
            raise ValueError("Private key not loaded")
        
        # Convert data to canonical JSON
        data_string = json.dumps(data, sort_keys=True)
        data_bytes = data_string.encode('utf-8')
        
        # Sign
        signature = self.private_key.sign(
            data_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        # Encode to base64
        signature_b64 = base64.b64encode(signature).decode('utf-8')
        
        return signature_b64
    
    def verify_signature(self, data: Dict, signature_b64: str, public_key_pem: str = None) -> bool:
        """
        Verify digital signature
        Returns: True if valid, False otherwise
        """
        try:
            # Load public key if provided
            if public_key_pem:
                self.load_public_key(public_key_pem)
            
            if not self.public_key:
                raise ValueError("Public key not loaded")
            
            # Convert data to canonical JSON
            data_string = json.dumps(data, sort_keys=True)
            data_bytes = data_string.encode('utf-8')
            
            # Decode signature
            signature = base64.b64decode(signature_b64)
            
            # Verify
            self.public_key.verify(
                signature,
                data_bytes,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return True
        
        except Exception as e:
            logger.warning(f"Signature verification failed: {e}")
            return False
    
    @staticmethod
    def hash_document(document_content: bytes) -> str:
        """
        Create SHA-256 hash of document content
        Returns: Hex string of hash
        """
        return hashlib.sha256(document_content).hexdigest()
    
    @staticmethod
    def create_document_fingerprint(document_hash: str, metadata: Dict) -> str:
        """
        Create unique fingerprint for document + metadata
        """
        combined = document_hash + json.dumps(metadata, sort_keys=True)
        return hashlib.sha256(combined.encode()).hexdigest()


# Global crypto manager
CRYPTO_MANAGER = CryptoManager()

# Generate system key pair on startup
SYSTEM_PRIVATE_KEY, SYSTEM_PUBLIC_KEY = CRYPTO_MANAGER.generate_key_pair()
