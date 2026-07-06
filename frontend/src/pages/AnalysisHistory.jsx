import { useState, useEffect } from 'react';
import { Clock, Filter, Download, Trash2, Eye, Search, TrendingUp, Shield, FileText, AlertTriangle, DollarSign, BarChart3, X, Calendar, Tag, ChevronRight, Activity } from 'lucide-react';
import axios from '../config/axios';
import toast from 'react-hot-toast';

const AnalysisHistory = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    loadHistory();
    loadStats();
  }, [filterType]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { analysisType: filterType } : {};
      
      const response = await axios.get('/api/history', { params });
      
      if (response.data.success) {
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error('Load history error:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/history/stats/summary');
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this analysis permanently?')) return;

    try {
      await axios.delete(`/api/history/${id}`);
      toast.success('Analysis deleted');
      loadHistory();
      loadStats();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete analysis');
    }
  };

  const getAnalysisConfig = (type) => {
    const configs = {
      'invoice-fraud': {
        icon: AlertTriangle,
        name: 'Invoice Fraud Detection',
        color: 'text-red-500',
        bgGradient: 'from-red-500/10 to-orange-500/10',
        borderColor: 'border-red-500/20',
        badge: 'bg-red-500/10 text-red-500 border-red-500/20'
      },
      'document-validator': {
        icon: FileText,
        name: 'Document Validator',
        color: 'text-blue-500',
        bgGradient: 'from-blue-500/10 to-indigo-500/10',
        borderColor: 'border-blue-500/20',
        badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      },
      'financial-risk': {
        icon: TrendingUp,
        name: 'Financial Risk Analysis',
        color: 'text-amber-500',
        bgGradient: 'from-amber-500/10 to-yellow-500/10',
        borderColor: 'border-amber-500/20',
        badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      },
      'cybersecurity': {
        icon: Shield,
        name: 'Cybersecurity Scan',
        color: 'text-purple-500',
        bgGradient: 'from-purple-500/10 to-pink-500/10',
        borderColor: 'border-purple-500/20',
        badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      },
      'compliance': {
        icon: Shield,
        name: 'Compliance Audit',
        color: 'text-[#028355]',
        bgGradient: 'from-[#028355]/10 to-emerald-500/10',
        borderColor: 'border-[#028355]/20',
        badge: 'bg-[#028355]/10 text-[#028355] border-[#028355]/20'
      },
      'graph-analysis': {
        icon: BarChart3,
        name: 'Risk Graph Analysis',
        color: 'text-cyan-500',
        bgGradient: 'from-cyan-500/10 to-teal-500/10',
        borderColor: 'border-cyan-500/20',
        badge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
      }
    };
    return configs[type] || configs['document-validator'];
  };

  const filteredHistory = history
    .filter(item =>
      searchTerm === '' ||
      getAnalysisConfig(item.analysisType).name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.metadata?.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const filterOptions = [
    { value: 'all', label: 'All Analyses', color: 'bg-[#028355]' },
    { value: 'invoice-fraud', label: 'Fraud', color: 'bg-red-500' },
    { value: 'document-validator', label: 'Documents', color: 'bg-blue-500' },
    { value: 'financial-risk', label: 'Risk', color: 'bg-amber-500' },
    { value: 'cybersecurity', label: 'Security', color: 'bg-purple-500' },
    { value: 'compliance', label: 'Compliance', color: 'bg-[#028355]' }
  ];

  return (
    <div className="min-h-screen bg-[#e9edf4] font-['Inter',_system-ui,_-apple-system,_sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-start gap-4 mb-3">
            <div className="p-3.5 bg-[#028355] rounded-2xl shadow-sm">
              <Activity className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-semibold text-[#000e00] tracking-tight mb-2">
                Analysis History
              </h1>
              <p className="text-[#000e00]/60 text-base sm:text-lg font-normal">
                Track, review, and manage all your security analyses
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
            <div className="bg-white rounded-2xl border border-[#000e00]/5 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-[#028355]/10 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-[#028355]" strokeWidth={2} />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#000e00] mb-1">{stats.total}</p>
              <p className="text-sm text-[#000e00]/60">Total Analyses</p>
            </div>
            {stats.byType.slice(0, 3).map(stat => {
              const config = getAnalysisConfig(stat._id);
              const IconComponent = config.icon;
              return (
                <div key={stat._id} className="bg-white rounded-2xl border border-[#000e00]/5 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 bg-gradient-to-br ${config.bgGradient} rounded-xl border ${config.borderColor}`}>
                      <IconComponent className={`w-5 h-5 ${config.color}`} strokeWidth={2} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[#000e00] mb-1">{stat.count}</p>
                  <p className="text-sm text-[#000e00]/60 truncate">{config.name}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#000e00]/5 p-5 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#000e00]/40" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search analyses by name or file..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 focus:ring-[#028355]/20 focus:border-[#028355]/30 transition-all duration-200"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilterType(option.value)}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    filterType === option.value
                      ? `${option.color} text-white shadow-sm`
                      : 'bg-[#e9edf4] text-[#000e00]/70 hover:bg-[#028355]/5 hover:text-[#028355]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-[#000e00]/5 p-16 text-center shadow-sm">
            <div className="w-16 h-16 border-4 border-[#028355]/20 border-t-[#028355] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#000e00]/60">Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#000e00]/5 p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-[#e9edf4] rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock className="w-10 h-10 text-[#000e00]/20" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-semibold text-[#000e00] mb-2">
              No Analyses Yet
            </h3>
            <p className="text-[#000e00]/50">
              Start analyzing to build your history
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map(item => {
              const config = getAnalysisConfig(item.analysisType);
              const IconComponent = config.icon;
              
              return (
                <div 
                  key={item._id} 
                  className="bg-white rounded-3xl border border-[#000e00]/5 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-[#028355]/20 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    
                    {/* Left Content */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`p-3.5 bg-gradient-to-br ${config.bgGradient} rounded-2xl border ${config.borderColor} flex-shrink-0`}>
                        <IconComponent className={`w-6 h-6 ${config.color}`} strokeWidth={2} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-[#000e00] truncate">
                            {config.name}
                          </h3>
                          <span className={`px-2.5 py-1 ${config.badge} text-xs font-medium rounded-full border flex-shrink-0`}>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs sm:text-sm text-[#000e00]/60">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" strokeWidth={2} />
                            <span>{new Date(item.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}</span>
                          </div>
                          
                          {item.metadata?.fileName && (
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4" strokeWidth={2} />
                              <span className="truncate max-w-xs">{item.metadata.fileName}</span>
                            </div>
                          )}
                        </div>
                        
                        {item.summary && (
                          <div className="flex flex-wrap gap-3 mt-3">
                            {Object.entries(item.summary).slice(0, 3).map(([key, value]) => (
                              <div key={key} className="px-3 py-1.5 bg-[#e9edf4] rounded-xl">
                                <span className="text-xs text-[#000e00]/60">{key}: </span>
                                <span className="text-xs font-semibold text-[#000e00]">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedAnalysis(item)}
                        className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-xl transition-all duration-200 group-hover:scale-105"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl transition-all duration-200 group-hover:scale-105"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedAnalysis && (
          <div className="fixed inset-0 bg-[#000e00]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-[#000e00]/10 max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#000e00]/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#028355]/10 rounded-xl">
                    <Eye className="w-5 h-5 text-[#028355]" strokeWidth={2} />
                  </div>
                  <h2 className="text-xl font-semibold text-[#000e00]">Analysis Details</h2>
                </div>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="p-2 hover:bg-[#e9edf4] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[#000e00]" strokeWidth={2} />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] custom-scrollbar">
                <pre className="bg-[#000e00] p-5 rounded-2xl text-[#028355] text-xs sm:text-sm overflow-x-auto font-mono leading-relaxed">
                  {JSON.stringify(selectedAnalysis, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Custom Scrollbar & Animations */}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AnalysisHistory;
