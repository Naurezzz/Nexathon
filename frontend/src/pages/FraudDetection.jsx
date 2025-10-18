import Layout from '../components/Layout';

const FraudDetection = () => {
  return (
    <Layout>
      <h2 className="text-3xl font-bold text-white mb-6">Fraud Detection</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Upload Files</h3>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">Drag & drop CSV, Excel, or JSON files here</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
            Browse Files
          </button>
          <p className="text-gray-500 text-sm mt-4">Max file size: 50MB • Supported: CSV, XLSX, JSON</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Scans</h3>
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-white font-medium">📄 Invoice_2024.csv</p>
                <p className="text-gray-400 text-sm">Scanned: Oct 17, 2025 7:30 PM</p>
              </div>
              <button className="text-blue-400 hover:text-blue-300">⛓️ Verify</button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <p className="text-red-400 text-2xl font-bold">3</p>
                <p className="text-gray-400 text-sm">High Risk</p>
              </div>
              <div className="text-center">
                <p className="text-yellow-400 text-2xl font-bold">5</p>
                <p className="text-gray-400 text-sm">Medium Risk</p>
              </div>
              <div className="text-center">
                <p className="text-green-400 text-2xl font-bold">142</p>
                <p className="text-gray-400 text-sm">Passed</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">View Details</button>
              <button className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg">Export Report</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FraudDetection;
