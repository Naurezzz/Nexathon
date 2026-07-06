import { useState, useEffect } from 'react';
import { Shield, RefreshCw, Search, CheckCircle, XCircle, AlertTriangle, Clock, Database, Link as LinkIcon } from 'lucide-react';
import axios from 'axios';

const BLOCKCHAIN_API = 'http://localhost:8007';

function BlockchainExplorer() {
  const [blockchain, setBlockchain] = useState(null);
  const [chainInfo, setChainInfo] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchDocId, setSearchDocId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBlockchain();
    loadChainInfo();
    const interval = setInterval(() => {
      loadChainInfo();
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadBlockchain = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BLOCKCHAIN_API}/chain`);
      setBlockchain(response.data.chain);
      setError(null);
    } catch (err) {
      setError('Failed to load blockchain. Ensure service is running on port 8007');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadChainInfo = async () => {
    try {
      const response = await axios.get(`${BLOCKCHAIN_API}/chain/info`);
      setChainInfo(response.data);
    } catch (err) {
      console.error('Failed to load chain info:', err);
    }
  };

  const verifyBlockchain = async () => {
    try {
      setIsVerifying(true);
      const response = await axios.get(`${BLOCKCHAIN_API}/verify`);
      setVerificationResult(response.data);
      setTimeout(() => setVerificationResult(null), 5000);
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const searchDocument = async () => {
    if (!searchDocId.trim()) return;

    try {
      const response = await axios.get(`${BLOCKCHAIN_API}/document/${searchDocId}`);
      if (response.data.blocks_found > 0) {
        setSelectedBlock(response.data.blocks[0]);
      } else {
        alert('Document not found in blockchain');
      }
    } catch (err) {
      console.error('Search failed:', err);
      alert('Search failed');
    }
  };

  const formatHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e9edf4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#028355]/20 border-t-[#028355] rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-[#000e00]">Loading Blockchain...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#e9edf4] flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-red-500/20 p-12 text-center max-w-md shadow-sm">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-10 h-10 text-red-500" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-[#000e00] mb-3">Connection Error</h2>
          <p className="text-[#000e00]/60 mb-6">{error}</p>
          <button 
            onClick={loadBlockchain}
            className="bg-[#028355] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#026d44] transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e9edf4]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#028355]/10 rounded-xl">
              <LinkIcon className="w-8 h-8 text-[#028355]" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#000e00]">Blockchain Explorer</h1>
              <p className="text-[#000e00]/60 mt-1">AegisAI Document Validation Ledger</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {chainInfo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
            <StatCard
              icon={<Database className="w-6 h-6" strokeWidth={2} />}
              title="Total Blocks"
              value={chainInfo.length}
              color="text-[#028355]"
              bgColor="bg-[#028355]/5"
              borderColor="border-[#028355]/20"
            />
            <StatCard
              icon={<Shield className="w-6 h-6" strokeWidth={2} />}
              title="Transactions"
              value={chainInfo.total_transactions}
              color="text-blue-500"
              bgColor="bg-blue-500/5"
              borderColor="border-blue-500/20"
            />
            <StatCard
              icon={<Clock className="w-6 h-6" strokeWidth={2} />}
              title="Pending"
              value={chainInfo.pending_transactions}
              color="text-yellow-500"
              bgColor="bg-yellow-500/5"
              borderColor="border-yellow-500/20"
            />
            <StatCard
              icon={<Shield className="w-6 h-6" strokeWidth={2} />}
              title="Difficulty"
              value={chainInfo.difficulty}
              color="text-purple-500"
              bgColor="bg-purple-500/5"
              borderColor="border-purple-500/20"
            />
            <StatCard
              icon={chainInfo.is_valid ? <CheckCircle className="w-6 h-6" strokeWidth={2} /> : <XCircle className="w-6 h-6" strokeWidth={2} />}
              title="Status"
              value={chainInfo.is_valid ? 'Valid' : 'Invalid'}
              color={chainInfo.is_valid ? 'text-green-500' : 'text-red-500'}
              bgColor={chainInfo.is_valid ? 'bg-green-500/5' : 'bg-red-500/5'}
              borderColor={chainInfo.is_valid ? 'border-green-500/20' : 'border-red-500/20'}
            />
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white rounded-2xl border border-[#000e00]/10 p-5 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-3">
              <input
                type="text"
                placeholder="Search by Document ID..."
                value={searchDocId}
                onChange={(e) => setSearchDocId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchDocument()}
                className="flex-1 px-4 py-3 rounded-xl border border-[#000e00]/10 focus:border-[#028355] focus:ring-2 focus:ring-[#028355]/20 outline-none transition-all"
              />
              <button 
                onClick={searchDocument}
                className="px-6 py-3 bg-[#028355] text-white rounded-xl font-semibold hover:bg-[#026d44] transition-all flex items-center gap-2"
              >
                <Search className="w-5 h-5" strokeWidth={2} />
                Search
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={loadBlockchain}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" strokeWidth={2} />
                Refresh
              </button>
              <button 
                onClick={verifyBlockchain}
                disabled={isVerifying}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Shield className="w-5 h-5" strokeWidth={2} />
                {isVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className={`mb-8 p-5 rounded-2xl border ${verificationResult.is_valid ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center gap-3">
              {verificationResult.is_valid ? (
                <CheckCircle className="w-6 h-6 text-green-500" strokeWidth={2} />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" strokeWidth={2} />
              )}
              <span className={`font-semibold ${verificationResult.is_valid ? 'text-green-700' : 'text-red-700'}`}>
                {verificationResult.message}
              </span>
            </div>
          </div>
        )}

        {/* Blockchain Visualization */}
        <div className="space-y-6">
          {blockchain && blockchain.map((block, index) => (
            <div key={block.index}>
              <div 
                onClick={() => setSelectedBlock(block)}
                className={`bg-white rounded-2xl border ${selectedBlock?.index === block.index ? 'border-[#028355] shadow-lg' : 'border-[#000e00]/10'} p-6 cursor-pointer hover:shadow-md transition-all duration-200 ${block.index === 0 ? 'bg-gradient-to-br from-[#028355]/5 to-white' : ''}`}
              >
                {/* Block Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${block.index === 0 ? 'bg-yellow-500/10' : 'bg-[#028355]/10'} rounded-xl`}>
                      <Database className={`w-6 h-6 ${block.index === 0 ? 'text-yellow-500' : 'text-[#028355]'}`} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#000e00]">
                        {block.index === 0 ? '🌟 Genesis Block' : `Block #${block.index}`}
                      </h3>
                      <p className="text-sm text-[#000e00]/60">{formatTimestamp(block.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-sm font-semibold">
                      {block.transactions.length} transactions
                    </span>
                  </div>
                </div>

                {/* Block Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <InfoRow label="Hash" value={formatHash(block.hash)} mono />
                  <InfoRow label="Previous Hash" value={formatHash(block.previous_hash)} mono />
                  <InfoRow label="Merkle Root" value={formatHash(block.merkle_root)} mono />
                  <InfoRow label="Nonce" value={block.nonce.toLocaleString()} />
                </div>

                {/* Transaction Preview */}
                {block.transactions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#000e00]/5">
                    <h4 className="text-sm font-semibold text-[#000e00]/60 mb-3">Recent Transactions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {block.transactions.slice(0, 4).map((tx, txIndex) => (
                        <div key={txIndex} className="px-3 py-2 bg-[#e9edf4] rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-xs font-semibold">
                              {tx.type || 'VALIDATION'}
                            </span>
                            {tx.document_id && (
                              <span className="text-xs text-[#000e00]/60 font-mono">
                                {tx.document_id.substring(0, 12)}...
                              </span>
                            )}
                          </div>
                          {tx.validation_result && (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              tx.validation_result === 'AUTHENTIC' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                            }`}>
                              {tx.validation_result}
                            </span>
                          )}
                        </div>
                      ))}
                      {block.transactions.length > 4 && (
                        <div className="px-3 py-2 bg-[#000e00]/5 rounded-lg text-center text-sm text-[#000e00]/60">
                          +{block.transactions.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chain Link */}
              {index < blockchain.length - 1 && (
                <div className="flex justify-center py-3">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-[#028355]/30"></div>
                    <LinkIcon className="w-5 h-5 text-[#028355]/50" strokeWidth={2} />
                    <div className="w-0.5 h-6 bg-[#028355]/30"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Block Details Modal */}
        {selectedBlock && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedBlock(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-[#000e00]/10 p-6 flex items-center justify-between rounded-t-3xl">
                <h2 className="text-2xl font-bold text-[#000e00]">
                  Block #{selectedBlock.index} Details
                </h2>
                <button 
                  onClick={() => setSelectedBlock(null)}
                  className="p-2 hover:bg-[#e9edf4] rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6 text-[#000e00]/60" strokeWidth={2} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Block Metadata */}
                <div>
                  <h3 className="text-lg font-bold text-[#000e00] mb-3">Block Information</h3>
                  <div className="bg-[#e9edf4] rounded-xl p-4 space-y-2 text-sm">
                    <DetailRow label="Index" value={selectedBlock.index} />
                    <DetailRow label="Timestamp" value={selectedBlock.timestamp_readable} />
                    <DetailRow label="Hash" value={selectedBlock.hash} mono />
                    <DetailRow label="Previous Hash" value={selectedBlock.previous_hash} mono />
                    <DetailRow label="Merkle Root" value={selectedBlock.merkle_root} mono />
                    <DetailRow label="Nonce" value={selectedBlock.nonce.toLocaleString()} />
                  </div>
                </div>

                {/* Transactions */}
                <div>
                  <h3 className="text-lg font-bold text-[#000e00] mb-3">
                    Transactions ({selectedBlock.transactions.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedBlock.transactions.map((tx, index) => (
                      <div key={index} className="bg-[#e9edf4] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-xs font-semibold">
                            #{index + 1}
                          </span>
                          <span className="px-2 py-1 bg-[#028355]/10 text-[#028355] rounded-lg text-xs font-semibold">
                            {tx.type || 'VALIDATION'}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          {tx.document_id && <DetailRow label="Document ID" value={tx.document_id} />}
                          {tx.document_hash && <DetailRow label="Document Hash" value={tx.document_hash} mono small />}
                          {tx.validation_result && (
                            <DetailRow 
                              label="Result" 
                              value={
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  tx.validation_result === 'AUTHENTIC' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                }`}>
                                  {tx.validation_result}
                                </span>
                              } 
                            />
                          )}
                          {tx.authenticity_score !== undefined && (
                            <DetailRow label="Authenticity Score" value={`${tx.authenticity_score}%`} />
                          )}
                          {tx.document_type && <DetailRow label="Document Type" value={tx.document_type} />}
                          {tx.verified_by && <DetailRow label="Verified By" value={tx.verified_by} />}
                          {tx.timestamp && <DetailRow label="Timestamp" value={tx.timestamp} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ icon, title, value, color, bgColor, borderColor }) {
  return (
    <div className={`bg-white rounded-2xl border ${borderColor} p-6 shadow-sm hover:shadow-md transition-all duration-200 group`}>
      <div className={`p-3 ${bgColor} rounded-xl ${color} mb-3 inline-block group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-3xl font-bold text-[#000e00] mb-1">{value}</h3>
      <p className="text-sm text-[#000e00]/60 font-medium">{title}</p>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#000e00]/50 font-medium">{label}</span>
      <span className={`text-sm text-[#000e00] ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function DetailRow({ label, value, mono, small }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-[#000e00]/60 font-medium whitespace-nowrap">{label}:</span>
      <span className={`text-[#000e00] text-right ${mono ? 'font-mono' : ''} ${small ? 'text-xs' : ''} break-all`}>
        {value}
      </span>
    </div>
  );
}

export default BlockchainExplorer;
