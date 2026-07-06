import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import UploadSection from '../components/UploadSection';
import FileUploadSection from '../components/FileUploadSection';
import BatchUploadSection from '../components/BatchUploadSection';
import ResultsSection from '../components/ResultsSection';
import FraudBatchResults from '../components/FraudBatchResults';
import ComplianceChecker from '../components/ComplianceChecker';
import RiskGraphEngine from '../components/RiskGraphEngine';
import NationalDashboard from '../components/NationalDashboard';
import DocumentValidator from '../components/DocumentValidatorAgent';
import FinancialRiskAgent from './FinancialRiskAgent';
import CyberSecurityAgent from './CyberSecurityAgent';
import AIMentorChat from '../components/AIMentorChat';
import AIMentorHub from './AIMentorHub';
import AnalysisHistory from './AnalysisHistory';
import BlockchainExplorer from './BlockchainExplorer';

import { 
  Shield, AlertTriangle, CheckCircle, TrendingUp, FileText, 
  Upload, Files, BarChart3, Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const auth = useAuth();
  const { user, signOut } = auth;
  const navigate = useNavigate();
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [activeModule, setActiveModule] = useState('fraud');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAIMentor, setShowAIMentor] = useState(false);

  const getUserRole = () => {
    if (typeof auth.getUserRole === 'function') {
      return auth.getUserRole();
    }
    return user?.user_metadata?.role || 'company_user';
  };
  
  const isGovernment = () => {
    if (typeof auth.isGovernment === 'function') {
      return auth.isGovernment();
    }
    return getUserRole() === 'government_official';
  };

  const handleAnalysisComplete = (data) => {
    setResults(data);
    setLoading(false);
  };

  const handleAnalysisStart = () => {
    setLoading(true);
    setResults(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResults(null);
    setLoading(false);
  };

  const handleModuleChange = (module) => {
    setActiveModule(module);
    setResults(null);
    setLoading(false);
    setActiveTab('manual');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getAnalysisType = () => {
    switch(activeModule) {
      case 'fraud': return 'invoice-fraud';
      case 'document': return 'document-validator';
      case 'financial-risk': return 'financial-risk';
      case 'cybersecurity': return 'cybersecurity';
      default: return 'general';
    }
  };

  const isBatchResult = results?.filesProcessed && results?.results && Array.isArray(results.results);

  return (
    <div className="min-h-screen bg-[#e9edf4] font-['SF_Pro_Display',_'Inter',_system-ui,_sans-serif]">
      
      {/* Top Navbar */}
      <Navbar 
        user={user}
        onSignOut={handleSignOut}
        getUserRole={getUserRole}
        results={results}
        onShowMentor={() => setShowAIMentor(true)}
        activeModule={activeModule}
      />

      <div className="flex">
        
        {/* Sidebar */}
        <Sidebar 
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isGovernment={isGovernment()}
        />

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
            
            {/* Module Content */}
            {activeModule === 'fraud' && (
              <FraudModule
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onAnalysisComplete={handleAnalysisComplete}
                onAnalysisStart={handleAnalysisStart}
                loading={loading}
                results={results}
                isBatchResult={isBatchResult}
              />
            )}

            {activeModule === 'compliance' && <ComplianceChecker />}
            {activeModule === 'graph' && <RiskGraphEngine />}
            {activeModule === 'national' && isGovernment() && <NationalDashboard />}
            {activeModule === 'document' && <DocumentValidator />}
            {activeModule === 'financial-risk' && <FinancialRiskAgent />}
            {activeModule === 'cybersecurity' && <CyberSecurityAgent />}
            {activeModule === 'ai-mentor' && <AIMentorHub />}
            {activeModule === 'history' && <AnalysisHistory />}
            {activeModule === 'blockchain' && <BlockchainExplorer />}

          </div>
        </main>

      </div>

      {/* AI Mentor Modal */}
      {showAIMentor && results && (
        <AIMentorChat
          analysisType={getAnalysisType()}
          analysisResult={results}
          onClose={() => setShowAIMentor(false)}
        />
      )}

    </div>
  );
}

// Fraud Module Component
function FraudModule({ activeTab, onTabChange, onAnalysisComplete, onAnalysisStart, loading, results, isBatchResult }) {
  return (
    <>
      {/* Stats Cards */}
      {results && results.summary && !isBatchResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard
            icon={<CheckCircle className="w-6 h-6" strokeWidth={2} />}
            title="Total Invoices"
            value={results.summary.total_invoices}
            subtitle="Analyzed"
            color="text-[#028355]"
            bgColor="bg-[#028355]/5"
            borderColor="border-[#028355]/20"
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" strokeWidth={2} />}
            title="Suspicious"
            value={results.summary.suspicious_count}
            subtitle="Flagged"
            color="text-red-500"
            bgColor="bg-red-500/5"
            borderColor="border-red-500/20"
          />
          <StatCard
            icon={<Shield className="w-6 h-6" strokeWidth={2} />}
            title="Clean"
            value={results.summary.clean_count}
            subtitle="No issues"
            color="text-blue-500"
            bgColor="bg-blue-500/5"
            borderColor="border-blue-500/20"
          />
          
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-3 mb-8">
        <TabButton
          active={activeTab === 'manual'}
          onClick={() => onTabChange('manual')}
          icon={<FileText className="w-5 h-5" strokeWidth={2} />}
          label="Manual Entry"
          description="Quick input"
        />
        <TabButton
          active={activeTab === 'file'}
          onClick={() => onTabChange('file')}
          icon={<Upload className="w-5 h-5" strokeWidth={2} />}
          label="File Upload"
          description="CSV, Excel"
        />
        <TabButton
          active={activeTab === 'batch'}
          onClick={() => onTabChange('batch')}
          icon={<Files className="w-5 h-5" strokeWidth={2} />}
          label="Batch Upload"
          description="Multiple files"
        />
      </div>

      {/* Content Area */}
      <div className="mb-8">
        {activeTab === 'manual' && (
          <UploadSection 
            onAnalysisComplete={onAnalysisComplete}
            onAnalysisStart={onAnalysisStart}
            loading={loading}
          />
        )}
        {activeTab === 'file' && (
          <FileUploadSection onAnalysisComplete={onAnalysisComplete} />
        )}
        {activeTab === 'batch' && (
          <BatchUploadSection onAnalysisComplete={onAnalysisComplete} />
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="bg-white rounded-3xl border border-[#000e00]/5 p-16 text-center shadow-sm">
          <div className="w-16 h-16 border-4 border-[#028355]/20 border-t-[#028355] rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-[#000e00] mb-2">Analyzing Invoices...</h3>
          <p className="text-[#000e00]/60">AI is detecting fraud patterns</p>
        </div>
      )}

      {results && !loading && (
        <div className="animate-fadeIn">
          {isBatchResult ? (
            <FraudBatchResults batchData={results} />
          ) : (
            <ResultsSection results={results} />
          )}
        </div>
      )}

      {!results && !loading && (
        <div className="bg-white rounded-3xl border border-[#000e00]/5 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-[#e9edf4] rounded-full flex items-center justify-center mx-auto mb-5">
            <Shield className="w-10 h-10 text-[#000e00]/20" strokeWidth={2} />
          </div>
          <h3 className="text-xl font-semibold text-[#000e00] mb-2">No Analysis Yet</h3>
          <p className="text-[#000e00]/50 mb-6">
            Upload invoices or enter data manually to start detection
          </p>
          <div className="flex flex-col gap-2 text-sm text-[#000e00]/40">
            <p>✓ Real-time fraud detection</p>
            <p>✓ Explainable AI results</p>
            <p>✓ Export reports</p>
          </div>
        </div>
      )}
    </>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, subtitle, color, bgColor, borderColor }) {
  return (
    <div className={`bg-white rounded-2xl border ${borderColor} p-6 shadow-sm hover:shadow-md transition-all duration-200 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${bgColor} rounded-xl ${color} group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
      <h3 className="text-3xl font-bold text-[#000e00] mb-1">{value}</h3>
      <p className="text-sm text-[#000e00]/60 font-medium">{title}</p>
      <p className="text-xs text-[#000e00]/40 mt-0.5">{subtitle}</p>
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label, description }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[160px] px-5 py-4 rounded-2xl font-medium transition-all duration-200 flex items-center gap-3 text-left ${
        active
          ? 'bg-[#028355] text-white shadow-sm'
          : 'bg-white text-[#000e00]/70 border border-[#000e00]/10 hover:border-[#028355]/30 hover:bg-[#028355]/5'
      }`}
    >
      <div>{icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{label}</div>
        <div className={`text-xs mt-0.5 ${active ? 'text-white/80' : 'text-[#000e00]/50'}`}>
          {description}
        </div>
      </div>
    </button>
  );
}

export default Dashboard;
