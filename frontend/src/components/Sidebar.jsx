import { 
  Shield, AlertTriangle, FileText, TrendingUp, DollarSign, 
  Globe, Activity, Sparkles, ChevronLeft, ChevronRight, 
  BarChart3, Lock, Clock, Link as LinkIcon
} from 'lucide-react';


const Sidebar = ({ activeModule, onModuleChange, collapsed, onToggleCollapse, isGovernment }) => {
  
  const navigationItems = [
    {
      id: 'fraud',
      label: 'Fraud Detection',
      icon: AlertTriangle,
      description: 'Invoice fraud analysis'
    },
    {
      id: 'compliance',
      label: 'Compliance Audit',
      icon: Shield,
      description: 'Regulatory compliance'
    },
    {
      id: 'document',
      label: 'Document Validator',
      icon: FileText,
      description: 'Document forensics'
    },
    {
      id: 'financial-risk',
      label: 'Financial Risk AI',
      icon: DollarSign,
      description: 'Bankruptcy prediction',
      badge: 'AI'
    },
    {
      id: 'cybersecurity',
      label: 'Cybersecurity AI',
      icon: Lock,
      description: 'Phishing detection',
      badge: 'AI'
    },
    {
      id: 'graph',
      label: 'Risk Graph Engine',
      icon: BarChart3,
      description: 'Network analysis'
    },
    {
      id: 'blockchain',
      label: 'Blockchain Ledger',
      icon: LinkIcon,
      description: 'Document validation chain',
      badge: 'NEW'
    },
    {
      id: 'ai-mentor',
      label: 'AI Mentor Hub',
      icon: Sparkles,
      description: 'Smart assistant',
      badge: 'AI'
    },
    {
      id: 'history',
      label: 'Analysis History',
      icon: Clock,
      description: 'Past analyses'
    }
  ];

  // Add government dashboard if user is government
  if (isGovernment) {
    navigationItems.push({
      id: 'national',
      label: 'National Dashboard',
      icon: Globe,
      description: 'Government view'
    });
  }

  // Debug: Log navigation items to console
  console.log('Sidebar Navigation Items:', navigationItems.map(item => item.id));

  return (
    <aside 
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-[#000e00]/5 transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="h-full flex flex-col">
        
        {/* Collapse Toggle */}
        <div className="p-4 border-b border-[#000e00]/5">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 hover:bg-[#e9edf4] rounded-xl transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-[#000e00]/60" strokeWidth={2} />
            ) : (
              <ChevronLeft className="w-5 h-5 text-[#000e00]/60" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  console.log('Clicked module:', item.id);
                  onModuleChange(item.id);
                }}
                className={`w-full group relative ${
                  collapsed ? 'px-3 py-3' : 'px-4 py-3'
                } rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                  isActive
                    ? 'bg-[#028355]/10 text-[#028355] border border-[#028355]/20 shadow-sm'
                    : 'text-[#000e00]/70 hover:bg-[#e9edf4] hover:text-[#000e00]'
                }`}
                title={collapsed ? item.label : ''}
              >
                <div className={`${collapsed ? '' : 'flex-shrink-0'}`}>
                  <IconComponent className="w-5 h-5" strokeWidth={2} />
                </div>
                
                {!collapsed && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 ${
                            item.badge === 'AI' ? 'bg-[#028355]' : 
                            item.badge === 'NEW' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                            'bg-gradient-to-r from-[#028355] to-emerald-600'
                          } text-white text-xs rounded font-bold flex-shrink-0`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${
                        isActive ? 'text-[#028355]/70' : 'text-[#000e00]/40'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-[#000e00] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#000e00] rotate-45"></div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-[#000e00]/5">
            <div className="p-3 bg-[#028355]/5 rounded-xl border border-[#028355]/10">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-[#028355]" strokeWidth={2} />
                <span className="text-xs font-semibold text-[#028355]">System Status</span>
              </div>
              <p className="text-xs text-[#000e00]/60">All services operational</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#028355] rounded-full animate-pulse"></div>
                <span className="text-xs text-[#000e00]/50">7 agents active</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Custom Scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #028355;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #026b44;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
