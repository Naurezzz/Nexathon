import { useState } from 'react';
import { Shield, Search, Loader2, CheckCircle2, AlertTriangle, XCircle, ExternalLink, Info, Sparkles, ArrowRight } from 'lucide-react';
import { checkURL } from '../services/cybersecurityApi';
import toast from 'react-hot-toast';
import AIMentorModal from '../components/AIMentorModal';
import { saveToHistory } from '../utils/saveToHistory';

const CyberSecurityAgent = () => {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [showAIMentor, setShowAIMentor] = useState(false);

  const handleCheckURL = async () => {
    try {
      if (!url.trim()) {
        toast.error('Please enter a URL');
        return;
      }

      setLoading(true);
      const response = await checkURL(url.trim());
      
      if (response.success) {
        setResult(response.check);
        toast.success('URL analyzed successfully');

        saveToHistory('cybersecurity', response.check, {
          url: url.trim(),
          scanDate: new Date().toISOString()
        });
      } else {
        toast.error('Analysis failed');
      }
      
    } catch (error) {
      console.error('URL check error:', error);
      toast.error('Failed to check URL');
    } finally {
      setLoading(false);
    }
  };

  const getPredictionStyle = (prediction) => {
    switch (prediction) {
      case 'Safe':
        return {
          bg: 'bg-[#028355]/5',
          border: 'border-[#028355]/20',
          text: 'text-[#028355]',
          icon: <CheckCircle2 className="w-7 h-7" />
        };
      case 'Suspicious':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          icon: <AlertTriangle className="w-7 h-7" />
        };
      case 'Phishing':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: <XCircle className="w-7 h-7" />
        };
      default:
        return {
          bg: 'bg-[#e9edf4]',
          border: 'border-[#000e00]/10',
          text: 'text-[#000e00]',
          icon: <Shield className="w-7 h-7" />
        };
    }
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      high: 'bg-red-50 text-red-700 border-red-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      low: 'bg-[#028355]/10 text-[#028355] border-[#028355]/20'
    };
    return styles[severity] || styles.medium;
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#000e00] mb-2">URL Security Scanner</h2>
        <p className="text-[#000e00]/60">AI-powered phishing detection with real-time threat analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Panel - Input */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-[#000e00]/5 p-6 sticky top-24">
            
            <div className="flex items-center gap-2.5 mb-6">
              <Search className="w-5 h-5 text-[#028355]" strokeWidth={2} />
              <h3 className="text-lg font-semibold text-[#000e00]">Security Check</h3>
            </div>

            <div className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-[#000e00]/70 mb-2.5">
                  Enter URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckURL()}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3.5 border border-[#000e00]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#028355]/20 focus:border-[#028355]/30 text-[#000e00] placeholder:text-[#000e00]/30 transition-all duration-200"
                />
              </div>

              <button
                onClick={handleCheckURL}
                disabled={loading}
                className="w-full px-6 py-4 bg-[#028355] text-white font-medium rounded-2xl hover:bg-[#028355]/90 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2.5 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" strokeWidth={2.5} />
                    <span>Scan URL</span>
                    <ArrowRight className="w-4 h-4 ml-auto" strokeWidth={2.5} />
                  </>
                )}
              </button>

              {/* Quick Examples */}
              <div className="pt-4 border-t border-[#000e00]/5">
                <p className="text-xs font-medium text-[#000e00]/50 uppercase tracking-wide mb-3">
                  Quick Test
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => setUrl('https://www.google.com')}
                    className="w-full text-left px-4 py-2.5 text-sm bg-[#e9edf4] text-[#000e00]/70 rounded-xl hover:bg-[#028355]/5 hover:text-[#028355] transition-colors duration-150"
                  >
                    <span className="text-[#028355] mr-2">✓</span>
                    Safe URL Example
                  </button>
                  <button
                    onClick={() => setUrl('http://secure-login-paypal-verify.tk')}
                    className="w-full text-left px-4 py-2.5 text-sm bg-[#e9edf4] text-[#000e00]/70 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
                  >
                    <span className="text-red-500 mr-2">⚠</span>
                    Suspicious URL Example
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-[#028355]/5 rounded-2xl border border-[#028355]/10">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-[#028355] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-xs text-[#000e00]/70 leading-relaxed">
                    Our AI examines 24+ security indicators including domain age, SSL certificates, 
                    suspicious patterns, and threat intelligence databases.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-3">
          {result ? (
            <div className="space-y-6">
              
              {/* Main Result Card */}
              <div className={`${getPredictionStyle(result.prediction).bg} rounded-3xl border ${getPredictionStyle(result.prediction).border} p-6 sm:p-8 shadow-sm`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={getPredictionStyle(result.prediction).text}>
                      {getPredictionStyle(result.prediction).icon}
                    </div>
                    <div>
                      <h3 className={`text-2xl sm:text-3xl font-semibold ${getPredictionStyle(result.prediction).text} mb-1`}>
                        {result.prediction}
                      </h3>
                      <p className={`text-sm ${getPredictionStyle(result.prediction).text} opacity-70`}>
                        Security Status
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getPredictionStyle(result.prediction).text}`}>
                      {(result.risk_score * 100).toFixed(0)}%
                    </div>
                    <div className={`text-xs ${getPredictionStyle(result.prediction).text} opacity-70 mt-1`}>
                      Risk Level
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 p-4 bg-white/80 rounded-2xl border border-[#000e00]/5">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 text-[#000e00]/40 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-[#000e00]/70 font-mono break-all leading-relaxed">
                      {result.url}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-white rounded-3xl border border-[#000e00]/5 p-6 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-[#028355] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <h4 className="text-base font-semibold text-[#000e00]">Recommendation</h4>
                </div>
                <p className="text-sm text-[#000e00]/70 leading-relaxed pl-8">
                  {result.recommendation}
                </p>
              </div>

              {/* Security Indicators */}
              <div className="bg-white rounded-3xl border border-[#000e00]/5 p-6 sm:p-8 shadow-sm">
                <h4 className="text-lg font-semibold text-[#000e00] mb-5">
                  Security Indicators
                </h4>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.indicators?.slice(0, 10).map((indicator, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-2xl border ${
                        indicator.severity === 'high' ? 'bg-red-50 border-red-200' :
                        indicator.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                        'bg-[#028355]/5 border-[#028355]/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#000e00]">
                          {indicator.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getSeverityBadge(indicator.severity)}`}>
                          {indicator.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[#000e00]/60 leading-relaxed">
                        {indicator.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-[#000e00]/5 p-5 shadow-sm">
                  <div className="text-2xl font-bold text-[#028355] mb-1">
                    {(result.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-[#000e00]/50">Confidence</div>
                </div>
                <div className="bg-white rounded-2xl border border-[#000e00]/5 p-5 shadow-sm">
                  <div className="text-2xl font-bold text-[#000e00] mb-1">
                    {result.indicators?.length || 0}
                  </div>
                  <div className="text-xs text-[#000e00]/50">Indicators</div>
                </div>
                <div className="bg-white rounded-2xl border border-[#000e00]/5 p-5 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-2xl font-bold text-[#000e00] mb-1">
                    {result.prediction}
                  </div>
                  <div className="text-xs text-[#000e00]/50">Verdict</div>
                </div>
              </div>

              {/* AI Mentor Button */}
              <button
                onClick={() => setShowAIMentor(true)}
                className="w-full py-4 bg-[#028355] text-white font-medium rounded-2xl hover:bg-[#028355]/90 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm"
              >
                <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                <span>Ask AI Mentor</span>
              </button>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#000e00]/5 p-12 sm:p-16 text-center shadow-sm h-full flex items-center justify-center">
              <div>
                <div className="w-20 h-20 bg-[#e9edf4] rounded-full flex items-center justify-center mx-auto mb-5">
                  <Shield className="w-10 h-10 text-[#000e00]/20" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold text-[#000e00] mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-sm text-[#000e00]/50 max-w-xs mx-auto">
                  Enter a URL and click Scan to begin security analysis
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* AI Mentor Modal */}
      {showAIMentor && result && (
        <AIMentorModal
          analysisType="cybersecurity"
          analysisResult={result}
          onClose={() => setShowAIMentor(false)}
        />
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e9edf4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #028355;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #026b44;
        }
      `}</style>
    </>
  );
};

export default CyberSecurityAgent;
