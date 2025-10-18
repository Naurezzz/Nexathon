import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Fraud Detection', path: '/fraud-detection', icon: '🔍' },
    { name: 'Compliance Audit', path: '/compliance-audit', icon: '✓' },
    { name: 'Document AI', path: '/document-ai', icon: '📄' },
    { name: 'Reconciliation', path: '/reconciliation', icon: '🔄' },
    { name: 'Bankruptcy Predictor', path: '/bankruptcy-predictor', icon: '📊' },
    { name: 'Reports', path: '/reports', icon: '📈' },
    { name: 'History', path: '/history', icon: '🕒' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 h-screen fixed left-0 top-0 overflow-y-auto transition-all`}>
      <div className="p-6">
        <h1 className={`text-2xl font-bold text-white mb-8 ${isCollapsed ? 'hidden' : 'block'}`}>
          AegisAI
        </h1>
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-8 text-gray-400 hover:text-white w-full text-center"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
