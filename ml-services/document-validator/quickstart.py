# quickstart.py - Run this to get started immediately

"""
AEGIS-AI Document Validator - Quick Start
Generates sample data and trains model in one go
"""

import subprocess
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("=" * 70)
    logger.info("AEGIS-AI DOCUMENT VALIDATOR - QUICK START")
    logger.info("=" * 70 + "\n")
    
    # Step 1: Prepare sample dataset
    logger.info("Step 1: Preparing sample dataset...")
    subprocess.run([sys.executable, "data/prepare_dataset.py"])
    
    # Step 2: Train model
    logger.info("\nStep 2: Training forgery detection model...")
    subprocess.run([sys.executable, "train_real_forgery_model.py"])
    
    # Step 3: Start service
    logger.info("\nStep 3: Starting validation service...")
    logger.info("Run: python app.py")
    logger.info("\n✅ Setup complete! Your document validator is ready.")
    logger.info("=" * 70)

if __name__ == "__main__":
    main()
