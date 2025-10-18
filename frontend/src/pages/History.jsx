import Layout from '../components/Layout';

const History = () => {
  return (
    <Layout>
      <h2 className="text-3xl font-bold text-white mb-6">Activity History</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-5 gap-4 mb-4">
          <input type="date" className="bg-gray-700 text-white px-4 py-2 rounded-lg" placeholder="Start Date" />
          <input type="date" className="bg-gray-700 text-white px-4 py-2 rounded-lg" placeholder="End Date" />
          <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
            <option>All Modules</option>
            <option>Fraud Detection</option>
            <option>Compliance</option>
          </select>
          <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
            <option>All Status</option>
            <option>Completed</option>
            <option>Flagged</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Search</button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((_, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="text-white font-medium">Fraud scan completed on Invoice_2024.csv</p>
                  <p className="text-gray-400 text-sm">Oct 17, 2025 • 3:45 PM • By Admin</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">⛓️ Verified</span>
                <button className="text-blue-400 hover:text-blue-300">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default History;
