import Layout from '../components/Layout';

const BankruptcyPredictor = () => {
  return (
    <Layout>
      <h2 className="text-3xl font-bold text-white mb-6">Bankruptcy Predictor</h2>
      
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Financial Data Upload</h3>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center mb-6">
            <p className="text-gray-400 mb-4">Upload balance sheet & income statement</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
              Upload Files
            </button>
          </div>

          <div className="bg-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white text-xl font-bold mb-2">🏢 Company XYZ Ltd</p>
                <p className="text-red-400 text-lg font-semibold">Bankruptcy Risk: 68/100 (HIGH)</p>
              </div>
              <button className="text-blue-400 hover:text-blue-300">⛓️ Verify</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm">Financial Health</p>
                <p className="text-white text-2xl font-bold">45/100</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Market Sentiment</p>
                <p className="text-red-400 text-2xl font-bold">Negative</p>
              </div>
            </div>
            <div className="border-t border-gray-600 pt-4">
              <p className="text-white font-semibold mb-2">Top Risk Factors:</p>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Declining cash flow (3 consecutive quarters)</li>
                <li>• High debt-to-equity ratio (4.2)</li>
                <li>• Negative news mentions increased 150%</li>
              </ul>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">View Analysis</button>
              <button className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg">Export</button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Sentiment Analysis</h3>
          <input
            type="text"
            placeholder="Company Name"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg mb-4"
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mb-6">
            Fetch Market Sentiment
          </button>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Recent News</p>
            <p className="text-gray-500 text-xs">No data available</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BankruptcyPredictor;
