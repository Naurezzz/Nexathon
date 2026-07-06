import { useState } from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle, XCircle, Info, Upload, Files, Sparkles, Loader2, Brain } from 'lucide-react';
import axios from '../config/axios';
import ComplianceFileUpload from './ComplianceFileUpload';
import ComplianceBatchUpload from './ComplianceBatchUpload';
import AIMentorModal from '../components/AIMentorModal';
import { saveToHistory } from '../utils/saveToHistory';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function ComplianceChecker() {
  const [showAIMentor, setShowAIMentor] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('manual');

  // 🔗 BLOCKCHAIN INTEGRATION
  const recordOnBlockchain = async (complianceResult) => {
    try {
      // Simple hash function for blockchain
      const hashResult = (data) => {
        return btoa(JSON.stringify(data)).substring(0, 64);
      };

      // Use native fetch to avoid axios config issues
      const response = await fetch('http://localhost:8007/add_transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: `COMPLIANCE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          document_hash: hashResult(complianceResult),
          validation_result: complianceResult.summary?.risk_level || 'ANALYZED',
          authenticity_score: complianceResult.summary?.compliance_score || 0,
          document_type: 'COMPLIANCE_AUDIT',
          verified_by: 'AEGIS_AI_COMPLIANCE_AGENT',
          metadata: {
            documentName: complianceResult.documentName || 'Unknown',
            totalClauses: complianceResult.summary?.total_clauses_checked || 0,
            clausesFound: complianceResult.summary?.clauses_found || 0,
            criticalIssues: complianceResult.summary?.critical_issues || 0,
            highIssues: complianceResult.summary?.high_issues || 0,
            riskLevel: complianceResult.summary?.risk_level || 'Unknown'
          }
        })
      });

      if (response.ok) {
        console.log('✅ Compliance result recorded on blockchain');
        toast.success('Recorded on blockchain!', { duration: 2000 });
      }
    } catch (error) {
      console.error('⚠️ Blockchain recording failed:', error);
      // Silently fail - don't break the app if blockchain is down
    }
  };

  const handleCheck = async () => {
    if (!documentText || documentText.length < 50) {
      toast.error('Please enter at least 50 characters of contract text');
      return;
    }

    setChecking(true);

    try {
      const response = await axios.post(`${API_BASE}/api/compliance/check`, {
        documentText,
        documentName: documentName || 'Untitled Contract',
        documentType: 'contract',
        companyId: 'test_company_001'
      });

      setResults(response.data);
      toast.success('Compliance check complete!');
      
      // Save to history
      saveToHistory('compliance', response.data, {
        fileName: documentName || 'Manual Entry',
        documentType: 'contract'
      });

      // 🔗 Record on blockchain
      await recordOnBlockchain(response.data);

    } catch (error) {
      console.error('Compliance check error:', error);
      toast.error(error.response?.data?.details || 'Compliance check failed');
    } finally {
      setChecking(false);
    }
  };

  const loadSampleContract = () => {
    setDocumentName('Sample Employment Agreement');
    setDocumentText(`EMPLOYMENT AGREEMENT

This Agreement is made on 1st January 2025 between ABC Technologies Pvt Ltd (Employer) and John Doe (Employee).

1. PAYMENT TERMS
The Employee shall receive a monthly salary of Rs. 100,000 payable by the 5th of each month.

2. CONFIDENTIALITY
The Employee agrees to keep all proprietary information, trade secrets, and confidential data strictly confidential during and after employment.

3. INTELLECTUAL PROPERTY
All work product, inventions, and intellectual property created during employment shall belong to the Employer.

4. DISPUTE RESOLUTION
Any disputes arising from this agreement shall be resolved through arbitration in Mumbai, India under the Indian Arbitration Act.

5. TERMINATION
Either party may terminate this agreement with 30 days written notice. The Employer may terminate immediately for cause.

6. GOVERNING LAW
This agreement shall be governed by the laws of India.

7. DATA PROTECTION
The Employer shall process personal data in compliance with applicable data protection laws including IT Act 2000.

Signed and agreed by both parties on the date mentioned above.`);
    toast.success('Sample contract loaded!');
  };

  const getRiskColor = (riskLevel) => {
    const colors = {
      'Low': 'text-[#028355] bg-[#028355]/10 border-[#028355]/20',
      'Medium': 'text-amber-600 bg-amber-500/10 border-amber-500/20',
      'High': 'text-orange-600 bg-orange-500/10 border-orange-500/20',
      'Critical': 'text-red-600 bg-red-500/10 border-red-500/20'
    };
    return colors[riskLevel] || colors['Medium'];
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[#028355]';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-[#028355]/5 border-[#028355]/20';
    if (score >= 60) return 'bg-amber-500/5 border-amber-500/20';
    if (score >= 40) return 'bg-orange-500/5 border-orange-500/20';
    return 'bg-red-500/5 border-red-500/20';
  };

  const handleFileAnalysisComplete = (data) => {
    setResults(data);
    setChecking(false);
    toast.success('Analysis complete!');
    
    // Save to history
    saveToHistory('compliance', data, {
      fileName: data.documentName || 'Uploaded Document',
      analysisType: 'file-upload'
    });

    // 🔗 Record on blockchain
    recordOnBlockchain(data);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResults(null);
    setChecking(false);
  };

  // Check if results contain batch data
  const isBatchResult = results?.batchSummary && results?.results && results.results.length > 0;

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl shadow-sm">
            <Shield size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-[#000e00]">Compliance Checker</h1>
        </div>
        <p className="text-[#000e00]/60 ml-14">AI-powered contract compliance analysis</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => handleTabChange('manual')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
            activeTab === 'manual'
              ? 'bg-[#028355] text-white shadow-sm'
              : 'bg-white text-[#000e00] hover:bg-[#e9edf4] border border-[#000e00]/10'
          }`}
        >
          <FileText size={20} strokeWidth={2} />
          Manual Entry
        </button>
        <button
          onClick={() => handleTabChange('file')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
            activeTab === 'file'
              ? 'bg-[#028355] text-white shadow-sm'
              : 'bg-white text-[#000e00] hover:bg-[#e9edf4] border border-[#000e00]/10'
          }`}
        >
          <Upload size={20} strokeWidth={2} />
          File Upload
        </button>
        <button
          onClick={() => handleTabChange('batch')}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all whitespace-nowrap ${
            activeTab === 'batch'
              ? 'bg-[#028355] text-white shadow-sm'
              : 'bg-white text-[#000e00] hover:bg-[#e9edf4] border border-[#000e00]/10'
          }`}
        >
          <Files size={20} strokeWidth={2} />
          Batch Upload
          <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-bold">
            NEW
          </span>
        </button>
      </div>

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8 mb-8 animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#028355]/10 rounded-xl">
              <FileText size={24} className="text-[#028355]" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#000e00]">Contract Text Analysis</h2>
              <p className="text-[#000e00]/60 text-sm">Paste your contract for instant compliance checking</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#000e00] mb-2">
                Document Name
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., Employment Agreement 2025"
                className="w-full px-4 py-3 rounded-2xl border border-[#000e00]/10 bg-[#e9edf4] 
                         text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 
                         focus:ring-[#028355]/20 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#000e00] mb-2">
                Contract Text
              </label>
              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste your contract or agreement text here (minimum 50 characters)..."
                rows={14}
                className="w-full px-4 py-3 rounded-2xl border border-[#000e00]/10 bg-[#e9edf4] 
                         text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 
                         focus:ring-[#028355]/20 focus:bg-white transition-all font-mono text-sm resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-[#000e00]/50">
                  Character count: <strong className={documentText.length >= 50 ? 'text-[#028355]' : 'text-red-600'}>{documentText.length}</strong> / 50 minimum
                </p>
                <button
                  onClick={loadSampleContract}
                  className="text-xs px-3 py-1.5 bg-[#028355]/10 hover:bg-[#028355]/20 text-[#028355] rounded-lg font-semibold transition-all"
                >
                  Load Sample Contract
                </button>
              </div>
            </div>

            <button
              onClick={handleCheck}
              disabled={checking || documentText.length < 50}
              className="w-full py-4 bg-[#028355] hover:bg-[#028355]/90 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {checking ? (
                <>
                  <Loader2 size={20} className="animate-spin" strokeWidth={2.5} />
                  <span>Checking Compliance...</span>
                </>
              ) : (
                <>
                  <Shield size={20} strokeWidth={2.5} />
                  <span>Check Compliance</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <ComplianceFileUpload onAnalysisComplete={handleFileAnalysisComplete} />
      )}

      {/* Batch Upload Tab */}
      {activeTab === 'batch' && (
        <ComplianceBatchUpload onAnalysisComplete={handleFileAnalysisComplete} />
      )}

      {/* Loading State */}
      {checking && (
        <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-16 text-center animate-fadeIn">
          <Loader2 size={64} className="text-[#028355] animate-spin mx-auto mb-6" strokeWidth={2.5} />
          <h3 className="text-2xl font-bold text-[#000e00] mb-2">Analyzing Contract...</h3>
          <p className="text-[#000e00]/60">AI is checking compliance with 14+ critical clauses</p>
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {results && !checking && (
        <>
          {/* BATCH RESULTS */}
          {isBatchResult ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Batch Summary Card */}
              <div className="bg-gradient-to-br from-[#028355]/10 to-emerald-50 rounded-3xl border-2 border-[#028355]/20 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#028355] rounded-xl">
                    <Files size={24} className="text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-[#000e00]">Batch Processing Summary</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-[#000e00]/60 text-sm mb-1">Total Documents</p>
                    <p className="text-3xl font-bold text-[#000e00]">{results.batchSummary?.total_documents || 0}</p>
                  </div>
                  <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-[#000e00]/60 text-sm mb-1">Avg Compliance</p>
                    <p className={`text-3xl font-bold ${getScoreColor(parseFloat(results.batchSummary?.average_compliance_score || 0))}`}>
                      {results.batchSummary?.average_compliance_score || 0}%
                    </p>
                  </div>
                  <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-[#000e00]/60 text-sm mb-1">Critical Issues</p>
                    <p className="text-3xl font-bold text-red-600">{results.batchSummary?.total_critical_issues || 0}</p>
                  </div>
                  <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
                    <p className="text-[#000e00]/60 text-sm mb-1">High Issues</p>
                    <p className="text-3xl font-bold text-orange-600">{results.batchSummary?.total_high_issues || 0}</p>
                  </div>
                </div>
              </div>

              {/* Individual Document Results */}
              <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
                <h3 className="text-xl font-bold text-[#000e00] mb-6">Document Results</h3>
                <div className="space-y-4">
                  {results.results.map((doc, idx) => (
                    <div 
                      key={idx} 
                      className={`p-6 rounded-2xl border-2 ${getScoreBgColor(doc.summary?.compliance_score || 0)} hover:scale-[1.01] transition-all`}
                    >
                      {/* Document Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-bold text-[#000e00]">{doc.documentName || `Document ${idx + 1}`}</h4>
                            {doc.fileName && doc.fileName !== doc.documentName && (
                              <span className="text-xs text-[#000e00]/50">({doc.fileName})</span>
                            )}
                          </div>
                          <p className="text-xs text-[#000e00]/60">Check ID: {doc.checkId || 'N/A'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-2xl font-bold ${getScoreColor(doc.summary?.compliance_score || 0)}`}>
                            {doc.summary?.compliance_score || 0}%
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(doc.summary?.risk_level || 'Medium')}`}>
                            {doc.summary?.risk_level || 'Unknown'} Risk
                          </span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white rounded-xl p-3 border border-[#000e00]/5">
                          <p className="text-xs text-[#000e00]/60 mb-1">Clauses Found</p>
                          <p className="text-lg font-bold text-[#028355]">
                            {doc.summary?.clauses_found || 0}/{doc.summary?.total_clauses_checked || 0}
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-[#000e00]/5">
                          <p className="text-xs text-[#000e00]/60 mb-1">Critical</p>
                          <p className="text-lg font-bold text-red-600">{doc.summary?.critical_issues || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-[#000e00]/5">
                          <p className="text-xs text-[#000e00]/60 mb-1">High</p>
                          <p className="text-lg font-bold text-orange-600">{doc.summary?.high_issues || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-[#000e00]/5">
                          <p className="text-xs text-[#000e00]/60 mb-1">Medium</p>
                          <p className="text-lg font-bold text-amber-600">{doc.summary?.medium_issues || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* SINGLE DOCUMENT RESULTS */
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-[#000e00]/5 p-6">
                  <p className="text-[#000e00]/60 text-sm mb-2">Compliance Score</p>
                  <h3 className={`text-4xl font-bold ${getScoreColor(results.summary?.compliance_score || 0)}`}>
                    {results.summary?.compliance_score || 0}%
                  </h3>
                </div>
                
                <div className={`rounded-2xl shadow-sm border-2 p-6 ${getRiskColor(results.summary?.risk_level || 'Medium')}`}>
                  <p className="text-[#000e00]/60 text-sm mb-2">Risk Level</p>
                  <h3 className="text-2xl font-bold text-[#000e00]">
                    {results.summary?.risk_level || 'Unknown'}
                  </h3>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-[#000e00]/5 p-6">
                  <p className="text-[#000e00]/60 text-sm mb-2">Clauses Found</p>
                  <h3 className="text-4xl font-bold text-[#028355]">
                    {results.summary?.clauses_found || 0}<span className="text-2xl text-[#000e00]/40">/{results.summary?.total_clauses_checked || 0}</span>
                  </h3>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-[#000e00]/5 p-6">
                  <p className="text-[#000e00]/60 text-sm mb-2">Critical Issues</p>
                  <h3 className="text-4xl font-bold text-red-600">
                    {results.summary?.critical_issues || 0}
                  </h3>
                </div>
              </div>

              {/* AI Mentor Button */}
              <button
                onClick={() => setShowAIMentor(true)}
                className="w-full py-4 bg-gradient-to-r from-[#028355] to-emerald-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Brain className="w-5 h-5" strokeWidth={2.5} />
                <span>Ask AI Mentor About This Analysis</span>
                <Sparkles className="w-5 h-5 animate-pulse" strokeWidth={2.5} />
              </button>

              {/* Detailed Results */}
              {results.results && Array.isArray(results.results) && (
                <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
                  <h3 className="text-xl font-bold text-[#000e00] mb-6">Detailed Compliance Analysis</h3>
                  <div className="space-y-3">
                    {results.results.map((result, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border ${
                          result.found ? 'bg-[#028355]/5 border-[#028355]/20' : 
                          'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {result.found ? 
                              <CheckCircle size={20} className="text-[#028355] flex-shrink-0" strokeWidth={2} /> : 
                              <XCircle size={20} className="text-red-600 flex-shrink-0" strokeWidth={2} />
                            }
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#000e00]">{result.name}</h4>
                              <p className="text-xs text-[#000e00]/60">{result.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                              result.importance === 'Critical' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                              result.importance === 'High' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                              result.importance === 'Medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                              'bg-[#028355]/10 text-[#028355] border-[#028355]/20'
                            }`}>
                              {result.importance}
                            </span>
                            {result.found && (
                              <span className="text-xs text-[#000e00]/50 font-medium">
                                {(result.confidence * 100).toFixed(0)}% confident
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* AI Mentor Modal */}
      {showAIMentor && results && (
        <AIMentorModal
          analysisType="compliance"
          analysisResult={results}
          onClose={() => setShowAIMentor(false)}
        />
      )}

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

export default ComplianceChecker;
