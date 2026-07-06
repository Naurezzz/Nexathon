import { useState } from 'react';
import { AlertTriangle, CheckCircle, Shield, TrendingUp, XCircle, Info, Download, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function FraudBatchResults({ batchData }) {
  const [exporting, setExporting] = useState(false);

  const getRiskColor = (score) => {
    if (score > 0.8) return 'bg-red-500/5 border-red-500/20';
    if (score > 0.6) return 'bg-orange-500/5 border-orange-500/20';
    if (score > 0.4) return 'bg-amber-500/5 border-amber-500/20';
    return 'bg-[#028355]/5 border-[#028355]/20';
  };

  const getScoreColor = (score) => {
    if (score > 80) return 'text-red-600';
    if (score > 60) return 'text-orange-600';
    if (score > 40) return 'text-amber-600';
    return 'text-[#028355]';
  };

  const getRiskIcon = (score) => {
    if (score > 0.8) return <XCircle size={20} className="text-red-600" strokeWidth={2} />;
    if (score > 0.6) return <AlertTriangle size={20} className="text-orange-600" strokeWidth={2} />;
    if (score > 0.4) return <Info size={20} className="text-amber-600" strokeWidth={2} />;
    return <CheckCircle size={20} className="text-[#028355]" strokeWidth={2} />;
  };

  const getRiskBadge = (score) => {
    if (score > 0.8) return { text: 'HIGH RISK', class: 'bg-red-600 text-white' };
    if (score > 0.6) return { text: 'SUSPICIOUS', class: 'bg-orange-600 text-white' };
    if (score > 0.4) return { text: 'WARNING', class: 'bg-amber-600 text-white' };
    return { text: 'CLEAN', class: 'bg-[#028355] text-white' };
  };

  const handleExportAll = async (format) => {
    setExporting(true);
    try {
      const uploadIds = batchData.results
        .filter(file => file.uploadId)
        .map(file => file.uploadId);

      if (uploadIds.length === 0) {
        toast.error('No upload IDs found for export');
        return;
      }

      for (const uploadId of uploadIds) {
        const response = await fetch(`${API_BASE}/api/upload/export/${uploadId}/${format}`, {
          method: 'GET',
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `fraud_report_${uploadId}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }

      toast.success(`Successfully exported ${uploadIds.length} report(s) as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Flatten all invoices from all files into a single array
  const allInvoices = [];
  batchData.results?.forEach((file, fileIdx) => {
    const predictions = file.summary?.predictions || [];
    predictions.forEach((invoice, invIdx) => {
      allInvoices.push({
        ...invoice,
        fileName: file.fileName,
        displayName: `Invoice ${String.fromCharCode(65 + allInvoices.length)}`, // A, B, C, D...
        fileIndex: fileIdx,
        invoiceIndex: invIdx
      });
    });
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Batch Summary Card */}
      <div className="bg-gradient-to-br from-[#028355]/10 to-emerald-50 rounded-3xl border-2 border-[#028355]/20 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#028355] rounded-xl shadow-sm">
              <Shield size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#000e00]">Batch Processing Summary</h3>
              <p className="text-sm text-[#000e00]/60">Analysis complete for all invoices</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleExportAll('pdf')}
              disabled={exporting}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 
                       text-red-700 rounded-xl font-semibold text-sm transition-all flex items-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : <Download size={16} strokeWidth={2} />}
              Export PDF
            </button>
            <button 
              onClick={() => handleExportAll('excel')}
              disabled={exporting}
              className="px-4 py-2.5 bg-[#028355]/10 hover:bg-[#028355]/20 border border-[#028355]/20 
                       text-[#028355] rounded-xl font-semibold text-sm transition-all flex items-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : <Download size={16} strokeWidth={2} />}
              Export Excel
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#000e00]/60 text-sm mb-1">Total Invoices</p>
            <p className="text-3xl font-bold text-[#000e00]">{batchData.totalInvoices || 0}</p>
          </div>
          <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#000e00]/60 text-sm mb-1">Suspicious</p>
            <p className="text-3xl font-bold text-red-600">{batchData.totalSuspicious || 0}</p>
          </div>
          <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#000e00]/60 text-sm mb-1">Overall Risk</p>
            <p className="text-3xl font-bold text-orange-600">{batchData.overallRisk || 0}%</p>
          </div>
          <div className="text-center bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[#000e00]/60 text-sm mb-1">Files Processed</p>
            <p className="text-3xl font-bold text-[#028355]">{batchData.filesProcessed || 0}</p>
          </div>
        </div>
      </div>

      {/* Individual Invoice Results */}
      <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={24} className="text-[#028355]" strokeWidth={2.5} />
          <h3 className="text-xl font-bold text-[#000e00]">Invoice Results</h3>
        </div>
        
        <div className="space-y-4">
          {allInvoices.map((invoice, idx) => {
            const badge = getRiskBadge(invoice.fraud_score);
            
            return (
              <div 
                key={idx}
                className={`p-6 rounded-2xl border-2 ${getRiskColor(invoice.fraud_score)} hover:scale-[1.01] transition-all duration-200`}
              >
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="text-lg font-bold text-[#000e00]">{invoice.displayName}</h4>
                      <span className="text-xs px-3 py-1 bg-[#e9edf4] border border-[#000e00]/10 rounded-full text-[#000e00]/70 font-medium">
                        {invoice.invoice_no}
                      </span>
                    </div>
                    <p className="text-sm text-[#000e00]/60">
                      <strong>Vendor:</strong> {invoice.vendor} • <strong>Source:</strong> {invoice.fileName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-2xl font-bold ${getScoreColor(invoice.fraud_probability)}`}>
                      {invoice.fraud_probability.toFixed(1)}%
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.class}`}>
                      {badge.text}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-[#e9edf4] rounded-xl p-3 border border-[#000e00]/5">
                    <p className="text-xs text-[#000e00]/60 mb-1">Fraud Score</p>
                    <p className="text-lg font-bold text-[#000e00]">
                      {(invoice.fraud_score * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-[#e9edf4] rounded-xl p-3 border border-[#000e00]/5">
                    <p className="text-xs text-[#000e00]/60 mb-1">Risk Level</p>
                    <p className={`text-sm font-bold ${getScoreColor(invoice.fraud_probability)}`}>
                      {badge.text}
                    </p>
                  </div>
                  <div className="bg-[#e9edf4] rounded-xl p-3 border border-[#000e00]/5">
                    <p className="text-xs text-[#000e00]/60 mb-1">Anomaly Score</p>
                    <p className="text-lg font-bold text-blue-600">
                      {invoice.anomaly_score?.toFixed(3) || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-[#e9edf4] rounded-xl p-3 border border-[#000e00]/5">
                    <p className="text-xs text-[#000e00]/60 mb-1">Status</p>
                    <p className={`text-sm font-bold ${invoice.is_suspicious ? 'text-red-600' : 'text-[#028355]'}`}>
                      {invoice.is_suspicious ? 'FLAGGED' : 'CLEAN'}
                    </p>
                  </div>
                </div>

                {/* Fraud Probability Bar */}
                <div className="bg-[#e9edf4] rounded-xl p-4 mb-4 border border-[#000e00]/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#000e00]/70 text-sm font-medium">Fraud Probability</span>
                    <span className="text-xl font-bold text-[#000e00]">{invoice.fraud_probability.toFixed(2)}%</span>
                  </div>
                  <div className="h-3 bg-white rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${
                        invoice.fraud_score > 0.8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        invoice.fraud_score > 0.6 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                        invoice.fraud_score > 0.4 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                        'bg-gradient-to-r from-[#028355] to-emerald-600'
                      }`}
                      style={{ width: `${Math.min(invoice.fraud_probability, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-[#028355]/5 border border-[#028355]/20 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Shield size={20} className="text-[#028355] mt-0.5 flex-shrink-0" strokeWidth={2} />
                    <div>
                      <p className="text-xs font-semibold text-[#000e00]/60 mb-1">AI Recommendation</p>
                      <p className="text-sm text-[#000e00] leading-relaxed">{invoice.recommendation}</p>
                    </div>
                  </div>
                </div>

                {/* Top Risk Factors */}
                {invoice.top_reasons && invoice.top_reasons.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-[#000e00] mb-3 flex items-center gap-2">
                      <span className="text-lg">🔍</span>
                      AI Explainability - Top Risk Factors
                    </h5>
                    <div className="space-y-2">
                      {invoice.top_reasons.map((reason, reasonIdx) => (
                        <div 
                          key={reasonIdx}
                          className={`bg-white border-2 rounded-xl p-4 transition-all hover:shadow-sm ${
                            reason.impact > 0 ? 'border-red-500/20' : 'border-[#028355]/20'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                            <span className="font-semibold text-sm text-[#000e00]">
                              {reason.feature}
                            </span>
                            <span className={`text-sm font-bold ${
                              reason.impact > 0 ? 'text-red-600' : 'text-[#028355]'
                            }`}>
                              Impact: {reason.impact > 0 ? '+' : ''}{reason.impact.toFixed(4)}
                            </span>
                          </div>
                          <p className="text-xs text-[#000e00]/70 leading-relaxed">
                            {reason.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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

export default FraudBatchResults;
