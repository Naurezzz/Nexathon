"""
Financial ratio calculation and feature engineering
Converts raw financial statements into ML features
"""

import pandas as pd
import numpy as np

def calculate_financial_ratios(df):
    """
    Calculate key financial ratios from balance sheet data
    
    Expected columns (flexible - we'll map them):
    - current_assets, current_liabilities
    - total_assets, total_liabilities
    - revenue, net_income, operating_income
    - cash, inventory
    - equity, debt
    """
    
    ratios = {}
    
    # Liquidity Ratios
    if 'current_assets' in df.columns and 'current_liabilities' in df.columns:
        ratios['current_ratio'] = df['current_assets'] / (df['current_liabilities'] + 1e-6)
        
        if 'inventory' in df.columns and 'cash' in df.columns:
            quick_assets = df['current_assets'] - df['inventory']
            ratios['quick_ratio'] = quick_assets / (df['current_liabilities'] + 1e-6)
        
        if 'cash' in df.columns:
            ratios['cash_ratio'] = df['cash'] / (df['current_liabilities'] + 1e-6)
    
    # Leverage Ratios
    if 'total_liabilities' in df.columns and 'equity' in df.columns:
        ratios['debt_to_equity'] = df['total_liabilities'] / (df['equity'] + 1e-6)
    
    if 'total_assets' in df.columns and 'total_liabilities' in df.columns:
        ratios['debt_ratio'] = df['total_liabilities'] / (df['total_assets'] + 1e-6)
    
    # Profitability Ratios
    if 'net_income' in df.columns:
        if 'revenue' in df.columns:
            ratios['net_profit_margin'] = df['net_income'] / (df['revenue'] + 1e-6)
        
        if 'total_assets' in df.columns:
            ratios['return_on_assets'] = df['net_income'] / (df['total_assets'] + 1e-6)
        
        if 'equity' in df.columns:
            ratios['return_on_equity'] = df['net_income'] / (df['equity'] + 1e-6)
    
    # Efficiency Ratios
    if 'revenue' in df.columns and 'total_assets' in df.columns:
        ratios['asset_turnover'] = df['revenue'] / (df['total_assets'] + 1e-6)
    
    # Coverage Ratios
    if 'operating_income' in df.columns and 'interest_expense' in df.columns:
        ratios['interest_coverage'] = df['operating_income'] / (df['interest_expense'] + 1e-6)
    
    # Working Capital
    if 'current_assets' in df.columns and 'current_liabilities' in df.columns:
        ratios['working_capital'] = df['current_assets'] - df['current_liabilities']
    
    return pd.DataFrame(ratios)

def engineer_features(df):
    """
    Create additional ML features from ratios
    """
    
    features = df.copy()
    
    # Log transformations for skewed distributions
    for col in features.columns:
        if features[col].min() > 0:  # Only for positive values
            features[f'{col}_log'] = np.log1p(features[col])
    
    # Squared terms for non-linear relationships
    for col in ['current_ratio', 'debt_to_equity', 'return_on_assets']:
        if col in features.columns:
            features[f'{col}_squared'] = features[col] ** 2
    
    # Interaction terms
    if 'current_ratio' in features.columns and 'quick_ratio' in features.columns:
        features['liquidity_composite'] = features['current_ratio'] * features['quick_ratio']
    
    if 'return_on_assets' in features.columns and 'asset_turnover' in features.columns:
        features['efficiency_profitability'] = features['return_on_assets'] * features['asset_turnover']
    
    # Replace infinities and handle outliers
    features = features.replace([np.inf, -np.inf], np.nan)
    features = features.fillna(features.median())
    
    # Cap extreme outliers at 99th percentile
    for col in features.columns:
        upper_limit = features[col].quantile(0.99)
        lower_limit = features[col].quantile(0.01)
        features[col] = features[col].clip(lower_limit, upper_limit)
    
    return features

def auto_map_columns(df):
    """
    Automatically map common column name variations
    """
    
    column_mapping = {
        # Assets
        'total assets': 'total_assets',
        'totalassets': 'total_assets',
        'current assets': 'current_assets',
        'currentassets': 'current_assets',
        'cash and equivalents': 'cash',
        'cash': 'cash',
        
        # Liabilities
        'total liabilities': 'total_liabilities',
        'totalliabilities': 'total_liabilities',
        'current liabilities': 'current_liabilities',
        'currentliabilities': 'current_liabilities',
        
        # Equity
        'shareholders equity': 'equity',
        'equity': 'equity',
        'total equity': 'equity',
        
        # Income
        'revenue': 'revenue',
        'sales': 'revenue',
        'total revenue': 'revenue',
        'net income': 'net_income',
        'netincome': 'net_income',
        'profit': 'net_income',
        'operating income': 'operating_income',
        
        # Other
        'inventory': 'inventory',
        'debt': 'debt',
        'interest expense': 'interest_expense'
    }
    
    # Create lowercase version of column names
    df_lower = df.copy()
    df_lower.columns = [col.lower().strip() for col in df.columns]
    
    # Apply mapping
    df_lower = df_lower.rename(columns=column_mapping)
    
    return df_lower
