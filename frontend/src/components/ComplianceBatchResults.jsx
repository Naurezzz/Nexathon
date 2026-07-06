import { AlertTriangle, CheckCircle, XCircle, Files, Download, Eye } from 'lucide-react';

function ComplianceBatchResults({ batchData }) {
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
    if (score >= 80) return 'bg-[#028355]/5 border-[#028355]/20 hover:bg-[#028355]/10';
    if (score >= 60) return 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10';
    if (score >= 40) return 'bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10';
    return 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Batch Summary Card */}
      <div className="bg-gradient-to-br from-[#028355]/10 to-emerald-50 rounded-3xl border-2 border-[#028355]/20 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[#028355] rounded-xl shadow-sm">
            <Files size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-bold text-[#000e00]">Batch Processing Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#000e00]/60 text-sm mb-1">Total Documents</p>
            <p className="text-3xl font-bold text-[#000e00]">{batchData.batchSummary?.total_documents || 0}</p>
          </div>
          <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#000e00]/60 text-sm mb-1">Avg Compliance</p>
            <p className={`text-3xl font-bold ${getScoreColor(parseFloat(batchData.batchSummary?.average_compliance_score || 0))}`}>
              {batchData.batchSummary?.average_compliance_score || 0}%
            </p>
          </div>
          <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#000e00]/60 text-sm mb-1">Critical Issues</p>
            <p className="text-3xl font-bold text-red-600">{batchData.batchSummary?.total_critical_issues || 0}</p>
          </div>
          <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#000e00]/60 text-sm mb-1">High Issues</p>
            <p className="text-3xl font-bold text-orange-600">{batchData.batchSummary?.total_high_issues || 0}</p>
          </div>
        </div>
      </div>

      {/* Individual Document Results */}
      <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
        <h3 className="text-xl font-bold text-[#000e00] mb-6">Document Results</h3>
        <div className="space-y-4">
          {batchData.results && batchData.results.map((doc, idx) => (
            <div 
              key={idx} 
              className={`p-6 rounded-2xl border-2 ${getScoreBgColor(doc.summary?.compliance_score || 0)} transition-all duration-200`}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-xl p-3 border border-[#000e00]/5">
                  <p className="text-xs text-[#000e00]/60 mb-1">Clauses Found</p>
                  <p className="text-lg font-bold text-[#028355]">
                    {doc.summary?.clauses_found || 0}/{doc.summary?.total_clauses_checked || 0}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#000e00]/5">
                  <p className="text-xs text-[#000e00]/60 mb-1">Critical Issues</p>
                  <p className="text-lg font-bold text-red-600">{doc.summary?.critical_issues || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#000e00]/5">
                  <p className="text-xs text-[#000e00]/60 mb-1">High Issues</p>
                  <p className="text-lg font-bold text-orange-600">{doc.summary?.high_issues || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#000e00]/5">
                  <p className="text-xs text-[#000e00]/60 mb-1">Medium Issues</p>
                  <p className="text-lg font-bold text-amber-600">{doc.summary?.medium_issues || 0}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button className="text-xs px-4 py-2 bg-[#028355] hover:bg-[#028355]/90 text-white rounded-xl transition-all font-medium flex items-center gap-1.5 shadow-sm">
                  <Eye size={14} strokeWidth={2} />
                  View Details
                </button>
                <button className="text-xs px-4 py-2 bg-[#e9edf4] hover:bg-[#000e00]/5 border border-[#000e00]/10 text-[#000e00] rounded-xl transition-all font-medium flex items-center gap-1.5">
                  <Download size={14} strokeWidth={2} />
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ComplianceBatchResults;
