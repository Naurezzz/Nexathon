import Layout from '../components/Layout';

const Reports = () => {
  return (
    <Layout>
      <h2 className="text-3xl font-bold text-white mb-6">Reports</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Generate New Report</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Start Date</label>
            <input type="date" className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg" />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">End Date</label>
            <input type="date" className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg" />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Module</label>
            <select className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option>All Modules</option>
              <option>Fraud Detection</option>
              <option>Compliance</option>
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Format</label>
            <select className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option>PDF</option>
              <option>Excel</option>
              <option>CSV</option>
            </select>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
          Generate Report
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Saved Reports</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 py-3">Report Name</th>
              <th className="text-left text-gray-400 py-3">Date Generated</th>
              <th className="text-left text-gray-400 py-3">Modules</th>
              <th className="text-left text-gray-400 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700">
              <td className="text-white py-3">Q4_2024_Fraud_Report</td>
              <td className="text-gray-400 py-3">Oct 15, 2025</td>
              <td className="text-gray-400 py-3">Fraud Detection</td>
              <td className="py-3">
                <button className="text-blue-400 hover:text-blue-300 mr-3">Download</button>
                <button className="text-red-400 hover:text-red-300">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Reports;
