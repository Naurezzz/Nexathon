"""
Extract security features from URLs for phishing detection
"""

import re
from urllib.parse import urlparse
import validators
from tld import get_tld

def extract_url_features(url: str) -> dict:
    """
    Extract comprehensive features from URL for phishing detection
    """
    
    features = {}
    
    try:
        # Parse URL
        parsed = urlparse(url)
        domain = parsed.netloc
        path = parsed.path
        query = parsed.query
        
        # Basic URL properties
        features['url_length'] = len(url)
        features['domain_length'] = len(domain)
        features['path_length'] = len(path)
        features['query_length'] = len(query)
        
        # Domain analysis
        features['has_ip'] = 1 if re.search(r'\d+\.\d+\.\d+\.\d+', domain) else 0
        features['num_dots'] = domain.count('.')
        features['num_hyphens'] = domain.count('-')
        features['num_underscores'] = domain.count('_')
        features['num_slashes'] = url.count('/')
        features['num_questions'] = url.count('?')
        features['num_ampersands'] = url.count('&')
        features['num_equals'] = url.count('=')
        features['num_ats'] = url.count('@')
        
        # Protocol check
        features['uses_https'] = 1 if parsed.scheme == 'https' else 0
        
        # Suspicious keywords
        suspicious_keywords = [
            'login', 'signin', 'secure', 'account', 'update', 'verify',
            'confirm', 'banking', 'paypal', 'ebay', 'amazon', 'suspended',
            'locked', 'alert', 'urgent', 'click', 'prize', 'winner'
        ]
        
        url_lower = url.lower()
        features['has_suspicious_keyword'] = 1 if any(kw in url_lower for kw in suspicious_keywords) else 0
        features['num_suspicious_keywords'] = sum(1 for kw in suspicious_keywords if kw in url_lower)
        
        # TLD analysis
        try:
            tld = get_tld(url, as_object=True, fail_silently=True)
            if tld:
                features['tld_length'] = len(tld.tld)
                # Suspicious TLDs
                suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.info', '.xyz', '.top']
                features['has_suspicious_tld'] = 1 if any(url.endswith(t) for t in suspicious_tlds) else 0
            else:
                features['tld_length'] = 0
                features['has_suspicious_tld'] = 0
        except:
            features['tld_length'] = 0
            features['has_suspicious_tld'] = 0
        
        # Subdomain analysis
        parts = domain.split('.')
        features['num_subdomains'] = max(0, len(parts) - 2) if len(parts) > 2 else 0
        
        # Path depth
        features['path_depth'] = len([p for p in path.split('/') if p])
        
        # Special characters in domain
        features['domain_has_numbers'] = 1 if re.search(r'\d', domain) else 0
        
        # URL entropy (complexity measure)
        import math
        from collections import Counter
        
        def calculate_entropy(text):
            if not text:
                return 0
            counter = Counter(text)
            length = len(text)
            entropy = -sum((count/length) * math.log2(count/length) for count in counter.values())
            return entropy
        
        features['url_entropy'] = calculate_entropy(url)
        
        # Shortened URL detection
        shorteners = ['bit.ly', 'goo.gl', 'tinyurl', 't.co', 'ow.ly', 'short.link']
        features['is_shortened'] = 1 if any(s in domain for s in shorteners) else 0
        
        # Punycode/IDN attack detection
        features['has_punycode'] = 1 if 'xn--' in domain else 0
        
    except Exception as e:
        print(f"Error extracting features: {e}")
        # Return default features
        return {
            'url_length': len(url),
            'domain_length': 0,
            'path_length': 0,
            'query_length': 0,
            'has_ip': 0,
            'num_dots': 0,
            'num_hyphens': 0,
            'num_underscores': 0,
            'num_slashes': 0,
            'num_questions': 0,
            'num_ampersands': 0,
            'num_equals': 0,
            'num_ats': 0,
            'uses_https': 0,
            'has_suspicious_keyword': 0,
            'num_suspicious_keywords': 0,
            'tld_length': 0,
            'has_suspicious_tld': 0,
            'num_subdomains': 0,
            'path_depth': 0,
            'domain_has_numbers': 0,
            'url_entropy': 0,
            'is_shortened': 0,
            'has_punycode': 0
        }
    
    return features

def get_feature_explanation(feature_name: str, value: float) -> str:
    """
    Generate human-readable explanation for each feature
    """
    
    explanations = {
        'url_length': f"URL length: {int(value)} characters {'(very long - suspicious)' if value > 100 else '(normal)'}",
        'has_ip': "Uses IP address instead of domain name" if value == 1 else "Uses proper domain name",
        'uses_https': "Uses HTTPS (secure)" if value == 1 else "⚠️ Does not use HTTPS",
        'has_suspicious_keyword': "Contains suspicious keywords (login, verify, etc.)" if value == 1 else "No suspicious keywords",
        'num_suspicious_keywords': f"{int(value)} suspicious keywords found" if value > 0 else "No suspicious keywords",
        'has_suspicious_tld': "Uses suspicious TLD (.tk, .ml, etc.)" if value == 1 else "Uses common TLD",
        'num_dots': f"{int(value)} dots in domain {'(many subdomains - suspicious)' if value > 3 else '(normal)'}",
        'is_shortened': "Uses URL shortener" if value == 1 else "Not shortened",
        'has_punycode': "Uses punycode (potential IDN attack)" if value == 1 else "No punycode",
        'num_subdomains': f"{int(value)} subdomains {'(many - suspicious)' if value > 2 else '(normal)'}",
        'path_depth': f"Path depth: {int(value)} {'(deep - suspicious)' if value > 3 else '(normal)'}"
    }
    
    return explanations.get(feature_name, f"{feature_name}: {value}")
