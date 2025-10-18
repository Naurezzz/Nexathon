import Layout from '../components/Layout';

const Reconciliation = () => {
  return (
    <Layout>
      <h2 className="text-3xl font-bold text-white mb-6">Data Reconciliation</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Source A</h3>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
              Upload Source A
            </button>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Source B</h3>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
              Upload Source B
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Matching Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Match By</label>
            <select className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option>Invoice Number</option>
              <option>Vendor Name</option>
              <option>Date</option>
              <option>Amount</option>
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Similarity Threshold: 80%</label>
            <input type="range" min="0" max="100" value="80" className="w-full" />
          </div>
        </div>
        <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
          Run Reconciliation
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-green-900 bg-opacity-20 border border-green-600 rounded-lg p-6">
          <p className="text-green-400 font-semibold mb-2">Matched Records</p>
          <p className="text-white text-3xl font-bold">0</p>
        </div>
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-6">
          <p className="text-yellow-400 font-semibold mb-2">Potential Duplicates</p>
          <p className="text-white text-3xl font-bold">0</p>
        </div>
        <div className="bg-blue-900 bg-opacity-20 border border-blue-600 rounded-lg p-6">
          <p className="text-blue-400 font-semibold mb-2">Unique Records</p>
          <p className="text-white text-3xl font-bold">0</p>
        </div>
      </div>
    </Layout>
  );
};

export default Reconciliation;
