#!/bin/bash

echo "=================================================="
echo "AEGIS-AI Fraud Detection - Complete Setup"
echo "=================================================="

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Prepare datasets
echo "Preparing datasets..."
python scripts/prepare_datasets.py

# Train model
echo "Training production model..."
python train_production_model.py

echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo "To start the service:"
echo "  source venv/bin/activate"
echo "  python serve.py"
echo "=================================================="python train_production_model.py


