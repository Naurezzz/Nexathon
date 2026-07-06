import { useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Upload, Loader2, Sparkles, ArrowRight, FileText, BarChart3, Target } from 'lucide-react';
import { analyzeFinancialRisk } from '../services/financialRiskApi';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';
import AIMentorModal from '../components/AIMentorModal';
import { saveToHistory } from '../utils/saveToHistory';

const FinancialRiskAgent = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showAIMentor, setShowAIMentor] = useState(false);

  const [formData, setFormData] = useState({
    current_assets: '',
    current_liabilities: '',
    total_assets: '',
    total_liabilities: '',
    equity: '',
    revenue: '',
    net_income: '',
    operating_income: '',
    cash: '',
    inventory: '',
    interest_expense: ''
  });

  const [uploadMode, setUploadMode] = useState('manual');
  const [uploadedFile, setUploadedFile] = useState(null);

  // 🔗 BLOCKCHAIN INTEGRATION
  const recordOnBlockchain = async (riskResult) => {
    try {
      const hashResult = (data) => {
        return btoa(JSON.stringify(data)).substring(0, 64);
      };

      const response = await fetch('http://localhost:8007/add_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: `FINANCIAL_RISK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          document_hash: hashResult(riskResult),
          validation_result: riskResult.risk_category || 'ANALYZED',
          authenticity_score: (1 - riskResult.risk_score) * 100, // Convert risk to safety score
          document_type: 'FINANCIAL_RISK_ASSESSMENT',
          verified_by: 'AEGIS_AI_FINANCIAL_RISK_AGENT',
          metadata: {
            riskCategory: riskResult.risk_category,
            riskScore: riskResult.risk_score,
            confidence: riskResult.confidence,
            topFactors: riskResult.top_factors?.slice(0, 3).map(f => f.feature) || [],
            recommendationsCount: riskResult.recommendations?.length || 0
          }
        })
      });

      if (response.ok) {
        console.log('✅ Financial risk assessment recorded on blockchain');
        toast.success('Recorded on blockchain!', { duration: 2000 });
      }
    } catch (error) {
      console.error('⚠️ Blockchain recording failed:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAnalyze = async () => {
    try {
      const requiredFields = ['current_assets', 'current_liabilities', 'total_assets', 'total_liabilities', 'equity', 'revenue', 'net_income'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      setLoading(true);
      
      const numericData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          numericData[key] = parseFloat(formData[key]);
        }
      });

      const response = await analyzeFinancialRisk(numericData);
      
      if (response.success) {
        setResult(response.analysis);
        toast.success('Analysis complete');

        saveToHistory('financial-risk', response.analysis, {
          inputMethod: 'manual',
          analysisDate: new Date().toISOString()
        });

        // 🔗 Record on blockchain
        await recordOnBlockchain(response.analysis);
      } else {
        toast.error('Analysis failed');
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze financial risk');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please login first');
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append('file', file);
      
      const response = await fetch('http://localhost:4000/api/financial-risk/analyze-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formDataObj
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.analysis);
        toast.success('File analyzed successfully');

        saveToHistory('financial-risk', data.analysis, {
          fileName: file.name,
          fileSize: file.size,
          inputMethod: 'file-upload'
        });

        // 🔗 Record on blockchain
        await recordOnBlockchain(data.analysis);
      } else {
        toast.error('Analysis failed: ' + (data.error || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to analyze file: ' + error.message);
    } finally {
      setLoading(false);
      setUploadedFile(null);
    }
  };

  const getRiskColor = (category) => {
    switch (category) {
      case 'Low':
        return {
          bg: 'bg-[#028355]/5',
          border: 'border-[#028355]/20',
          text: 'text-[#028355]',
          barColor: '#028355'
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          barColor: '#f59e0b'
        };
      case 'High':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          barColor: '#fb923c'
        };
      case 'Critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          barColor: '#ef4444'
        };
      default:
        return {
          bg: 'bg-[#e9edf4]',
          border: 'border-[#000e00]/10',
          text: 'text-[#000e00]',
          barColor: '#000e00'
        };
    }
  };

  const getRiskIcon = (category) => {
    switch (category) {
      case 'Low':
        return <CheckCircle2 className="w-7 h-7" />;
      case 'Medium':
      case 'High':
      case 'Critical':
        return <AlertTriangle className="w-7 h-7" />;
      default:
        return <TrendingUp className="w-7 h-7" />;
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#000e00] mb-2">Financial Risk Analyzer</h2>
        <p className="text-[#000e00]/60">AI-powered bankruptcy prediction with explainable insights</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setUploadMode('manual')}
          className={`flex-1 px-6 py-3.5 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2.5 ${
            uploadMode === 'manual'
              ? 'bg-[#028355] text-white shadow-sm'
              : 'bg-white text-[#000e00]/70 border border-[#000e00]/10 hover:border-[#028355]/30 hover:bg-[#028355]/5'
          }`}
        >
          <FileText className="w-5 h-5" strokeWidth={2} />
          <span>Manual Entry</span>
        </button>
        <button
          onClick={() => setUploadMode('file')}
          className={`flex-1 px-6 py-3.5 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2.5 ${
            uploadMode === 'file'
              ? 'bg-[#028355] text-white shadow-sm'
              : 'bg-white text-[#000e00]/70 border border-[#000e00]/10 hover:border-[#028355]/30 hover:bg-[#028355]/5'
          }`}
        >
          <Upload className="w-5 h-5" strokeWidth={2} />
          <span>Upload File</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Panel - Input */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-[#000e00]/5 p-6 sticky top-24">
            
            <div className="flex items-center gap-2.5 mb-6">
              <BarChart3 className="w-5 h-5 text-[#028355]" strokeWidth={2} />
              <h3 className="text-lg font-semibold text-[#000e00]">Company Financials</h3>
            </div>

            {uploadMode === 'file' ? (
              <div className="space-y-5">
                <div className="p-8 bg-[#e9edf4] rounded-2xl border-2 border-dashed border-[#000e00]/10 hover:border-[#028355]/30 transition-all duration-200">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="financial-file-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="financial-file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-[#028355]/10 rounded-2xl flex items-center justify-center mb-4">
                      <Upload className="w-7 h-7 text-[#028355]" strokeWidth={2} />
                    </div>
                    <p className="text-base font-medium text-[#000e00] mb-2">
                      Upload Financial Data
                    </p>
                    <p className="text-sm text-[#000e00]/60 mb-1">
                      CSV or Excel (.csv, .xlsx, .xls)
                    </p>
                    <p className="text-xs text-[#000e00]/40 text-center mt-3">
                      Required: current_assets, current_liabilities,<br/>
                      total_assets, total_liabilities, equity, revenue, net_income
                    </p>
                    {uploadedFile && (
                      <div className="mt-5 px-4 py-2.5 bg-[#028355]/10 rounded-xl border border-[#028355]/20">
                        <p className="text-sm text-[#028355] font-medium">📎 {uploadedFile.name}</p>
                      </div>
                    )}
                  </label>
                  {loading && (
                    <div className="mt-6 flex flex-col items-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#028355] mb-2" strokeWidth={2.5} />
                      <p className="text-sm text-[#000e00]/60">Analyzing file...</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#028355]/5 rounded-2xl border border-[#028355]/10">
                  <p className="text-xs text-[#000e00]/70 leading-relaxed">
                    <strong className="text-[#028355]">Tip:</strong> Ensure your file includes all required financial metrics for accurate risk assessment.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Required Fields */}
                <div className="space-y-3.5">
                  {[
                    { name: 'current_assets', label: 'Current Assets', placeholder: '500000' },
                    { name: 'current_liabilities', label: 'Current Liabilities', placeholder: '300000' },
                    { name: 'total_assets', label: 'Total Assets', placeholder: '2000000' },
                    { name: 'total_liabilities', label: 'Total Liabilities', placeholder: '1500000' },
                    { name: 'equity', label: 'Equity', placeholder: '500000' },
                    { name: 'revenue', label: 'Revenue', placeholder: '1000000' },
                    { name: 'net_income', label: 'Net Income', placeholder: '50000' }
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-[#000e00]/70 mb-2">
                        {field.label} <span className="text-[#028355]">*</span>
                      </label>
                      <input
                        type="number"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 border border-[#000e00]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#028355]/20 focus:border-[#028355]/30 text-[#000e00] placeholder:text-[#000e00]/30 transition-all duration-200"
                      />
                    </div>
                  ))}
                </div>

                {/* Optional Fields */}
                <details className="mt-5 group">
                  <summary className="cursor-pointer text-sm font-medium text-[#028355] hover:text-[#028355]/80 flex items-center gap-2 py-2">
                    <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90" strokeWidth={2} />
                    Optional Fields
                  </summary>
                  <div className="mt-4 space-y-3.5 pl-1">
                    {[
                      { name: 'operating_income', placeholder: 'Operating Income' },
                      { name: 'cash', placeholder: 'Cash' },
                      { name: 'inventory', placeholder: 'Inventory' },
                      { name: 'interest_expense', placeholder: 'Interest Expense' }
                    ].map(field => (
                      <input
                        key={field.name}
                        type="number"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 border border-[#000e00]/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#028355]/20 focus:border-[#028355]/30 text-[#000e00] placeholder:text-[#000e00]/30 transition-all duration-200"
                      />
                    ))}
                  </div>
                </details>

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full mt-6 px-6 py-4 bg-[#028355] text-white font-medium rounded-2xl hover:bg-[#028355]/90 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2.5 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5" strokeWidth={2.5} />
                      <span>Analyze Risk</span>
                      <ArrowRight className="w-4 h-4 ml-auto" strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="lg:col-span-3">
          {result ? (
            <div className="space-y-6">
              
              {/* Main Result Card */}
              <div className={`${getRiskColor(result.risk_category).bg} rounded-3xl border ${getRiskColor(result.risk_category).border} p-6 sm:p-8 shadow-sm`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={getRiskColor(result.risk_category).text}>
                      {getRiskIcon(result.risk_category)}
                    </div>
                    <div>
                      <h3 className={`text-2xl sm:text-3xl font-semibold ${getRiskColor(result.risk_category).text} mb-1`}>
                        {result.risk_category} Risk
                      </h3>
                      <p className={`text-sm ${getRiskColor(result.risk_category).text} opacity-70`}>
                        Bankruptcy Assessment
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getRiskColor(result.risk_category).text}`}>
                      {(result.risk_score * 100).toFixed(1)}%
                    </div>
                    <div className={`text-xs ${getRiskColor(result.risk_category).text} opacity-70 mt-1`}>
                      Risk Score
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-white/80 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${result.risk_score * 100}%`,
                      backgroundColor: getRiskColor(result.risk_category).barColor
                    }}
                  />
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-white rounded-3xl border border-[#000e00]/5 p-6 sm:p-8 shadow-sm">
                <h4 className="text-lg font-semibold text-[#000e00] mb-5">
                  Top Risk Factors
                </h4>
                <div className="space-y-3">
                  {result.top_factors?.slice(0, 5).map((factor, idx) => (
                    <div key={idx} className="p-4 bg-[#e9edf4] rounded-2xl border border-[#000e00]/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#000e00]">
                          {factor.feature}
                        </span>
                        <span className="text-sm font-bold text-[#028355]">
                          {factor.impact.toFixed(3)}
                        </span>
                      </div>
                      <p className="text-xs text-[#000e00]/60 leading-relaxed">
                        {factor.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-white rounded-3xl border border-[#000e00]/5 p-6 sm:p-8 shadow-sm">
                  <h4 className="text-lg font-semibold text-[#000e00] mb-5">
                    Recommendations
                  </h4>
                  <div className="space-y-3">
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 bg-[#028355]/5 rounded-2xl border border-[#028355]/10">
                        <p className="text-sm text-[#000e00]/70 leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Confidence */}
              <div className="bg-white rounded-2xl border border-[#000e00]/5 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#000e00]/70">Model Confidence</span>
                  <span className="text-2xl font-bold text-[#028355]">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
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
                  <TrendingUp className="w-10 h-10 text-[#000e00]/20" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold text-[#000e00] mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-sm text-[#000e00]/50 max-w-xs mx-auto">
                  Enter financial data and click Analyze to begin risk assessment
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* AI Mentor Modal */}
      {showAIMentor && result && (
        <AIMentorModal
          analysisType="financial-risk"
          analysisResult={result}
          onClose={() => setShowAIMentor(false)}
        />
      )}

      {/* Custom Scrollbar */}
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

export default FinancialRiskAgent;
