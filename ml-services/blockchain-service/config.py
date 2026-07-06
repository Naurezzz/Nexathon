"""
AEGIS-AI Blockchain Service Configuration
"""

# Blockchain settings
BLOCKCHAIN_DIFFICULTY = 4  # Number of leading zeros required in block hash
MINING_REWARD = 1.0
AUTO_MINE_THRESHOLD = 5  # Auto-mine when this many transactions pending

# Storage settings
STORAGE_PATH = "blockchain_data"
AUTO_SAVE_INTERVAL = 10  # Save every N blocks

# API settings
API_HOST = "0.0.0.0"
API_PORT = 8007

# Security settings
ENABLE_DIGITAL_SIGNATURES = True
KEY_SIZE = 2048  # RSA key size

# System identity
SYSTEM_NAME = "AEGIS_AI_SYSTEM"
SYSTEM_VERSION = "2.0.0"
