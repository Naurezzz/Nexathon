import json
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class ComplianceClause:
    """Represents a compliance clause requirement"""
    clause_id: str
    category: str
    name: str
    keywords: List[str]
    importance: str  # Critical, High, Medium, Low
    description: str
    recommendation: str

@dataclass
class ComplianceResult:
    """Result of compliance check"""
    clause_id: str
    category: str
    name: str
    found: bool
    confidence: float
    importance: str
    matched_text: str
    recommendation: str

class ComplianceChecker:
    """Advanced compliance checking system"""
    
    def __init__(self):
        self.clauses = self._load_standard_clauses()
    
    def _load_standard_clauses(self) -> List[ComplianceClause]:
        """Load standard compliance clauses for Indian contracts"""
        return [
            # Critical Clauses
            ComplianceClause(
                clause_id="CC001",
                category="Termination",
                name="Termination Clause",
                keywords=["termination", "terminate", "termination of agreement", "end of contract", "contract termination"],
                importance="Critical",
                description="Defines conditions under which the contract can be terminated",
                recommendation="Add a clear termination clause specifying notice period and conditions"
            ),
            ComplianceClause(
                clause_id="CC002",
                category="Liability",
                name="Limitation of Liability",
                keywords=["limitation of liability", "liability limit", "liable for", "damages limited", "indemnification"],
                importance="Critical",
                description="Limits the liability of parties involved",
                recommendation="Include a limitation of liability clause to protect against excessive claims"
            ),
            ComplianceClause(
                clause_id="CC003",
                category="Confidentiality",
                name="Confidentiality Clause",
                keywords=["confidential", "confidentiality", "non-disclosure", "proprietary information", "trade secrets"],
                importance="Critical",
                description="Protects sensitive business information",
                recommendation="Add confidentiality provisions to protect sensitive data and trade secrets"
            ),
            ComplianceClause(
                clause_id="CC004",
                category="Dispute Resolution",
                name="Arbitration/Dispute Resolution",
                keywords=["arbitration", "dispute resolution", "mediation", "jurisdiction", "governing law"],
                importance="Critical",
                description="Defines how disputes will be resolved",
                recommendation="Include arbitration clause to avoid costly litigation"
            ),
            
            # High Priority Clauses
            ComplianceClause(
                clause_id="CH001",
                category="Payment",
                name="Payment Terms",
                keywords=["payment", "payment terms", "invoice", "payment schedule", "consideration", "fees"],
                importance="High",
                description="Specifies payment obligations and schedules",
                recommendation="Clearly define payment terms, schedules, and late payment penalties"
            ),
            ComplianceClause(
                clause_id="CH002",
                category="Intellectual Property",
                name="IP Rights Clause",
                keywords=["intellectual property", "copyright", "trademark", "patent", "ip rights", "ownership"],
                importance="High",
                description="Defines ownership of intellectual property",
                recommendation="Specify IP ownership and usage rights to prevent future disputes"
            ),
            ComplianceClause(
                clause_id="CH003",
                category="Force Majeure",
                name="Force Majeure Clause",
                keywords=["force majeure", "acts of god", "unforeseen circumstances", "pandemic", "natural disaster"],
                importance="High",
                description="Addresses unforeseen circumstances beyond control",
                recommendation="Include force majeure clause covering pandemics, disasters, and other unforeseen events"
            ),
            ComplianceClause(
                clause_id="CH004",
                category="Data Protection",
                name="Data Privacy Compliance",
                keywords=["data protection", "privacy", "gdpr", "personal data", "data processing", "data security"],
                importance="High",
                description="Ensures compliance with data protection regulations",
                recommendation="Add data privacy provisions compliant with applicable laws (GDPR, IT Act)"
            ),
            
            # Medium Priority Clauses
            ComplianceClause(
                clause_id="CM001",
                category="Warranties",
                name="Warranties and Representations",
                keywords=["warranty", "warranties", "representation", "guarantee", "assurance"],
                importance="Medium",
                description="Statements of fact or promises by parties",
                recommendation="Include appropriate warranties while avoiding over-commitment"
            ),
            ComplianceClause(
                clause_id="CM002",
                category="Amendment",
                name="Amendment Clause",
                keywords=["amendment", "modification", "change", "variation", "alter"],
                importance="Medium",
                description="Process for modifying the agreement",
                recommendation="Specify how the contract can be amended (written consent, mutual agreement)"
            ),
            ComplianceClause(
                clause_id="CM003",
                category="Assignment",
                name="Assignment Clause",
                keywords=["assignment", "transfer", "assignable", "subcontract"],
                importance="Medium",
                description="Whether parties can transfer rights/obligations",
                recommendation="Clarify if and how contract rights can be assigned to third parties"
            ),
            ComplianceClause(
                clause_id="CM004",
                category="Notice",
                name="Notice Provisions",
                keywords=["notice", "notification", "written notice", "email", "communication"],
                importance="Medium",
                description="How parties should communicate formally",
                recommendation="Define acceptable methods and timelines for formal notices"
            ),
            
            # Low Priority Clauses
            ComplianceClause(
                clause_id="CL001",
                category="Miscellaneous",
                name="Entire Agreement Clause",
                keywords=["entire agreement", "whole agreement", "supersedes", "complete agreement"],
                importance="Low",
                description="States this is the complete agreement",
                recommendation="Add entire agreement clause to prevent reliance on external communications"
            ),
            ComplianceClause(
                clause_id="CL002",
                category="Miscellaneous",
                name="Severability Clause",
                keywords=["severability", "severable", "invalid provision", "unenforceable"],
                importance="Low",
                description="If one provision is invalid, others remain valid",
                recommendation="Include severability to protect rest of contract if one clause is unenforceable"
            ),
        ]
    
    def check_document(self, document_text: str, document_id: str = None) -> Dict[str, Any]:
        """
        Check a document for compliance
        
        Args:
            document_text: Full text of the document
            document_id: Optional document identifier
            
        Returns:
            Comprehensive compliance report
        """
        document_text_lower = document_text.lower()
        results = []
        
        # Check each clause
        for clause in self.clauses:
            found, confidence, matched_text = self._check_clause(document_text_lower, clause)
            
            result = ComplianceResult(
                clause_id=clause.clause_id,
                category=clause.category,
                name=clause.name,
                found=found,
                confidence=confidence,
                importance=clause.importance,
                matched_text=matched_text,
                recommendation=clause.recommendation if not found else "✓ Clause present"
            )
            
            results.append(result)
        
        # Calculate scores
        summary = self._calculate_summary(results)
        
        return {
            'document_id': document_id or f"DOC_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'timestamp': datetime.now().isoformat(),
            'summary': summary,
            'results': [asdict(r) for r in results],
            'recommendations': self._generate_recommendations(results)
        }
    
    def _check_clause(self, document_text: str, clause: ComplianceClause) -> tuple:
        """Check if a clause exists in the document"""
        matched_keywords = []
        matched_text = ""
        
        for keyword in clause.keywords:
            if keyword in document_text:
                matched_keywords.append(keyword)
                # Extract context around keyword
                idx = document_text.find(keyword)
                start = max(0, idx - 50)
                end = min(len(document_text), idx + len(keyword) + 50)
                matched_text = document_text[start:end].strip()
        
        if matched_keywords:
            # Confidence based on number of keywords matched
            confidence = min(len(matched_keywords) / len(clause.keywords), 1.0)
            return True, confidence, matched_text
        
        return False, 0.0, ""
    
    def _calculate_summary(self, results: List[ComplianceResult]) -> Dict[str, Any]:
        """Calculate compliance summary statistics"""
        total_clauses = len(results)
        found_clauses = sum(1 for r in results if r.found)
        
        # Weight by importance
        importance_weights = {
            'Critical': 4,
            'High': 3,
            'Medium': 2,
            'Low': 1
        }
        
        total_weight = sum(importance_weights[r.importance] for r in results)
        achieved_weight = sum(importance_weights[r.importance] for r in results if r.found)
        
        weighted_score = (achieved_weight / total_weight * 100) if total_weight > 0 else 0
        
        # Categorize missing clauses by importance
        missing_by_importance = {
            'Critical': [r for r in results if not r.found and r.importance == 'Critical'],
            'High': [r for r in results if not r.found and r.importance == 'High'],
            'Medium': [r for r in results if not r.found and r.importance == 'Medium'],
            'Low': [r for r in results if not r.found and r.importance == 'Low']
        }
        
        # Determine risk level
        critical_missing = len(missing_by_importance['Critical'])
        high_missing = len(missing_by_importance['High'])
        
        if critical_missing > 2:
            risk_level = "Critical"
        elif critical_missing > 0 or high_missing > 3:
            risk_level = "High"
        elif high_missing > 0:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        return {
            'total_clauses_checked': total_clauses,
            'clauses_found': found_clauses,
            'clauses_missing': total_clauses - found_clauses,
            'compliance_score': round(weighted_score, 2),
            'risk_level': risk_level,
            'critical_issues': critical_missing,
            'high_issues': high_missing,
            'medium_issues': len(missing_by_importance['Medium']),
            'low_issues': len(missing_by_importance['Low'])
        }
    
    def _generate_recommendations(self, results: List[ComplianceResult]) -> List[Dict[str, str]]:
        """Generate prioritized recommendations"""
        recommendations = []
        
        # Get missing clauses sorted by importance
        missing = [r for r in results if not r.found]
        importance_order = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}
        missing.sort(key=lambda x: importance_order[x.importance])
        
        for idx, result in enumerate(missing[:5], 1):  # Top 5 recommendations
            recommendations.append({
                'priority': idx,
                'clause': result.name,
                'category': result.category,
                'importance': result.importance,
                'recommendation': result.recommendation
            })
        
        return recommendations

# Test function
if __name__ == "__main__":
    checker = ComplianceChecker()
    
    # Sample contract text
    sample_contract = """
    This Agreement made on 1st January 2025 between Party A and Party B.
    
    Payment Terms: Party B shall pay Party A Rs. 100,000 within 30 days of invoice.
    
    Confidentiality: Both parties agree to keep all information confidential.
    
    Governing Law: This agreement shall be governed by the laws of India.
    """
    
    result = checker.check_document(sample_contract)
    print(json.dumps(result, indent=2))
