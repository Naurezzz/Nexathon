import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ML_BASE = 'http://localhost:8001';

function PDFUploadSection({ onExtracted }) {
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [rawText, setRawText] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload PDF, PNG, or JPEG file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.loading('🔍 Extracting invoice data with OCR...', { id: 'extract' });

      const response = await fetch(`${ML_BASE}/extract`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Extraction failed');
      }

      const result = await response.json();
      
      toast.success('✅ Invoice extracted successfully!', { id: 'extract' });
      
      setExtractedData(result.parsed_data);
      setRawText(result.raw_text);
      
      // Send extracted data to parent
      if (onExtracted && result.parsed_data) {
        onExtracted(result.parsed_data);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`❌ ${error.message}`, { id: 'extract' });
    } finally {
      setUploading(false);
    }
  };

  const clearExtraction = () => {
    setExtractedData(null);
    setRawText('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8 mb-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl">
            <Upload size={24} className="text-purple-600" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#000e00]">AI-Powered Invoice Extraction</h2>
            <p className="text-[#000e00]/60 text-sm">Upload PDF or Image • OCR will extract all details automatically</p>
          </div>
        </div>
        {extractedData && (
          <button
            onClick={clearExtraction}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-all"
          >
            Clear & Upload New
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        
        <label
          htmlFor="file-upload"
          className={`block border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
            ${uploading ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 
             'border-purple-300 hover:border-purple-500 hover:bg-purple-50/50'}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={48} className="text-purple-600 animate-spin" strokeWidth={2} />
              <div>
                <p className="text-lg font-semibold text-[#000e00]">Processing Invoice...</p>
                <p className="text-sm text-[#000e00]/60 mt-1">
                  OCR is reading your document • This may take 10-30 seconds
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <FileText size={32} className="text-purple-600" strokeWidth={2} />
                </div>
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <ImageIcon size={32} className="text-blue-600" strokeWidth={2} />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#000e00] mb-1">
                  📄 Drop invoice here or click to upload
                </p>
                <p className="text-sm text-[#000e00]/60">
                  Supports PDF, PNG, JPEG • Maximum 10MB
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  PDF Documents
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  Scanned Images
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  Screenshots
                </span>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Extracted Data Preview */}
      {extractedData && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={24} className="text-green-600" strokeWidth={2} />
            <h3 className="text-lg font-bold text-[#000e00]">✅ Data Extracted Successfully</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(extractedData).map(([key, value]) => (
              <div key={key} className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                <p className="text-xs text-[#000e00]/60 mb-1 uppercase font-semibold">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="text-sm font-bold text-[#000e00]">
                  {value !== null && value !== undefined ? 
                    (typeof value === 'number' ? 
                      (key.includes('amount') ? `₹${value.toLocaleString('en-IN')}` : value) 
                      : value) 
                    : '❌ Not found'}
                </p>
              </div>
            ))}
          </div>

          {/* Show if any required fields are missing */}
          {(!extractedData.invoice_no || !extractedData.date || !extractedData.total_amount) && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-2">
                <XCircle size={18} className="text-yellow-600 mt-0.5" strokeWidth={2} />
                <div>
                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                    ⚠️ Some fields could not be extracted
                  </p>
                  <p className="text-xs text-yellow-800">
                    Please fill in the missing details manually before analyzing
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl">
        <p className="text-xs text-[#000e00]/70 leading-relaxed">
          <strong className="text-purple-700">🤖 Advanced OCR Technology:</strong> Our AI uses Tesseract OCR + pattern matching to extract invoice fields. Works with printed invoices, scanned documents, and screenshots. Review extracted data before fraud analysis.
        </p>
      </div>
    </div>
  );
}

export default PDFUploadSection;
