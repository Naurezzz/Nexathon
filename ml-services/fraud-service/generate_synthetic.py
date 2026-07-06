import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import hashlib
import random
import string

np.random.seed(42)
random.seed(42)

class FraudInvoiceGenerator:
    """Generate synthetic invoice data with fraud patterns"""
    
    def __init__(self, n_samples=1000, fraud_ratio=0.15):
        self.n_samples = n_samples
        self.fraud_ratio = fraud_ratio
        self.n_fraud = int(n_samples * fraud_ratio)
        self.n_normal = n_samples - self.n_fraud
        
        # Realistic vendor names
        self.vendors = [
            "ABC Electronics Pvt Ltd", "XYZ Supplies Inc", "Tech Solutions",
            "Global Trading Co", "Prime Materials Ltd", "Steel Works India",
            "Quality Parts Manufacturing", "Metro Wholesale", "Industrial Supplies",
            "Precision Tools Ltd", "Smart Systems Pvt Ltd", "Alpha Distributors",
            "Beta Components", "Gamma Industries", "Delta Trading",
            "Epsilon Manufacturing", "Zeta Enterprises", "Eta Solutions",
            "Theta Suppliers", "Iota Trading Co", "Kappa Industries",
            "Lambda Corp", "Mu Electronics", "Nu Materials",
            "Xi Components Ltd", "Omicron Trading", "Pi Manufacturing"
        ]
        
        # GST rates in India
        self.gst_rates = [0, 5, 12, 18, 28]
        
    def generate_invoice_number(self, index, duplicate=False, near_duplicate=False):
        """Generate invoice numbers with fraud patterns"""
        if duplicate:
            # Exact duplicate from earlier invoice
            return f"INV{random.randint(1, index):05d}"
        elif near_duplicate:
            # Near duplicate (one digit off)
            base_num = random.randint(1, index)
            inv_str = f"INV{base_num:05d}"
            # Change one character
            pos = random.randint(3, len(inv_str)-1)
            new_digit = random.choice(string.digits)
            return inv_str[:pos] + new_digit + inv_str[pos+1:]
        else:
            # Normal sequential
            return f"INV{index:05d}"
    
    def generate_normal_invoices(self):
        """Generate legitimate invoices"""
        data = []
        start_date = datetime(2024, 1, 1)
        
        for i in range(self.n_normal):
            vendor = random.choice(self.vendors)
            date = start_date + timedelta(days=random.randint(0, 300))
            
            # Realistic amount distribution (log-normal)
            base_amount = np.random.lognormal(mean=10, sigma=1.5)
            base_amount = min(max(base_amount, 1000), 500000)  # Cap between 1k-500k
            
            gst_rate = random.choice(self.gst_rates)
            gst_amount = base_amount * (gst_rate / 100)
            total_amount = base_amount + gst_amount
            
            invoice_no = self.generate_invoice_number(i + 1)
            
            # Create invoice hash (for fraud detection)
            invoice_text = f"{vendor}_{base_amount}_{date.strftime('%Y%m%d')}"
            invoice_hash = hashlib.md5(invoice_text.encode()).hexdigest()[:8]
            
            data.append({
                'invoice_no': invoice_no,
                'vendor': vendor,
                'date': date.strftime('%Y-%m-%d'),
                'weekday': date.strftime('%A'),
                'base_amount': round(base_amount, 2),
                'gst_rate': gst_rate,
                'gst_amount': round(gst_amount, 2),
                'total_amount': round(total_amount, 2),
                'invoice_hash': invoice_hash,
                'is_fraud': 0,
                'fraud_type': 'None'
            })
        
        return data
    
    def generate_fraud_invoices(self):
        """Generate fraudulent invoices with various patterns"""
        data = []
        start_date = datetime(2024, 1, 1)
        fraud_types = [
            'duplicate_invoice',
            'amount_inflation',
            'gst_mismatch',
            'round_figure_fraud',
            'weekend_anomaly',
            'vendor_amount_spike'
        ]
        
        for i in range(self.n_fraud):
            fraud_type = random.choice(fraud_types)
            vendor = random.choice(self.vendors)
            date = start_date + timedelta(days=random.randint(0, 300))
            
            # Base legitimate amount
            base_amount = np.random.lognormal(mean=10, sigma=1.5)
            base_amount = min(max(base_amount, 1000), 500000)
            
            # Apply fraud pattern
            if fraud_type == 'duplicate_invoice':
                invoice_no = self.generate_invoice_number(i + 1, duplicate=True)
            elif fraud_type == 'amount_inflation':
                base_amount *= random.uniform(1.5, 3.0)  # Inflate by 50-200%
                invoice_no = self.generate_invoice_number(i + 1)
            elif fraud_type == 'gst_mismatch':
                gst_rate = random.choice(self.gst_rates)
                wrong_gst_rate = random.choice([r for r in self.gst_rates if r != gst_rate])
                gst_amount = base_amount * (wrong_gst_rate / 100)  # Wrong rate applied
                total_amount = base_amount + gst_amount
                
                data.append({
                    'invoice_no': self.generate_invoice_number(i + 1),
                    'vendor': vendor,
                    'date': date.strftime('%Y-%m-%d'),
                    'weekday': date.strftime('%A'),
                    'base_amount': round(base_amount, 2),
                    'gst_rate': gst_rate,
                    'gst_amount': round(gst_amount, 2),
                    'total_amount': round(total_amount, 2),
                    'invoice_hash': hashlib.md5(f"{vendor}_{base_amount}_{date.strftime('%Y%m%d')}".encode()).hexdigest()[:8],
                    'is_fraud': 1,
                    'fraud_type': fraud_type
                })
                continue
            elif fraud_type == 'round_figure_fraud':
                base_amount = round(base_amount / 10000) * 10000  # Exact round figures (suspicious)
                invoice_no = self.generate_invoice_number(i + 1)
            elif fraud_type == 'weekend_anomaly':
                # Set date to weekend
                date = start_date + timedelta(days=random.randint(0, 300))
                while date.weekday() < 5:  # Make it weekend (5=Sat, 6=Sun)
                    date += timedelta(days=1)
                invoice_no = self.generate_invoice_number(i + 1)
            elif fraud_type == 'vendor_amount_spike':
                base_amount *= random.uniform(5.0, 10.0)  # Massive spike
                invoice_no = self.generate_invoice_number(i + 1)
            else:
                invoice_no = self.generate_invoice_number(i + 1, near_duplicate=True)
            
            gst_rate = random.choice(self.gst_rates)
            gst_amount = base_amount * (gst_rate / 100)
            total_amount = base_amount + gst_amount
            
            invoice_text = f"{vendor}_{base_amount}_{date.strftime('%Y%m%d')}"
            invoice_hash = hashlib.md5(invoice_text.encode()).hexdigest()[:8]
            
            data.append({
                'invoice_no': invoice_no,
                'vendor': vendor,
                'date': date.strftime('%Y-%m-%d'),
                'weekday': date.strftime('%A'),
                'base_amount': round(base_amount, 2),
                'gst_rate': gst_rate,
                'gst_amount': round(gst_amount, 2),
                'total_amount': round(total_amount, 2),
                'invoice_hash': invoice_hash,
                'is_fraud': 1,
                'fraud_type': fraud_type
            })
        
        return data
    
    def generate_dataset(self):
        """Generate complete dataset"""
        normal_data = self.generate_normal_invoices()
        fraud_data = self.generate_fraud_invoices()
        
        all_data = normal_data + fraud_data
        random.shuffle(all_data)
        
        df = pd.DataFrame(all_data)
        return df


if __name__ == "__main__":
    generator = FraudInvoiceGenerator(n_samples=2000, fraud_ratio=0.15)
    df = generator.generate_dataset()
    
    # Save dataset
    output_path = "data/fraud_invoices_synthetic.csv"
    df.to_csv(output_path, index=False)
    
    print(f"✅ Generated {len(df)} invoices")
    print(f"   - Legitimate: {len(df[df['is_fraud']==0])}")
    print(f"   - Fraudulent: {len(df[df['is_fraud']==1])}")
    print(f"\n📊 Fraud types distribution:")
    print(df[df['is_fraud']==1]['fraud_type'].value_counts())
    print(f"\n💾 Saved to: {output_path}")
