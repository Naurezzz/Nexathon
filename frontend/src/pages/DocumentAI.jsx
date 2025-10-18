import Layout from '../components/Layout';

const DocumentAI = () => {
  return (
    <Layout>
      <h2 className="text-3xl font-bold text-white mb-6">Document AI</h2>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Batch Upload</h3>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">Upload multiple documents for extraction & classification</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
            Select Files
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Processed Documents</h3>
        <div className="grid grid-cols-3 gap-4">
          {['Loan_Application.pdf', 'Contract_ABC.pdf', 'Invoice_XYZ.pdf'].map((doc, idx) => (
            <div key={idx} className="bg-gray-700 rounded-lg p-4">
              <div className="bg-gray-600 h-32 rounded mb-3 flex items-center justify-center">
                <span className="text-4xl">📄</span>
              </div>
              <p className="text-white font-medium mb-2">{doc}</p>
              <p className="text-blue-400 text-sm mb-1">Type: {idx === 0 ? 'Loan' : idx === 1 ? 'Contract' : 'Invoice'}</p>
              <p className="text-gray-400 text-sm mb-3">Confidence: {95 - idx * 2}%</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DocumentAI;
