import { useState, useCallback, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network, Shield, AlertTriangle, TrendingUp, Zap, RefreshCw, Info, Loader2 } from 'lucide-react';
import axios from '../config/axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
const GRAPH_SERVICE = 'http://localhost:8009';

function RiskGraphEngine() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [statistics, setStatistics] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [dataSource, setDataSource] = useState('sample');
  const graphRef = useRef();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    let invoicesData = [];
    let sourceType = 'sample';
    
    try {
      // Try to fetch REAL data from fraud detection results
      console.log('🔍 Fetching real data from fraud detection...');
      
      const backendResponse = await axios.get(`${API_BASE}/api/upload/graph-data`);
      
      if (backendResponse.data.hasData && backendResponse.data.invoices.length > 0) {
        invoicesData = backendResponse.data.invoices;
        sourceType = 'real';
        console.log(`✅ Using ${invoicesData.length} REAL invoices from your fraud analysis!`);
        toast.success(`Using ${invoicesData.length} real invoices from your analysis!`);
      } else {
        // Fallback to sample data for demo
        console.log('⚠️ No real data found, using sample data for demonstration');
        invoicesData = [
          { invoice_no: 'INV-2025-001', vendor: 'TechCorp Solutions', company_id: 'COMP_001', total_amount: 125000, fraud_score: 0.85 },
          { invoice_no: 'INV-2025-002', vendor: 'TechCorp Solutions', company_id: 'COMP_002', total_amount: 98000, fraud_score: 0.78 },
          { invoice_no: 'INV-2025-003', vendor: 'TechCorp Solutions', company_id: 'COMP_003', total_amount: 156000, fraud_score: 0.92 },
          { invoice_no: 'INV-2025-004', vendor: 'Global Supplies Ltd', company_id: 'COMP_001', total_amount: 45000, fraud_score: 0.25 },
          { invoice_no: 'INV-2025-005', vendor: 'Global Supplies Ltd', company_id: 'COMP_004', total_amount: 67000, fraud_score: 0.18 },
          { invoice_no: 'INV-2025-006', vendor: 'Shady Enterprises', company_id: 'COMP_002', total_amount: 250000, fraud_score: 0.95 },
          { invoice_no: 'INV-2025-007', vendor: 'Shady Enterprises', company_id: 'COMP_005', total_amount: 180000, fraud_score: 0.88 },
          { invoice_no: 'INV-2025-008', vendor: 'Reliable Vendors Inc', company_id: 'COMP_003', total_amount: 35000, fraud_score: 0.12 },
          { invoice_no: 'INV-2025-009', vendor: 'Reliable Vendors Inc', company_id: 'COMP_004', total_amount: 52000, fraud_score: 0.15 },
          { invoice_no: 'INV-2025-010', vendor: 'Reliable Vendors Inc', company_id: 'COMP_005', total_amount: 41000, fraud_score: 0.20 },
          { invoice_no: 'INV-2025-011', vendor: 'Phantom LLC', company_id: 'COMP_001', total_amount: 320000, fraud_score: 0.98 },
          { invoice_no: 'INV-2025-012', vendor: 'Phantom LLC', company_id: 'COMP_002', total_amount: 280000, fraud_score: 0.96 },
        ];
        sourceType = 'sample';
        toast.info('Using sample data for demonstration');
      }

      // Call graph service to analyze the network
      console.log(`📊 Analyzing ${invoicesData.length} invoices for fraud patterns...`);
      
      const response = await axios.post(`${GRAPH_SERVICE}/analyze-network`, {
        invoices: invoicesData
      });

      console.log('✅ Graph analysis complete:', response.data.statistics);

      // Transform data for ForceGraph2D visualization
      const nodes = response.data.nodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        risk_score: node.risk_score,
        metadata: node.metadata,
        color: node.color,
        size: node.size,
        val: node.size / 5
      }));

      const links = response.data.edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
        value: edge.value,
        risk_level: edge.risk_level,
        color: edge.color,
        width: edge.width
      }));

      setGraphData({ nodes, links });
      setStatistics(response.data.statistics);
      setClusters(response.data.fraud_clusters);
      setDataSource(sourceType);
      toast.success('Graph analysis complete!');

    } catch (error) {
      console.error('❌ Graph analysis error:', error);
      toast.error('Failed to analyze graph data. Make sure graph service is running on port 8009.');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
    setSelectedNode(null);
  }, []);

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8 mb-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl shadow-sm">
              <Network size={28} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#000e00]">AI Risk Graph Engine</h2>
              <p className="text-[#000e00]/60 text-sm">Visualize fraud networks and detect suspicious patterns</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 bg-[#028355]/10 hover:bg-[#028355]/20 border border-[#028355]/20 
                       text-[#028355] rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
            >
              {loading ? <Loader2 size={18} className="animate-spin" strokeWidth={2} /> : <RefreshCw size={18} strokeWidth={2} />}
              {loading ? 'Analyzing...' : 'Reload Data'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 
                       text-blue-700 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm"
            >
              <Zap size={18} strokeWidth={2} />
              Reset View
            </button>
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
            dataSource === 'real' 
              ? 'bg-[#028355]/10 border-[#028355]/20 text-[#028355]' 
              : 'bg-blue-500/10 border-blue-500/20 text-blue-700'
          }`}>
            <Shield size={16} strokeWidth={2.5} />
            {dataSource === 'real' ? '🎯 Using Real Data from Your Fraud Analysis' : '📝 Using Sample Demo Data'}
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-[#e9edf4] rounded-2xl p-5 text-center hover:shadow-sm transition-all border border-[#000e00]/5">
              <p className="text-[#000e00]/60 text-xs mb-1">Total Nodes</p>
              <p className="text-2xl font-bold text-[#000e00]">{statistics.total_nodes}</p>
              <p className="text-xs text-[#000e00]/40 mt-1">Entities</p>
            </div>
            <div className="bg-[#e9edf4] rounded-2xl p-5 text-center hover:shadow-sm transition-all border border-[#000e00]/5">
              <p className="text-[#000e00]/60 text-xs mb-1">Connections</p>
              <p className="text-2xl font-bold text-[#028355]">{statistics.total_edges}</p>
              <p className="text-xs text-[#000e00]/40 mt-1">Transactions</p>
            </div>
            <div className="bg-[#e9edf4] rounded-2xl p-5 text-center hover:shadow-sm transition-all border border-[#000e00]/5">
              <p className="text-[#000e00]/60 text-xs mb-1">Companies</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.companies}</p>
              <p className="text-xs text-[#000e00]/40 mt-1">Business entities</p>
            </div>
            <div className="bg-[#e9edf4] rounded-2xl p-5 text-center hover:shadow-sm transition-all border border-[#000e00]/5">
              <p className="text-[#000e00]/60 text-xs mb-1">Vendors</p>
              <p className="text-2xl font-bold text-emerald-600">{statistics.vendors}</p>
              <p className="text-xs text-[#000e00]/40 mt-1">Suppliers</p>
            </div>
            <div className="bg-[#e9edf4] rounded-2xl p-5 text-center hover:shadow-sm transition-all border border-[#000e00]/5">
              <p className="text-[#000e00]/60 text-xs mb-1">Fraud Clusters</p>
              <p className="text-2xl font-bold text-red-600">{statistics.fraud_clusters_detected}</p>
              <p className="text-xs text-[#000e00]/40 mt-1">Detected</p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="p-5 bg-gradient-to-r from-[#028355]/5 to-emerald-50 border border-[#028355]/10 rounded-2xl">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-[#028355] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
            <div className="text-sm">
              <p className="font-semibold text-[#000e00] mb-1">How Graph Intelligence Works:</p>
              <p className="text-[#000e00]/70 leading-relaxed">
                The AI analyzes your invoice data to find <strong className="text-[#028355]">patterns</strong>: same vendor appearing across multiple companies with high fraud scores indicates a <strong className="text-[#028355]">fraud ring</strong>. 
                Nodes = entities (companies/vendors), Edges = transactions, Colors = risk levels. Click any node for details!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Graph */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h3 className="text-xl font-bold text-[#000e00] flex items-center gap-2">
                <Network size={24} className="text-[#028355]" strokeWidth={2.5} />
                Network Visualization
              </h3>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full border border-red-200">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-red-700 font-medium">High Risk</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-amber-700 font-medium">Medium</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                  <div className="w-3 h-3 rounded-full bg-[#028355]"></div>
                  <span className="text-[#028355] font-medium">Low Risk</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#e9edf4] to-white rounded-2xl overflow-hidden border-2 border-[#000e00]/5" style={{ height: '600px' }}>
              {graphData.nodes.length > 0 ? (
                <ForceGraph2D
                  ref={graphRef}
                  graphData={graphData}
                  nodeLabel={(node) => `${node.name} (${node.type})`}
                  nodeColor={(node) => node.color}
                  nodeVal={(node) => node.val}
                  linkColor={(link) => link.color}
                  linkWidth={(link) => link.width}
                  onNodeClick={handleNodeClick}
                  backgroundColor="rgba(233,237,244,0.3)"
                  linkDirectionalParticles={2}
                  linkDirectionalParticleSpeed={0.005}
                  linkDirectionalParticleWidth={2}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.color;
                    
                    // Draw circle
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
                    ctx.fillStyle = node.color;
                    ctx.fill();
                    
                    // Draw border for selected node
                    if (selectedNode && selectedNode.id === node.id) {
                      ctx.strokeStyle = '#028355';
                      ctx.lineWidth = 3 / globalScale;
                      ctx.stroke();
                    }
                    
                    // Draw label
                    ctx.fillStyle = '#000e00';
                    ctx.fillText(label, node.x, node.y + node.val + 10 / globalScale);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Network size={64} className="text-[#000e00]/10 mx-auto mb-4" strokeWidth={2} />
                    <p className="text-[#000e00]/40">Loading graph data...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          
          {/* Selected Node Details */}
          {selectedNode && (
            <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-6 animate-fadeIn">
              <h3 className="text-lg font-bold text-[#000e00] mb-4 flex items-center gap-2">
                <Shield size={20} className="text-[#028355]" strokeWidth={2.5} />
                Node Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#000e00]/60 mb-1 font-medium">Name</p>
                  <p className="font-bold text-[#000e00]">{selectedNode.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[#000e00]/60 mb-1 font-medium">Type</p>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                    selectedNode.type === 'company' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' : 'bg-[#028355]/10 text-[#028355] border-[#028355]/20'
                  }`}>
                    {selectedNode.type.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[#000e00]/60 mb-2 font-medium">Risk Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-[#e9edf4] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          selectedNode.risk_score > 0.7 ? 'bg-red-500' :
                          selectedNode.risk_score > 0.4 ? 'bg-amber-500' : 'bg-[#028355]'
                        }`}
                        style={{ width: `${selectedNode.risk_score * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-[#000e00]">{(selectedNode.risk_score * 100).toFixed(1)}%</span>
                  </div>
                </div>
                {selectedNode.metadata && (
                  <div className="pt-4 border-t border-[#000e00]/10">
                    <p className="text-xs text-[#000e00]/60 mb-3 font-medium">Metadata</p>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedNode.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 bg-[#e9edf4] rounded-lg">
                          <span className="text-[#000e00]/60">{key}:</span>
                          <span className="font-semibold text-[#000e00]">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fraud Clusters */}
          <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-6">
            <h3 className="text-lg font-bold text-[#000e00] mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" strokeWidth={2.5} />
              Fraud Clusters Detected
            </h3>
            {clusters.length > 0 ? (
              <div className="space-y-3">
                {clusters.map((cluster, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-2xl border-l-4 ${
                      cluster.risk_level === 'High' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-[#000e00]">{cluster.id}</h4>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        cluster.risk_level === 'High' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {cluster.risk_level} Risk
                      </span>
                    </div>
                    <p className="text-xs text-[#000e00]/70 mb-3 leading-relaxed">{cluster.description}</p>
                    <div className="flex gap-4 text-xs">
                      <span className="text-[#000e00]/60"><strong>Entities:</strong> {cluster.size}</span>
                      <span className="text-[#000e00]/60"><strong>Risk:</strong> {(cluster.avg_risk_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield size={40} className="text-[#000e00]/10 mx-auto mb-2" strokeWidth={2} />
                <p className="text-sm text-[#000e00]/40">No suspicious clusters detected</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-6">
            <h3 className="text-lg font-bold text-[#000e00] mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#028355]" strokeWidth={2.5} />
              Graph Legend
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  C
                </div>
                <div>
                  <p className="font-semibold text-[#000e00]">Company</p>
                  <p className="text-xs text-[#000e00]/60">Business entity</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#028355] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  V
                </div>
                <div>
                  <p className="font-semibold text-[#000e00]">Vendor</p>
                  <p className="text-xs text-[#000e00]/60">Supplier/Service provider</p>
                </div>
              </div>
              <div className="pt-4 border-t border-[#000e00]/10">
                <p className="text-xs text-[#000e00]/60 mb-3 font-medium">Connection Types:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                    <div className="w-8 h-1 bg-red-500 rounded"></div>
                    <span className="text-xs text-[#000e00]">High risk transaction</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-[#e9edf4] rounded-lg">
                    <div className="w-8 h-1 bg-[#000e00]/20 rounded"></div>
                    <span className="text-xs text-[#000e00]">Normal transaction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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

export default RiskGraphEngine;
