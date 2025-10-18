import Layout from '../components/Layout';

const Dashboard = () => {
  const stats = [
    { title: 'Total Scans', value: '156', trend: '↑ 12%', icon: '🔍', color: 'bg-blue-600' },
    { title: 'Active Alerts', value: '8', trend: '↓ 3%', icon: '⚠️', color: 'bg-red-600' },
    { title: 'Compliance Score', value: '94%', trend: '↑ 5%', icon: '✅', color: 'bg-green-600' },
    { title: 'Recent Activity', value: '24', trend: '→ 0%', icon: '🕒', color: 'bg-yellow-600' },
  ];

  const recentScans = [
    { file: 'Invoice_Oct2024.csv', module: 'Fraud Detection', status: 'Flagged', time: '2 hours ago' },
    { file: 'Policy_Doc.pdf', module: 'Compliance', status: 'Completed', time: '5 hours ago' },
    { file: 'Contract_XYZ.pdf', module: 'Document AI', status: 'Pending', time: '1 day ago' },
  ];

  return (
    <Layout>
      <h2 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h2>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{stat.icon}</span>
              <span className="text-gray-400 text-sm">{stat.trend}</span>
            </div>
            <p className="text-gray-400 text-sm mb-2">{stat.title}</p>
            <p className="text-white text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentScans.map((scan, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                <div>
                  <p className="text-white font-medium">{scan.file}</p>
                  <p className="text-gray-400 text-sm">{scan.module} • {scan.time}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  scan.status === 'Flagged' ? 'bg-red-600' : scan.status === 'Completed' ? 'bg-green-600' : 'bg-yellow-600'
                } text-white`}>
                  {scan.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg">
              Upload File
            </button>
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg">
              View Reports
            </button>
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg">
              Check History
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
