import { useState, useEffect } from 'react';
import { MapPin, TrendingUp, AlertTriangle, Shield, Building, DollarSign, RefreshCw, Download, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from '../config/axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const INDIA_STATES = [
  { name: 'Maharashtra', lat: 19.7515, lng: 75.7139, population: 112372972 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025, population: 16787941 },
  { name: 'Karnataka', lat: 15.3173, lng: 75.7139, population: 61095297 },
  { name: 'Tamil Nadu', lat: 11.1271, lng: 78.6569, population: 72147030 },
  { name: 'Gujarat', lat: 22.2587, lng: 71.1924, population: 60439692 },
  { name: 'West Bengal', lat: 22.9868, lng: 87.8550, population: 91276115 },
  { name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, population: 199812341 },
  { name: 'Rajasthan', lat: 27.0238, lng: 74.2179, population: 68548437 },
];

function NationalDashboard() {
  const [loading, setLoading] = useState(true);
  const [nationalData, setNationalData] = useState(null);
  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    loadNationalData();
  }, []);

  const loadNationalData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/national/statistics`);
      setNationalData(response.data);
      
      // Show different toast based on data source
      if (response.data.dataSource === 'real') {
        toast.success('🎯 Loaded real-time national data');
      } else if (response.data.dataSource === 'demo') {
        toast.info('📝 Showing demo data - Upload invoices to see real statistics');
      } else {
        toast.success('✅ Data loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load national data:', error);
      setNationalData(generateMockData());
      toast.error('⚠️ Failed to load data, showing fallback');
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    return {
      overview: {
        totalCompanies: 15420,
        totalTransactions: 8945623,
        totalFraudDetected: 12847,
        totalAmountFlagged: 2847650000,
        fraudRate: 0.144
      },
      stateData: INDIA_STATES.map(state => ({
        state: state.name,
        companies: Math.floor(Math.random() * 2000) + 500,
        fraudCases: Math.floor(Math.random() * 500) + 50,
        amount: Math.floor(Math.random() * 500000000) + 50000000,
        fraudRate: (Math.random() * 0.3).toFixed(3)
      })),
      sectorData: [
        { sector: 'Banking', fraudCases: 3245, amount: 892450000 },
        { sector: 'Insurance', fraudCases: 2156, amount: 567230000 },
        { sector: 'Manufacturing', fraudCases: 1897, amount: 445670000 },
        { sector: 'Retail', fraudCases: 1654, amount: 334560000 },
        { sector: 'Technology', fraudCases: 1432, amount: 289340000 },
        { sector: 'Healthcare', fraudCases: 1243, amount: 234890000 },
      ],
      trendData: [
        { month: 'Jan', fraudCases: 1045, prevented: 892 },
        { month: 'Feb', fraudCases: 1156, prevented: 987 },
        { month: 'Mar', fraudCases: 1287, prevented: 1098 },
        { month: 'Apr', fraudCases: 1198, prevented: 1034 },
        { month: 'May', fraudCases: 1345, prevented: 1156 },
        { month: 'Jun', fraudCases: 1423, prevented: 1234 },
      ],
      dataSource: 'fallback',
      lastUpdated: new Date().toISOString()
    };
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '₹0';
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 size={64} className="text-[#028355] animate-spin mx-auto mb-4" strokeWidth={2.5} />
            <p className="text-[#000e00]/60 font-medium">Loading national statistics...</p>
            <p className="text-[#000e00]/40 text-sm mt-2">Aggregating fraud detection data</p>
          </div>
        </div>
      </div>
    );
  }

  if (!nationalData) {
    return (
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle size={64} className="text-red-600 mx-auto mb-4" strokeWidth={2} />
            <p className="text-[#000e00]/60 mb-4">Failed to load data</p>
            <button onClick={loadNationalData} className="px-6 py-3 bg-[#028355] hover:bg-[#028355]/90 text-white rounded-2xl font-semibold transition-all">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8 mb-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl shadow-sm">
              <MapPin size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#000e00]">National Financial Safety Dashboard</h2>
              <p className="text-[#000e00]/60 text-sm">Real-time fraud monitoring across India</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadNationalData}
              disabled={loading}
              className="px-4 py-2.5 bg-[#028355]/10 hover:bg-[#028355]/20 border border-[#028355]/20 
                       text-[#028355] rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} strokeWidth={2} />
              Refresh
            </button>
            <button
              className="px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 
                       text-blue-700 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm"
            >
              <Download size={18} strokeWidth={2} />
              Export
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Government Access Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <Shield size={16} className="text-purple-600" strokeWidth={2.5} />
            <span className="text-sm font-semibold text-purple-700">Government Access Only</span>
          </div>

          {/* Live Data Indicator */}
          {nationalData?.lastUpdated && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs ${
              nationalData.dataSource === 'real'
                ? 'bg-[#028355]/10 border-[#028355]/20'
                : nationalData.dataSource === 'demo'
                ? 'bg-blue-500/10 border-blue-500/20'
                : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                nationalData.dataSource === 'real' ? 'bg-[#028355]' : 
                nationalData.dataSource === 'demo' ? 'bg-blue-600' : 'bg-amber-600'
              }`}></div>
              <span className={`font-semibold ${
                nationalData.dataSource === 'real' ? 'text-[#028355]' : 
                nationalData.dataSource === 'demo' ? 'text-blue-700' : 'text-amber-700'
              }`}>
                {nationalData.dataSource === 'real' ? '🎯 Live Data' : 
                 nationalData.dataSource === 'demo' ? '📝 Demo Data' : '⚠️ Fallback Data'} • Updated: {new Date(nationalData.lastUpdated).toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={<Building size={24} strokeWidth={2.5} />}
          title="Total Companies"
          value={(nationalData?.overview?.totalCompanies || 0).toLocaleString()}
          trend="+12%"
          color="blue"
        />
        <StatCard
          icon={<DollarSign size={24} strokeWidth={2.5} />}
          title="Transactions"
          value={`${((nationalData?.overview?.totalTransactions || 0) / 1000000).toFixed(2)}M`}
          trend="+8%"
          color="green"
        />
        <StatCard
          icon={<AlertTriangle size={24} strokeWidth={2.5} />}
          title="Fraud Detected"
          value={(nationalData?.overview?.totalFraudDetected || 0).toLocaleString()}
          trend="+5%"
          color="red"
        />
        <StatCard
          icon={<Shield size={24} strokeWidth={2.5} />}
          title="Amount Flagged"
          value={formatCurrency(nationalData?.overview?.totalAmountFlagged)}
          trend="-3%"
          color="purple"
        />
        <StatCard
          icon={<TrendingUp size={24} strokeWidth={2.5} />}
          title="Fraud Rate"
          value={`${((nationalData?.overview?.fraudRate || 0) * 100).toFixed(2)}%`}
          trend="-2%"
          color="amber"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* India Map Visualization */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
          <h3 className="text-xl font-bold text-[#000e00] mb-6 flex items-center gap-2">
            <MapPin size={24} className="text-[#028355]" strokeWidth={2.5} />
            State-wise Fraud Distribution
          </h3>
          <div className="relative bg-gradient-to-br from-[#e9edf4] to-white rounded-2xl p-8 border border-[#000e00]/5" style={{ height: '500px' }}>
            <div className="relative w-full h-full">
              {nationalData?.stateData?.map((state, idx) => (
                <div
                  key={idx}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${Math.min(95, Math.max(5, ((parseFloat(state.fraudRate) * 100) / 30) * 100))}%`,
                    top: `${Math.min(90, Math.max(10, (idx / nationalData.stateData.length) * 100))}%`
                  }}
                  onClick={() => setSelectedState(state)}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-125 shadow-lg ${
                    state.fraudRate > 0.2 ? 'bg-red-500' :
                    state.fraudRate > 0.1 ? 'bg-amber-500' : 'bg-[#028355]'
                  }`}>
                    <MapPin size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white border-2 border-[#000e00]/10 rounded-2xl p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none min-w-[220px] z-10 shadow-xl">
                    <p className="font-bold mb-2 text-[#000e00]">{state.state}</p>
                    <div className="text-xs space-y-1.5 text-[#000e00]/70">
                      <p><strong>Companies:</strong> {state.companies.toLocaleString()}</p>
                      <p><strong>Fraud Cases:</strong> {state.fraudCases.toLocaleString()}</p>
                      <p><strong>Amount:</strong> {formatCurrency(state.amount)}</p>
                      <p className="text-red-600 font-semibold">Fraud Rate: {(parseFloat(state.fraudRate) * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top States */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
          <h3 className="text-xl font-bold text-[#000e00] mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-red-600" strokeWidth={2.5} />
            High-Risk States
          </h3>
          <div className="space-y-3">
            {nationalData?.stateData
              ?.sort((a, b) => parseFloat(b.fraudRate) - parseFloat(a.fraudRate))
              .slice(0, 5)
              .map((state, idx) => (
                <div key={idx} className="p-4 bg-[#e9edf4] rounded-2xl border border-[#000e00]/5 hover:border-red-500/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#000e00]">{state.state}</span>
                    <span className="text-red-600 font-bold">{(parseFloat(state.fraudRate) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#000e00]/60">
                    <span>{state.fraudCases} cases</span>
                    <span>{formatCurrency(state.amount)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sector Analysis */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
          <h3 className="text-xl font-bold text-[#000e00] mb-6">Fraud by Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nationalData?.sectorData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="sector" stroke="#000e00" angle={-45} textAnchor="end" height={100} style={{ fontSize: '12px' }} />
              <YAxis stroke="#000e00" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #00000010', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ color: '#000e00', fontWeight: 'bold' }}
              />
              <Bar dataKey="fraudCases" fill="#028355" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Analysis */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
          <h3 className="text-xl font-bold text-[#000e00] mb-6">Monthly Fraud Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={nationalData?.trendData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="month" stroke="#000e00" style={{ fontSize: '12px' }} />
              <YAxis stroke="#000e00" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #00000010', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ color: '#000e00', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="fraudCases" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 5 }} name="Fraud Cases" />
              <Line type="monotone" dataKey="prevented" stroke="#028355" strokeWidth={3} dot={{ fill: '#028355', r: 5 }} name="Prevented" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, trend, color }) {
  const colorClasses = {
    blue: { bg: 'from-blue-500 to-cyan-600', text: 'text-blue-600', icon: 'text-blue-500' },
    green: { bg: 'from-[#028355] to-emerald-600', text: 'text-[#028355]', icon: 'text-[#028355]' },
    red: { bg: 'from-red-500 to-rose-600', text: 'text-red-600', icon: 'text-red-500' },
    purple: { bg: 'from-purple-500 to-pink-600', text: 'text-purple-600', icon: 'text-purple-500' },
    amber: { bg: 'from-amber-500 to-orange-600', text: 'text-amber-600', icon: 'text-amber-500' }
  };

  const colors = colorClasses[color];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-[#000e00]/5 p-6 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 bg-gradient-to-br ${colors.bg} rounded-xl`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-[#028355]/10 text-[#028355]' : 'bg-red-500/10 text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[#000e00]/60 text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
    </div>
  );
}

export default NationalDashboard;
