import json
from typing import List, Dict, Any
from dataclasses import dataclass, asdict
from collections import defaultdict
import networkx as nx

@dataclass
class GraphNode:
    id: str
    name: str
    type: str  # company, vendor, invoice, transaction
    risk_score: float
    metadata: Dict[str, Any]
    color: str
    size: int

@dataclass
class GraphEdge:
    source: str
    target: str
    type: str  # transaction, ownership, supplier
    value: float
    risk_level: str
    color: str
    width: int

class FraudGraphAnalyzer:
    """Detect fraud networks and suspicious patterns"""
    
    def __init__(self):
        self.graph = nx.Graph()
    
    def analyze_invoice_network(self, invoices: List[Dict]) -> Dict[str, Any]:
        """Build graph from invoices and detect fraud patterns"""
        
        nodes = []
        edges = []
        fraud_clusters = []
        
        # Create nodes and edges from invoice data
        companies = {}
        vendors = {}
        
        for invoice in invoices:
            invoice_id = invoice.get('invoice_no', 'INV_UNKNOWN')
            vendor_name = invoice.get('vendor', 'Unknown Vendor')
            company_id = invoice.get('company_id', 'COMPANY_001')
            amount = invoice.get('total_amount', 0)
            fraud_score = invoice.get('fraud_score', 0)
            
            # Create vendor node
            if vendor_name not in vendors:
                vendors[vendor_name] = {
                    'transactions': [],
                    'total_amount': 0,
                    'fraud_flags': 0
                }
            
            vendors[vendor_name]['transactions'].append(invoice_id)
            vendors[vendor_name]['total_amount'] += amount
            if fraud_score > 0.6:
                vendors[vendor_name]['fraud_flags'] += 1
            
            # Create company node
            if company_id not in companies:
                companies[company_id] = {
                    'vendors': set(),
                    'total_spent': 0,
                    'suspicious_count': 0
                }
            
            companies[company_id]['vendors'].add(vendor_name)
            companies[company_id]['total_spent'] += amount
            if fraud_score > 0.6:
                companies[company_id]['suspicious_count'] += 1
        
        # Build nodes
        for company_id, data in companies.items():
            risk_score = data['suspicious_count'] / max(len(data['vendors']), 1)
            nodes.append(GraphNode(
                id=company_id,
                name=f"Company {company_id[-3:]}",
                type="company",
                risk_score=risk_score,
                metadata={
                    'vendors': len(data['vendors']),
                    'total_spent': data['total_spent'],
                    'suspicious': data['suspicious_count']
                },
                color=self._get_color_by_risk(risk_score),
                size=30 + (data['suspicious_count'] * 5)
            ))
        
        for vendor_name, data in vendors.items():
            risk_score = data['fraud_flags'] / max(len(data['transactions']), 1)
            nodes.append(GraphNode(
                id=vendor_name,
                name=vendor_name[:20],
                type="vendor",
                risk_score=risk_score,
                metadata={
                    'transactions': len(data['transactions']),
                    'total_revenue': data['total_amount'],
                    'fraud_flags': data['fraud_flags']
                },
                color=self._get_color_by_risk(risk_score),
                size=20 + (data['fraud_flags'] * 3)
            ))
        
        # Build edges
        for invoice in invoices:
            vendor_name = invoice.get('vendor', 'Unknown Vendor')
            company_id = invoice.get('company_id', 'COMPANY_001')
            amount = invoice.get('total_amount', 0)
            fraud_score = invoice.get('fraud_score', 0)
            
            edges.append(GraphEdge(
                source=company_id,
                target=vendor_name,
                type="transaction",
                value=amount,
                risk_level=self._get_risk_level(fraud_score),
                color=self._get_edge_color(fraud_score),
                width=1 + int(fraud_score * 3)
            ))
        
        # Detect fraud clusters using NetworkX
        self._build_networkx_graph(nodes, edges)
        fraud_clusters = self._detect_fraud_clusters()
        
        return {
            'nodes': [asdict(n) for n in nodes],
            'edges': [asdict(e) for e in edges],
            'fraud_clusters': fraud_clusters,
            'statistics': {
                'total_nodes': len(nodes),
                'total_edges': len(edges),
                'companies': len(companies),
                'vendors': len(vendors),
                'fraud_clusters_detected': len(fraud_clusters)
            }
        }
    
    def _build_networkx_graph(self, nodes, edges):
        """Build NetworkX graph for analysis"""
        self.graph.clear()
        
        for node in nodes:
            self.graph.add_node(
                node.id,
                type=node.type,
                risk_score=node.risk_score
            )
        
        for edge in edges:
            self.graph.add_edge(
                edge.source,
                edge.target,
                weight=edge.value
            )
    
    def _detect_fraud_clusters(self) -> List[Dict]:
        """Detect suspicious clusters in the graph"""
        clusters = []
        
        # Find connected components
        components = list(nx.connected_components(self.graph))
        
        for idx, component in enumerate(components):
            if len(component) < 2:
                continue
            
            # Calculate cluster risk
            nodes_in_cluster = list(component)
            avg_risk = sum(
                self.graph.nodes[n].get('risk_score', 0) 
                for n in nodes_in_cluster
            ) / len(nodes_in_cluster)
            
            if avg_risk > 0.5:  # Suspicious cluster
                clusters.append({
                    'id': f"CLUSTER_{idx + 1}",
                    'nodes': nodes_in_cluster,
                    'size': len(nodes_in_cluster),
                    'avg_risk_score': round(avg_risk, 3),
                    'risk_level': 'High' if avg_risk > 0.7 else 'Medium',
                    'description': f"Suspicious network with {len(nodes_in_cluster)} entities"
                })
        
        return clusters
    
    def _get_color_by_risk(self, risk_score: float) -> str:
        """Get color based on risk score"""
        if risk_score > 0.8:
            return "#ef4444"  # Red
        elif risk_score > 0.6:
            return "#f59e0b"  # Amber
        elif risk_score > 0.4:
            return "#eab308"  # Yellow
        else:
            return "#10b981"  # Green
    
    def _get_edge_color(self, fraud_score: float) -> str:
        """Get edge color based on fraud score"""
        if fraud_score > 0.8:
            return "#dc2626"
        elif fraud_score > 0.6:
            return "#f59e0b"
        elif fraud_score > 0.4:
            return "#facc15"
        else:
            return "#6b7280"
    
    def _get_risk_level(self, fraud_score: float) -> str:
        """Get risk level text"""
        if fraud_score > 0.8:
            return "Critical"
        elif fraud_score > 0.6:
            return "High"
        elif fraud_score > 0.4:
            return "Medium"
        else:
            return "Low"

# Test
if __name__ == "__main__":
    analyzer = FraudGraphAnalyzer()
    
    sample_invoices = [
        {'invoice_no': 'INV001', 'vendor': 'Vendor A', 'company_id': 'COMP_001', 'total_amount': 50000, 'fraud_score': 0.85},
        {'invoice_no': 'INV002', 'vendor': 'Vendor A', 'company_id': 'COMP_002', 'total_amount': 30000, 'fraud_score': 0.75},
        {'invoice_no': 'INV003', 'vendor': 'Vendor B', 'company_id': 'COMP_001', 'total_amount': 20000, 'fraud_score': 0.3},
        {'invoice_no': 'INV004', 'vendor': 'Vendor C', 'company_id': 'COMP_003', 'total_amount': 100000, 'fraud_score': 0.9},
    ]
    
    result = analyzer.analyze_invoice_network(sample_invoices)
    print(json.dumps(result, indent=2))
