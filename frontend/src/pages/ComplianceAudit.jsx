import Layout from '../components/Layout';

const ComplianceAudit = () => {
  return (
    <Layout>
      <h2 className="text-3xl font-bold text-white mb-6">Compliance Audit</h2>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Upload Documents</h3>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center mb-6">
            <p className="text-gray-400 mb-4">Upload PDF, DOCX, or TXT files for compliance check</p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
              Browse Files
            </button>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-white font-medium">📋 Employee_Policy_2024.pdf</p>
                <p className="text-yellow-400 font-semibold">Compliance Score: 78/100</p>
              </div>
              <button className="text-blue-400 hover:text-blue-300">⛓️ Verify</button>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-red-400">❌</span>
                <p className="text-gray-300">Missing: Data Protection Clause</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚠️</span>
                <p className="text-gray-300">Outdated: Salary Review Policy (2022)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✅</span>
                <p className="text-gray-300">12 sections compliant</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">View Breakdown</button>
              <button className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg">Export</button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Custom Rules</h3>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mb-4">
            + Add Custom Rule
          </button>
          <div className="space-y-2">
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-white text-sm">GDPR Compliance Check</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <p className="text-white text-sm">ISO 27001 Standards</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComplianceAudit;
