import Layout from '../components/Layout';
import { useNavigate, useLocation } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const tabs = [
    { name: 'Profile', path: '/settings/profile' },
    { name: 'Company', path: '/settings/company' },
    { name: 'Notifications', path: '/settings/notifications' },
    { name: 'Integrations', path: '/settings/integrations' },
  ];

  return (
    <Layout>
      <h2 className="text-3xl font-bold text-white mb-6">Settings</h2>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex gap-4 border-b border-gray-700 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`pb-3 px-4 ${
                location.pathname === tab.path
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Full Name</label>
            <input type="text" className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg" />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Email</label>
            <input type="email" className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg" />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Company</label>
            <input type="text" className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg" />
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
            Save Changes
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
