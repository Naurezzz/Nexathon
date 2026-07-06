"""
Download and prepare fraud detection datasets from Kaggle and other sources
Run: python scripts/prepare_datasets.py
"""

import pandas as pd
import numpy as np
from pathlib import Path
import requests
import zipfile
import io
import logging
from datetime import datetime, timedelta
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create directories
Path('data/raw').mkdir(parents=True, exist_ok=True)
Path('data/processed').mkdir(parents=True, exist_ok=True)

def generate_synthetic_invoice_dataset(n_samples=50000):
    """
    Generate high-quality synthetic invoice dataset with fraud patterns
    Based on real-world fraud scenarios
    """
    logger.info(f"Generating {n_samples} synthetic invoice records...")
    
    np.random.seed(42)
    
    # Vendor pool
    vendors = [
        'ABC Enterprises', 'XYZ Solutions Pvt Ltd', 'TechCorp India',
        'Global Supplies Co', 'Innovative Services', 'Prime Vendors',
        'Elite Business Solutions', 'Mega Industries', 'Swift Logistics',
        'Digital Solutions Inc', 'Smart Systems Ltd', 'Quick Services',
        'Premium Traders', 'Modern Enterprises', 'Advanced Tech Corp',
        'Reliable Suppliers', 'Express Deliveries', 'Quality Products Ltd',
        'Supreme Businesses', 'Excellent Services Pvt Ltd',
        # Fraudulent vendors (will have suspicious patterns)
        'Phantom LLC', 'Shell Company 123', 'Fake Vendor Co',
        'Suspicious Traders', 'Ghost Enterprises'
    ]
    
    # Generate data
    data = []
    fraud_count = 0
    
    for i in range(n_samples):
        # Generate date (last 2 years)
        days_ago = random.randint(0, 730)
        invoice_date = datetime.now() - timedelta(days=days_ago)
        
        # Select vendor
        is_fraud = random.random() < 0.15  # 15% fraud rate
        if is_fraud:
            vendor = random.choice(vendors[-5:])  # Fraudulent vendors
        else:
            vendor = random.choice(vendors[:-5])  # Legitimate vendors
        
        # Generate amounts
        if is_fraud:
            # Fraudulent patterns
            fraud_type = random.choice([
                'just_below_threshold',
                'round_figure',
                'duplicate',
                'inflated',
                'split',
                'weekend',
                'wrong_gst'
            ])
            
            if fraud_type == 'just_below_threshold':
                thresholds = [50000, 100000, 200000]
                threshold = random.choice(thresholds)
                base_amount = threshold - random.uniform(100, 2000)
            elif fraud_type == 'round_figure':
                base_amount = random.choice([50000, 100000, 250000, 500000])
            elif fraud_type == 'inflated':
                base_amount = random.uniform(200000, 1000000)
            else:
                base_amount = random.uniform(10000, 300000)
            
            # Wrong GST rates for fraud
            if fraud_type == 'wrong_gst':
                gst_rate = random.choice([7, 10, 15, 20, 25])  # Invalid rates
            else:
                gst_rate = random.choice([5, 12, 18, 28])
            
            # Weekend dates
            if fraud_type == 'weekend':
                while invoice_date.weekday() < 5:  # Make it weekend
                    invoice_date += timedelta(days=1)
            
            fraud_count += 1
            is_fraud_label = 1
            
        else:
            # Legitimate patterns
            base_amount = random.uniform(5000, 150000)
            gst_rate = random.choice([0, 5, 12, 18, 28])
            is_fraud_label = 0
        
        # Calculate GST and total
        gst_amount = round(base_amount * (gst_rate / 100), 2)
        total_amount = round(base_amount + gst_amount, 2)
        
        # Generate invoice number
        invoice_prefix = 'INV'
        invoice_num = f"{invoice_prefix}-{invoice_date.year}-{10000 + i + random.randint(-50, 50)}"
        
        # Generate GSTIN (format: 22AAAAA0000A1Z5)
        state_codes = ['27', '29', '33', '36', '09', '24', '07', '06']
        state_code = random.choice(state_codes)
        pan_chars = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=5))
        pan_nums = ''.join(random.choices('0123456789', k=4))
        pan_end = random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        entity = random.choice('123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        check_digit = random.choice('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        gstin = f"{state_code}{pan_chars}{pan_nums}{pan_end}{entity}Z{check_digit}"
        
        data.append({
            'invoice_no': invoice_num,
            'vendor': vendor,
            'date': invoice_date.strftime('%Y-%m-%d'),
            'base_amount': base_amount,
            'gst_rate': gst_rate,
            'gst_amount': gst_amount,
            'total_amount': total_amount,
            'gstin': gstin,
            'is_fraud': is_fraud_label
        })
    
    df = pd.DataFrame(data)
    
    # Add duplicate fraud (copy some invoices)
    fraud_invoices = df[df['is_fraud'] == 1].sample(n=min(500, len(df[df['is_fraud'] == 1])))
    duplicates = fraud_invoices.copy()
    duplicates['is_fraud'] = 1  # Mark as fraud
    df = pd.concat([df, duplicates], ignore_index=True)
    
    logger.info(f"✅ Generated {len(df)} invoices ({df['is_fraud'].sum()} fraudulent, {len(df) - df['is_fraud'].sum()} legitimate)")
    logger.info(f"   Fraud rate: {df['is_fraud'].mean()*100:.2f}%")
    
    return df


def download_kaggle_dataset():
    """
    Download fraud detection dataset from Kaggle
    Note: Requires Kaggle API credentials (kaggle.json in ~/.kaggle/)
    """
    try:
        logger.info("Attempting to download Kaggle dataset...")
        import kaggle
        
        # Download Financial Fraud Detection dataset
        kaggle.api.dataset_download_files(
            'sriharshaeedala/financial-fraud-detection-dataset',
            path='data/raw/',
            unzip=True
        )
        logger.info("✅ Kaggle dataset downloaded successfully")
        return True
    except Exception as e:
        logger.warning(f"⚠️ Kaggle download failed: {e}")
        logger.info("   Falling back to synthetic data generation")
        return False


def enhance_dataset(df):
    """Add advanced fraud indicators"""
    logger.info("Enhancing dataset with advanced features...")
    
    df['date'] = pd.to_datetime(df['date'])
    
    # Vendor statistics
    vendor_stats = df.groupby('vendor').agg({
        'total_amount': ['mean', 'std', 'count', 'sum'],
        'date': ['min', 'max']
    }).reset_index()
    
    vendor_stats.columns = ['vendor', 'vendor_avg_amount', 'vendor_std_amount', 
                            'vendor_invoice_count', 'vendor_total_value',
                            'vendor_first_date', 'vendor_last_date']
    
    df = df.merge(vendor_stats, on='vendor', how='left')
    
    # Amount deviation from vendor average
    df['amount_deviation'] = abs(df['total_amount'] - df['vendor_avg_amount']) / (df['vendor_avg_amount'] + 1)
    
    # Duplicate detection
    df['duplicate_count'] = df.groupby('invoice_no')['invoice_no'].transform('count')
    df['is_duplicate'] = (df['duplicate_count'] > 1).astype(int)
    
    # Temporal features
    df['day_of_week'] = df['date'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['month'] = df['date'].dt.month
    df['day_of_month'] = df['date'].dt.day
    df['is_month_end'] = (df['day_of_month'] >= 28).astype(int)
    
    # Amount patterns
    df['is_round_amount'] = ((df['total_amount'] % 1000) == 0).astype(int)
    df['is_high_gst'] = (df['gst_rate'] >= 18).astype(int)
    
    # GST validation
    df['expected_gst'] = df['base_amount'] * (df['gst_rate'] / 100)
    df['gst_error'] = abs(df['gst_amount'] - df['expected_gst'])
    df['has_gst_error'] = (df['gst_error'] > 1).astype(int)
    
    logger.info(f"✅ Enhanced dataset with {len(df.columns)} features")
    
    return df


def main():
    logger.info("=" * 70)
    logger.info("AEGIS-AI: INVOICE FRAUD DETECTION DATASET PREPARATION")
    logger.info("=" * 70 + "\n")
    
    # Try Kaggle download
    kaggle_success = download_kaggle_dataset()
    
    # Generate synthetic dataset
    logger.info("\nGenerating synthetic invoice dataset...")
    df = generate_synthetic_invoice_dataset(n_samples=50000)
    
    # Enhance with features
    df = enhance_dataset(df)
    
    # Save raw dataset
    raw_path = 'data/raw/invoice_fraud_dataset.csv'
    df.to_csv(raw_path, index=False)
    logger.info(f"✅ Saved raw dataset: {raw_path}")
    
    # Create train/test split
    from sklearn.model_selection import train_test_split
    
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['is_fraud'])
    
    train_df.to_csv('data/processed/train_invoice_fraud.csv', index=False)
    test_df.to_csv('data/processed/test_invoice_fraud.csv', index=False)
    
    logger.info(f"\n✅ Saved processed datasets:")
    logger.info(f"   Train: {len(train_df)} samples (data/processed/train_invoice_fraud.csv)")
    logger.info(f"   Test:  {len(test_df)} samples (data/processed/test_invoice_fraud.csv)")
    
    # Display statistics
    logger.info(f"\n📊 Dataset Statistics:")
    logger.info(f"   Total invoices: {len(df)}")
    logger.info(f"   Fraudulent: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.2f}%)")
    logger.info(f"   Legitimate: {len(df) - df['is_fraud'].sum()} ({(1-df['is_fraud'].mean())*100:.2f}%)")
    logger.info(f"   Unique vendors: {df['vendor'].nunique()}")
    logger.info(f"   Date range: {df['date'].min()} to {df['date'].max()}")
    logger.info(f"   Amount range: ₹{df['total_amount'].min():,.2f} to ₹{df['total_amount'].max():,.2f}")
    
    logger.info("\n" + "=" * 70)
    logger.info("DATASET PREPARATION COMPLETE!")
    logger.info("=" * 70)
    logger.info("Next step: python train_production_model.py")
    logger.info("=" * 70 + "\n")


if __name__ == "__main__":
    main()
