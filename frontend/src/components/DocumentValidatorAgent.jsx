import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Upload, Loader2, FileText, XCircle, Sparkles, Brain, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import AIMentorModal from '../components/AIMentorModal';
import { saveToHistory } from '../utils/saveToHistory';

const DocumentValidatorAgent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showAIMentor, setShowAIMentor] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Auto-validate
    await validateDocument(file);
  };

  const validateDocument = async (file) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Uploading document for validation...');

      const response = await fetch('http://localhost:8003/validate', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast.success('Document validated successfully!');

        saveToHistory('document-validator', data, {
          fileName: file.name,
          fileSize: file.size
        });
      } else {
        toast.error('Validation failed');
      }

    } catch (error) {
      console.error('❌ Validation error:', error);
      toast.error('Failed to validate document: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'AUTHENTIC':
        return 'bg-[#028355]/10 border-[#028355]/20 text-[#028355]';
      case 'SUSPICIOUS':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
      case 'FORGED':
        return 'bg-red-500/10 border-red-500/20 text-red-600';
      default:
        return 'bg-[#000e00]/5 border-[#000e00]/10 text-[#000e00]';
    }
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict) {
      case 'AUTHENTIC':
        return <CheckCircle className="w-8 h-8 text-[#028355]" strokeWidth={2.5} />;
      case 'SUSPICIOUS':
        return <AlertTriangle className="w-8 h-8 text-amber-600" strokeWidth={2.5} />;
      case 'FORGED':
        return <XCircle className="w-8 h-8 text-red-600" strokeWidth={2.5} />;
      default:
        return <Shield className="w-8 h-8 text-[#000e00]/40" strokeWidth={2.5} />;
    }
  };

  const getRiskLevelBadge = (riskLevel) => {
    const colors = {
      'HIGH': 'bg-red-500/10 text-red-600 border-red-500/20',
      'MEDIUM': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'LOW': 'bg-[#028355]/10 text-[#028355] border-[#028355]/20'
    };
    return colors[riskLevel] || colors.MEDIUM;
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl shadow-sm">
            <Shield size={28} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#000e00]">Document Validator</h1>
            <p className="text-[#000e00]/60">AI-powered forgery detection for business documents</p>
          </div>
        </div>
      </div>

      {/* Supported Documents */}
      <div className="mb-6 p-5 bg-gradient-to-r from-[#028355]/5 to-emerald-50 rounded-2xl border border-[#028355]/10">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-[#028355] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
          <div>
            <h3 className="text-sm font-semibold text-[#000e00] mb-2">📄 Supported Business Documents:</h3>
            <div className="flex flex-wrap gap-2">
              {['Invoice', 'Receipt', 'Contract', 'Statement', 'Certificate', 'License'].map(doc => (
                <span key={doc} className="px-3 py-1.5 bg-white rounded-full text-xs font-semibold text-[#028355] border border-[#028355]/10">
                  {doc}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-[#028355]/10 rounded-xl">
              <Upload className="w-5 h-5 text-[#028355]" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-[#000e00]">Upload Document</h2>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="document-upload"
              disabled={loading}
            />
            <label
              htmlFor="document-upload"
              className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#028355]/50 hover:bg-[#028355]/5'
              } ${uploadedFile ? 'border-[#028355] bg-[#028355]/5' : 'border-[#000e00]/10 bg-[#e9edf4]/30'}`}
            >
              {uploadedFile ? (
                <>
                  <CheckCircle className="w-12 h-12 text-[#028355] mb-3" strokeWidth={2} />
                  <p className="text-base font-semibold text-[#028355] mb-1">
                    Document Selected
                  </p>
                  <div className="mt-3 px-4 py-2 bg-white rounded-xl border border-[#028355]/20">
                    <p className="text-sm text-[#000e00] font-medium">📎 {uploadedFile.name}</p>
                    <p className="text-xs text-[#000e00]/50 mt-1">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Upload className="w-12 h-12 text-[#028355] mb-3" strokeWidth={2} />
                    <Sparkles size={20} className="absolute -top-1 -right-1 text-[#028355] animate-pulse" strokeWidth={2.5} />
                  </div>
                  <p className="text-base font-semibold text-[#000e00] mb-1">
                    Click to upload document image
                  </p>
                  <p className="text-sm text-[#000e00]/60">
                    PNG, JPG, JPEG (Max 10MB)
                  </p>
                </>
              )}
            </label>

            {loading && (
              <div className="mt-6 flex flex-col items-center p-6 bg-[#028355]/5 rounded-2xl border border-[#028355]/20">
                <Loader2 className="w-10 h-10 animate-spin text-[#028355] mb-3" strokeWidth={2.5} />
                <p className="text-sm font-semibold text-[#000e00]">Validating document...</p>
                <p className="text-xs text-[#000e00]/60 mt-1">AI is analyzing authenticity</p>
                <div className="flex gap-2 mt-3">
                  <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[#000e00] mb-3">Document Preview:</h3>
              <div className="border-2 border-[#000e00]/10 rounded-2xl overflow-hidden bg-[#e9edf4]">
                <img 
                  src={previewUrl} 
                  alt="Document preview" 
                  className="w-full h-72 object-contain"
                />
              </div>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-gradient-to-r from-[#028355]/5 to-emerald-50 rounded-2xl border border-[#028355]/10">
            <p className="text-xs text-[#000e00]/70 leading-relaxed">
              <strong className="text-[#028355]">🔒 Privacy First:</strong> All analysis happens locally. Our AI uses OCR, tampering detection, and format validation to verify authenticity without sending data externally.
            </p>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
          {result ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Verdict Card */}
              <div className={`p-6 rounded-2xl border-2 ${getVerdictColor(result.verdict)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getVerdictIcon(result.verdict)}
                    <div>
                      <h3 className="text-2xl font-bold">{result.verdict}</h3>
                      <p className="text-sm opacity-75">Authenticity Assessment</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{result.authenticity_score}%</div>
                    <div className="text-xs opacity-75">Confidence</div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-white/50 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-1000"
                    style={{
                      width: `${result.authenticity_score}%`,
                      backgroundColor: result.verdict === 'AUTHENTIC' ? '#028355' : 
                                     result.verdict === 'SUSPICIOUS' ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              </div>

              {/* Document Type */}
              <div className="p-5 bg-[#e9edf4] rounded-2xl border border-[#000e00]/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#000e00]/60" strokeWidth={2} />
                    <span className="text-sm font-semibold text-[#000e00]">Document Type</span>
                  </div>
                  <span className="text-lg font-bold text-[#028355]">{result.document_type}</span>
                </div>
                <div className="flex justify-between text-xs text-[#000e00]/50 mt-2">
                  <span>Detection Confidence:</span>
                  <span className="font-semibold">{result.document_confidence}%</span>
                </div>
              </div>

              {/* Risk Level */}
              <div className={`p-5 rounded-2xl border-2 ${
                result.risk_level === 'HIGH' ? 'bg-red-50 border-red-200' :
                result.risk_level === 'MEDIUM' ? 'bg-amber-50 border-amber-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#000e00]">Risk Assessment</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskLevelBadge(result.risk_level)}`}>
                    {result.risk_level} RISK
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#000e00]/60 mt-2">
                  <span>Forgery Detection:</span>
                  <span className="font-semibold">{result.forgery_confidence}%</span>
                </div>
              </div>

              {/* Tampering Analysis */}
              {result.tampering_analysis && result.tampering_analysis.tampering_detected && (
                <div>
                  <h4 className="text-lg font-bold text-[#000e00] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" strokeWidth={2.5} />
                    Tampering Indicators
                  </h4>
                  <div className="space-y-2">
                    {result.tampering_analysis.indicators.map((indicator, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-2xl border ${
                          indicator.severity === 'high' ? 'bg-red-50 border-red-200' :
                          indicator.severity === 'medium' ? 'bg-amber-50 border-amber-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#000e00]">
                            {indicator.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                            indicator.severity === 'high' ? 'bg-red-500/10 text-red-700 border-red-500/20' :
                            indicator.severity === 'medium' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' :
                            'bg-blue-500/10 text-blue-700 border-blue-500/20'
                          }`}>
                            {indicator.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[#000e00]/70 leading-relaxed">{indicator.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-[#000e00] mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 bg-[#028355]/5 rounded-2xl border border-[#028355]/10">
                        <p className="text-sm text-[#000e00]/80 leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Text Preview */}
              {result.extracted_text && (
                <details className="p-4 bg-[#e9edf4] rounded-2xl border border-[#000e00]/5">
                  <summary className="cursor-pointer text-sm font-semibold text-[#000e00] flex items-center gap-2">
                    <FileText size={16} strokeWidth={2} />
                    📝 Extracted Text (OCR)
                  </summary>
                  <div className="mt-3 p-4 bg-white rounded-xl border border-[#000e00]/5 text-xs font-mono text-[#000e00]/70 max-h-40 overflow-y-auto custom-scrollbar">
                    {result.extracted_text}
                  </div>
                </details>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-16">
              <div>
                <Shield className="w-20 h-20 text-[#000e00]/10 mx-auto mb-4" strokeWidth={2} />
                <h3 className="text-lg font-semibold text-[#000e00]/40 mb-2">No Document Uploaded</h3>
                <p className="text-sm text-[#000e00]/30">Upload a business document to begin validation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Mentor Button - ONLY SHOWS WHEN RESULTS EXIST, PLACED BELOW GRID */}
      {result && (
        <div className="mt-6">
          <button
            onClick={() => setShowAIMentor(true)}
            className="w-full py-4 bg-gradient-to-r from-[#028355] to-emerald-600 text-white font-semibold rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Brain className="w-5 h-5" strokeWidth={2.5} />
            <span>Ask AI Mentor About This Analysis</span>
            <Sparkles className="w-5 h-5 animate-pulse" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {result && (
        <div className="mt-6 bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8 animate-fadeIn">
          <h3 className="text-lg font-bold text-[#000e00] mb-6">Validation Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-gradient-to-br from-[#028355]/10 to-emerald-50 rounded-2xl border border-[#028355]/10">
              <div className="text-2xl font-bold text-[#028355]">{result.verdict}</div>
              <div className="text-xs text-[#000e00]/60 mt-1">Final Verdict</div>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{result.authenticity_score}%</div>
              <div className="text-xs text-[#000e00]/60 mt-1">Authenticity</div>
            </div>
            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{result.document_type}</div>
              <div className="text-xs text-[#000e00]/60 mt-1">Document Type</div>
            </div>
            <div className="p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{result.risk_level}</div>
              <div className="text-xs text-[#000e00]/60 mt-1">Risk Level</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Mentor Modal */}
      {showAIMentor && result && (
        <AIMentorModal
          analysisType="document-validator"
          analysisResult={result}
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e9edf4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #028355;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default DocumentValidatorAgent;
