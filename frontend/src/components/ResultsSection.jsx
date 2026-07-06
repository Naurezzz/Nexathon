import { AlertTriangle, CheckCircle, Info, TrendingUp, XCircle, Shield, Download, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function ResultsSection({ results }) {
  const [exporting, setExporting] = useState(false);

  // Map risk_category from backend to colors/badges
  const getRiskColor = (category) => {
    switch(category) {
      case 'CRITICAL': return 'border-red-500/20 bg-red-50';
      case 'HIGH': return 'border-orange-500/20 bg-orange-50';
      case 'MEDIUM': return 'border-amber-500/20 bg-amber-50';
      case 'LOW': return 'border-blue-500/20 bg-blue-50';
      case 'SAFE': return 'border-[#028355]/20 bg-[#028355]/5';
      default: return 'border-gray-500/20 bg-gray-50';
    }
  };

  const getRiskIcon = (category) => {
    switch(category) {
      case 'CRITICAL': return <XCircle size={24} className="text-red-600" strokeWidth={2} />;
      case 'HIGH': return <AlertTriangle size={24} className="text-orange-600" strokeWidth={2} />;
      case 'MEDIUM': return <AlertCircle size={24} className="text-amber-600" strokeWidth={2} />;
      case 'LOW': return <Info size={24} className="text-blue-600" strokeWidth={2} />;
      case 'SAFE': return <CheckCircle size={24} className="text-[#028355]" strokeWidth={2} />;
      default: return <Info size={24} className="text-gray-600" strokeWidth={2} />;
    }
  };

  const getRiskBadge = (category) => {
    const badges = {
      'CRITICAL': { text: '🚨 CRITICAL', class: 'bg-red-600 text-white' },
      'HIGH': { text: '⛔ HIGH RISK', class: 'bg-orange-600 text-white' },
      'MEDIUM': { text: '⚠️ MEDIUM RISK', class: 'bg-amber-600 text-white' },
      'LOW': { text: '⚡ LOW RISK', class: 'bg-blue-600 text-white' },
      'SAFE': { text: '✅ SAFE', class: 'bg-[#028355] text-white' }
    };
    return badges[category] || { text: category, class: 'bg-gray-600 text-white' };
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return 'border-red-500/30 bg-red-50';
      case 'HIGH': return 'border-orange-500/30 bg-orange-50';
      case 'MEDIUM': return 'border-amber-500/30 bg-amber-50';
      default: return 'border-blue-500/30 bg-blue-50';
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const uploadId = results.uploadId || results.upload_id;
      
      if (!uploadId) {
        toast.error('Unable to export: Upload ID not found');
        return;
      }

      const response = await fetch(`${API_BASE}/api/upload/export/${uploadId}/${format}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraud_report_${uploadId}_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Exported report as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
      
      {/* Header with Export Buttons */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#028355]/10 rounded-xl">
            <TrendingUp size={24} className="text-[#028355]" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#000e00]">Enhanced Fraud Analysis</h2>
            <p className="text-[#000e00]/60 text-sm">
              {results.predictions?.length || 0} invoices analyzed with ML + Rule-based detection
            </p>
          </div>
        </div>
        
        {/* Export Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 
                       text-red-700 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : <Download size={16} strokeWidth={2} />}
            Export PDF
          </button>
          <button 
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="px-4 py-2.5 bg-[#028355]/10 hover:bg-[#028355]/20 border border-[#028355]/20 
                       text-[#028355] rounded-xl font-semibold transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" strokeWidth={2} /> : <Download size={16} strokeWidth={2} />}
            Export Excel
          </button>
        </div>
      </div>

      {/* Fraud Detection Methods Banner */}
      <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
        <h3 className="text-lg font-bold text-[#000e00] mb-4 flex items-center gap-2">
          <Shield size={20} className="text-blue-600" strokeWidth={2.5} />
          Multi-Layer Fraud Detection System
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <DetectionMethod icon="🤖" title="ML Models" desc="XGBoost + Random Forest" />
          <DetectionMethod icon="📊" title="GST Validation" desc="Rate & Calculation Check" />
          <DetectionMethod icon="🔐" title="GSTIN API" desc="Government Verification" />
          <DetectionMethod icon="🔍" title="Duplicate Scan" desc="3 Detection Algorithms" />
          <DetectionMethod icon="⚠️" title="Pattern Analysis" desc="Threshold & Anomalies" />
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-6">
        {results.predictions && results.predictions.length > 0 ? (
          results.predictions.map((pred, index) => {
            const badge = getRiskBadge(pred.risk_category);
            const category = pred.risk_category || 'UNKNOWN';
            
            return (
              <div key={index} className={`border-l-4 rounded-2xl overflow-hidden ${getRiskColor(category)}`}>
                <div className="bg-white p-6">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      {getRiskIcon(category)}
                      <div>
                        <h3 className="text-xl font-bold text-[#000e00]">{pred.invoice_no}</h3>
                        <p className="text-[#000e00]/60">{pred.vendor}</p>
                        {pred.amount && (
                          <p className="text-sm font-semibold text-[#028355] mt-1">
                            Amount: ₹{pred.amount.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full font-bold text-sm ${badge.class} shadow-sm`}>
                      {badge.text}
                    </span>
                  </div>

                  {/* Fraud Score Bar */}
                  <div className="bg-[#e9edf4] rounded-xl p-4 mb-4 border border-[#000e00]/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#000e00]/70 text-sm font-medium">Fraud Probability</span>
                      <span className="text-2xl font-bold text-[#000e00]">{pred.fraud_probability.toFixed(2)}%</span>
                    </div>
                    <div className="h-3 bg-white rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${
                          category === 'CRITICAL' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          category === 'HIGH' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          category === 'MEDIUM' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                          category === 'LOW' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                          'bg-gradient-to-r from-[#028355] to-emerald-600'
                        }`}
                        style={{ width: `${Math.min(pred.fraud_probability, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Rule Violations */}
                  {pred.rule_violations && pred.rule_violations.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-[#000e00] mb-3 flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        Detected Issues ({pred.rule_violations.length})
                      </h4>
                      <div className="space-y-2">
                        {pred.rule_violations.map((violation, idx) => (
                          <div 
                            key={idx}
                            className={`border-2 rounded-xl p-4 ${getSeverityColor(violation.severity)}`}
                          >
                            <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                              <span className="font-bold text-sm text-[#000e00] flex items-center gap-2">
                                {violation.severity === 'CRITICAL' && '🚨'}
                                {violation.severity === 'HIGH' && '⛔'}
                                {violation.severity === 'MEDIUM' && '⚠️'}
                                {violation.rule.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs px-2 py-1 bg-white/50 rounded-full font-semibold">
                                {(violation.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                            <p className="text-sm text-[#000e00]/80 leading-relaxed">
                              {violation.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* GSTIN Verification Status */}
                  {pred.gstin_status && (
                    <div className={`mb-4 p-4 rounded-xl border-2 ${
                      pred.gstin_status.valid 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className={pred.gstin_status.valid ? 'text-green-600' : 'text-red-600'} strokeWidth={2} />
                        <span className="font-bold text-sm">
                          🔐 Government GSTIN Verification: {pred.gstin_status.status}
                        </span>
                      </div>
                      {pred.gstin_status.legal_name && (
                        <p className="text-xs text-[#000e00]/70 mb-1">
                          <strong>Legal Name:</strong> {pred.gstin_status.legal_name}
                        </p>
                      )}
                      <p className="text-xs text-[#000e00]/60">
                        {pred.gstin_status.message || 'Verified against official Indian GST records'}
                      </p>
                    </div>
                  )}

                  {/* Recommendation Box */}
                  <div className={`border-2 rounded-xl p-4 mb-4 ${
                    category === 'CRITICAL' ? 'bg-red-50 border-red-200' :
                    category === 'HIGH' ? 'bg-orange-50 border-orange-200' :
                    'bg-[#028355]/5 border-[#028355]/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Shield size={20} className={`mt-0.5 flex-shrink-0 ${
                        category === 'CRITICAL' ? 'text-red-600' :
                        category === 'HIGH' ? 'text-orange-600' :
                        'text-[#028355]'
                      }`} strokeWidth={2} />
                      <div>
                        <p className="text-xs font-semibold text-[#000e00]/60 mb-1">AI Recommendation</p>
                        <p className="text-sm text-[#000e00] leading-relaxed font-medium">
                          {pred.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Anomaly Score Footer */}
                  <div className="p-3 bg-[#e9edf4] rounded-xl border border-[#000e00]/5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-xs text-[#000e00]/70">
                        Anomaly Score: <span className="font-mono font-bold text-[#000e00]">
                          {pred.anomaly_score?.toFixed(4) || 'N/A'}
                        </span>
                      </p>
                      <p className="text-xs text-[#000e00]/50">
                        (Lower values = More anomalous)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#e9edf4] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={40} className="text-[#000e00]/20" strokeWidth={2} />
            </div>
            <p className="text-[#000e00]/60">No predictions available</p>
          </div>
        )}
      </div>

      {/* Enhanced Summary Footer */}
      {results.summary && (
        <div className="mt-8 pt-6 border-t border-[#000e00]/10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-[#e9edf4] rounded-2xl">
              <p className="text-[#000e00]/60 text-sm mb-1">Total</p>
              <p className="text-2xl font-bold text-[#000e00]">
                {results.summary.total_invoices || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-200">
              <p className="text-[#000e00]/60 text-sm mb-1">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {results.summary.risk_breakdown?.CRITICAL || results.summary.critical_count || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-2xl border border-orange-200">
              <p className="text-[#000e00]/60 text-sm mb-1">High Risk</p>
              <p className="text-2xl font-bold text-orange-600">
                {results.summary.risk_breakdown?.HIGH || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <p className="text-[#000e00]/60 text-sm mb-1">Medium</p>
              <p className="text-2xl font-bold text-amber-600">
                {results.summary.risk_breakdown?.MEDIUM || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-[#028355]/5 rounded-2xl border border-[#028355]/20">
              <p className="text-[#000e00]/60 text-sm mb-1">Clean</p>
              <p className="text-2xl font-bold text-[#028355]">
                {results.summary.clean_count || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for detection methods
function DetectionMethod({ icon, title, desc }) {
  return (
    <div className="bg-white p-3 rounded-xl border border-blue-200/50 text-center hover:shadow-sm transition-shadow">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs font-bold text-[#000e00]">{title}</div>
      <div className="text-xs text-[#000e00]/60 mt-1">{desc}</div>
    </div>
  );
}

export default ResultsSection;
