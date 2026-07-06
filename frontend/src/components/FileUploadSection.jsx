import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, Sparkles, Info, FilePlus } from 'lucide-react';
import axios from '../config/axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function FileUploadSection({ onAnalysisComplete }) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setSelectedFile(file);
    setUploading(true);
    
    // Check file type to determine processing message
    const isPDF = file.type === 'application/pdf';
    setUploadStatus({ 
      type: 'loading', 
      message: isPDF 
        ? `Extracting data from ${file.name} using AI OCR...` 
        : `Uploading ${file.name}...` 
    });
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', 'test_company_001');
      
      // Use different endpoint based on file type
      const endpoint = isPDF 
        ? `${API_BASE}/api/upload/analyze-pdf-invoice`
        : `${API_BASE}/api/upload/analyze-file`;
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadStatus({ 
        type: 'success', 
        message: isPDF
          ? `Successfully extracted and analyzed invoice from ${file.name}!`
          : `Successfully processed ${response.data.invoicesProcessed} invoices from ${file.name}!` 
      });
      
      setTimeout(() => {
        onAnalysisComplete(response.data);
        setUploading(false);
        setUploadStatus(null);
        setSelectedFile(null);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ 
        type: 'error', 
        message: error.response?.data?.details || error.response?.data?.error || 'Upload failed. Please try again.' 
      });
      setTimeout(() => {
        setUploading(false);
        setUploadStatus(null);
      }, 4000);
    }
  }, [onAnalysisComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf']  // ✅ PDF SUPPORT ADDED
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8 mb-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl shadow-sm">
          <FileSpreadsheet size={24} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#000e00]">Document Upload</h2>
          <p className="text-[#000e00]/60 text-sm">Upload CSV, Excel, or PDF files with invoice data</p>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${isDragActive ? 'border-[#028355] bg-[#028355]/5 scale-[1.02]' : 'border-[#000e00]/10 hover:border-[#028355]/50 bg-[#e9edf4]/30'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <Loader2 size={48} className="text-[#028355] animate-spin" strokeWidth={2.5} />
              <p className="text-lg font-semibold text-[#000e00]">Processing your file...</p>
              <p className="text-sm text-[#000e00]/60">
                {selectedFile?.type === 'application/pdf' 
                  ? '🔍 AI is extracting invoice data from PDF...'
                  : 'AI is analyzing invoices for fraud patterns'}
              </p>
              <div className="flex gap-2 mt-2">
                <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Upload size={48} className="text-[#028355]" strokeWidth={2} />
                <Sparkles size={20} className="absolute -top-1 -right-1 text-[#028355] animate-pulse" strokeWidth={2.5} />
              </div>
              {isDragActive ? (
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-[#028355]">Drop the file here...</p>
                  <p className="text-sm text-[#028355]/70">Release to start analysis</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-[#000e00]">Drag & drop your invoice file</p>
                    <p className="text-[#000e00]/60">or click to browse</p>
                  </div>
                  
                  {/* File Type Badges */}
                  <div className="flex gap-3 mt-4 flex-wrap justify-center">
                    <span className="px-4 py-2 bg-[#028355]/10 border border-[#028355]/20 rounded-full text-sm font-semibold text-[#028355] flex items-center gap-1.5">
                      <FileText size={14} strokeWidth={2} />
                      CSV
                    </span>
                    <span className="px-4 py-2 bg-[#028355]/10 border border-[#028355]/20 rounded-full text-sm font-semibold text-[#028355] flex items-center gap-1.5">
                      <FileText size={14} strokeWidth={2} />
                      Excel
                    </span>
                    <span className="px-4 py-2 bg-gradient-to-r from-[#028355]/10 to-emerald-100 border-2 border-[#028355]/30 rounded-full text-sm font-bold text-[#028355] flex items-center gap-1.5 shadow-sm">
                      <FilePlus size={14} strokeWidth={2.5} />
                      PDF ✨ NEW
                    </span>
                  </div>
                  
                  <p className="text-xs text-[#000e00]/40 mt-4">Max file size: 10MB</p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Selected File */}
      {selectedFile && !uploading && (
        <div className="mt-6 p-4 bg-[#e9edf4] rounded-2xl border border-[#000e00]/5 animate-slideUp">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-[#028355]" strokeWidth={2} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#000e00]">{selectedFile.name}</p>
              <p className="text-xs text-[#000e00]/50">
                {(selectedFile.size / 1024).toFixed(2)} KB
                {selectedFile.type === 'application/pdf' && (
                  <span className="ml-2 px-2 py-0.5 bg-[#028355]/10 rounded text-[#028355] font-medium">PDF</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`mt-6 p-5 rounded-2xl flex items-start gap-3 animate-slideUp ${
          uploadStatus.type === 'success' ? 'bg-[#028355]/10 border-2 border-[#028355]/20' :
          uploadStatus.type === 'error' ? 'bg-red-500/10 border-2 border-red-500/20' :
          'bg-blue-500/10 border-2 border-blue-500/20'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            {uploadStatus.type === 'success' && <CheckCircle size={22} className="text-[#028355]" strokeWidth={2.5} />}
            {uploadStatus.type === 'error' && <AlertCircle size={22} className="text-red-600" strokeWidth={2.5} />}
            {uploadStatus.type === 'loading' && <Loader2 size={22} className="text-blue-600 animate-spin" strokeWidth={2.5} />}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold mb-1 ${
              uploadStatus.type === 'success' ? 'text-[#028355]' :
              uploadStatus.type === 'error' ? 'text-red-700' :
              'text-blue-700'
            }`}>
              {uploadStatus.type === 'success' ? '✅ Success!' : 
               uploadStatus.type === 'error' ? '❌ Error' : 
               '⏳ Processing...'}
            </p>
            <p className="text-sm text-[#000e00]/70">{uploadStatus.message}</p>
          </div>
        </div>
      )}

      {/* Format Helpers */}
      <div className="mt-6 space-y-4">
        
        {/* CSV/Excel Format */}
        <div className="p-5 bg-gradient-to-r from-[#028355]/5 to-emerald-50 rounded-2xl border border-[#028355]/10">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-[#028355] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#000e00] mb-3">📋 CSV/Excel Format:</p>
              <div className="bg-white rounded-xl p-4 border border-[#028355]/10 mb-3">
                <code className="text-xs font-mono text-[#000e00]/70 block">
                  invoice_no, vendor, date, base_amount, gst_rate, gst_amount, total_amount
                </code>
              </div>
              <p className="text-xs text-[#000e00]/60 leading-relaxed">
                <strong className="text-[#028355]">Note:</strong> Column names can be in different formats (e.g., "Invoice Number", "Vendor Name", etc.)
              </p>
            </div>
          </div>
        </div>

        {/* PDF Format Info */}
        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <div className="flex items-start gap-3">
            <FilePlus size={20} className="text-blue-600 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#000e00] mb-2">📄 PDF Invoice Support:</p>
              <ul className="text-xs text-[#000e00]/60 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>AI-powered OCR automatically extracts invoice fields</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Supports standard invoice formats (vendor, amounts, dates, GST)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Works with scanned or digital PDF invoices</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default FileUploadSection;
