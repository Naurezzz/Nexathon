import { useState } from 'react';
import { Shield, ChevronDown, User, LogOut, Settings, Bell, Sparkles, Zap } from 'lucide-react';

const Navbar = ({ user, onSignOut, getUserRole, results, onShowMentor, activeModule }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = (role) => {
    const badges = {
      'government_official': { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', label: 'Government' },
      'company_admin': { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', label: 'Admin' },
      'super_admin': { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', label: 'Super Admin' },
      'company_user': { bg: 'bg-[#028355]/10', text: 'text-[#028355]', border: 'border-[#028355]/20', label: 'User' }
    };
    return badges[role] || badges['company_user'];
  };

  const getModuleName = (module) => {
    const names = {
      'fraud': 'Fraud Detection',
      'compliance': 'Compliance Audit',
      'graph': 'Risk Graph',
      'document': 'Document Validator',
      'financial-risk': 'Financial Risk',
      'cybersecurity': 'Cybersecurity',
      'history': 'Analysis History',
      'national': 'National Dashboard'
    };
    return names[module] || 'Dashboard';
  };

  const roleBadge = getRoleBadge(getUserRole());

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#000e00]/5 shadow-sm">
      <div className="max-w-full mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#000e00] tracking-tight">AEGIS AI</h1>
                <p className="text-xs text-[#000e00]/50 font-medium -mt-0.5">{getModuleName(activeModule)}</p>
              </div>
            </div>
          </div>

          

          {/* Right - User Actions */}
          <div className="flex items-center gap-3">
            
            {/* Version Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#e9edf4] rounded-xl">
              <Zap className="w-4 h-4 text-[#028355]" strokeWidth={2} />
              <span className="text-xs font-semibold text-[#000e00]">v2.0 MVP</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-[#e9edf4] rounded-xl transition-colors relative"
              >
                <Bell className="w-5 h-5 text-[#000e00]/70" strokeWidth={2} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#000e00]/5 overflow-hidden">
                  <div className="p-4 border-b border-[#000e00]/5">
                    <h3 className="font-semibold text-[#000e00]">Notifications</h3>
                    <p className="text-xs text-[#000e00]/50 mt-0.5">You have 3 new alerts</p>
                  </div>
                  <div className="p-2 max-h-96 overflow-y-auto">
                    <div className="p-3 hover:bg-[#e9edf4] rounded-xl transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-red-500" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#000e00]">High Risk Detected</p>
                          <p className="text-xs text-[#000e00]/60 mt-0.5">Invoice #1234 flagged for review</p>
                          <p className="text-xs text-[#000e00]/40 mt-1">2 minutes ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-[#e9edf4] rounded-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-[#000e00] leading-tight">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <span className={`text-xs px-2 py-0.5 ${roleBadge.bg} ${roleBadge.text} border ${roleBadge.border} rounded-md font-medium`}>
                    {roleBadge.label}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#000e00]/40 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} strokeWidth={2} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#000e00]/5 overflow-hidden">
                  <div className="p-4 border-b border-[#000e00]/5">
                    <p className="font-semibold text-[#000e00]">
                      {user?.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-sm text-[#000e00]/60 mt-0.5">{user?.email}</p>
                    {user?.user_metadata?.company_name && (
                      <p className="text-xs text-[#000e00]/40 mt-1">
                        {user.user_metadata.company_name}
                      </p>
                    )}
                  </div>
                  <div className="p-2">
                    <button
                      className="w-full px-4 py-2.5 text-left text-[#000e00]/70 hover:text-[#000e00] hover:bg-[#e9edf4] rounded-xl transition-all flex items-center gap-3"
                    >
                      <User className="w-4 h-4" strokeWidth={2} />
                      <span className="text-sm font-medium">Profile Settings</span>
                    </button>
                    <button
                      className="w-full px-4 py-2.5 text-left text-[#000e00]/70 hover:text-[#000e00] hover:bg-[#e9edf4] rounded-xl transition-all flex items-center gap-3 mt-1"
                    >
                      <Settings className="w-4 h-4" strokeWidth={2} />
                      <span className="text-sm font-medium">Preferences</span>
                    </button>
                    <div className="h-px bg-[#000e00]/5 my-2"></div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full px-4 py-2.5 text-left text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={2} />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
