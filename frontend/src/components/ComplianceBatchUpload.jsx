import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Files, CheckCircle, AlertCircle, Loader2, FileText, Sparkles } from 'lucide-react';
import axios from '../config/axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function ComplianceBatchUpload({ onAnalysisComplete }) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setSelectedFiles(acceptedFiles);
    setUploading(true);
    setUploadStatus({ type: 'loading', message: `Uploading ${acceptedFiles.length} files...` });
    
    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('companyId', 'test_company_001');
      
      const response = await axios.post(`${API_BASE}/api/compliance/check-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully processed ${response.data.documentsProcessed} documents from ${response.data.filesProcessed} files!` 
      });
      
      setTimeout(() => {
        onAnalysisComplete(response.data);
        setUploading(false);
        setUploadStatus(null);
        setSelectedFiles([]);
      }, 2000);
      
    } catch (error) {
      console.error('Batch upload error:', error);
      setUploadStatus({ 
        type: 'error', 
        message: error.response?.data?.details || 'Batch upload failed. Please try again.' 
      });
      setTimeout(() => {
        setUploading(false);
        setUploadStatus(null);
      }, 3000);
    }
  }, [onAnalysisComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 10,
    disabled: uploading
  });

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8 mb-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl shadow-sm">
          <Files size={24} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#000e00]">Batch Compliance Check</h2>
          <p className="text-[#000e00]/60 text-sm">Upload multiple contract files at once (up to 10 files)</p>
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
              <p className="text-lg font-semibold text-[#000e00]">Processing {selectedFiles.length} files...</p>
              <p className="text-sm text-[#000e00]/60">AI is analyzing all contracts for compliance</p>
              <div className="flex gap-2 mt-2">
                <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#028355] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Files size={48} className="text-[#028355]" strokeWidth={2} />
                <Sparkles size={20} className="absolute -top-1 -right-1 text-[#028355] animate-pulse" strokeWidth={2.5} />
              </div>
              {isDragActive ? (
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-[#028355]">Drop files here...</p>
                  <p className="text-sm text-[#028355]/70">Release to start compliance check</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-[#000e00]">Drag & drop multiple contracts</p>
                    <p className="text-[#000e00]/60">or click to browse your files</p>
                  </div>
                  
                  {/* Supported File Types */}
                  <div className="flex gap-3 mt-4 flex-wrap justify-center">
                    <span className="px-4 py-2 bg-[#028355]/10 border border-[#028355]/20 rounded-full text-sm font-semibold text-[#028355] flex items-center gap-1.5">
                      <FileText size={14} strokeWidth={2} />
                      TXT
                    </span>
                    <span className="px-4 py-2 bg-[#028355]/10 border border-[#028355]/20 rounded-full text-sm font-semibold text-[#028355] flex items-center gap-1.5">
                      <FileText size={14} strokeWidth={2} />
                      DOCX
                    </span>
                    <span className="px-4 py-2 bg-[#028355]/10 border border-[#028355]/20 rounded-full text-sm font-semibold text-[#028355] flex items-center gap-1.5">
                      <FileText size={14} strokeWidth={2} />
                      CSV
                    </span>
                    <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm font-semibold text-blue-600 flex items-center gap-1.5">
                      <FileText size={14} strokeWidth={2} />
                      PDF
                    </span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-[#028355]/5 rounded-xl border border-[#028355]/10">
                    <p className="text-xs text-[#000e00]/60">
                      <strong className="text-[#028355]">Pro Tip:</strong> Upload up to 10 files (10MB each) for batch processing
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && !uploading && (
        <div className="mt-6 p-5 bg-[#e9edf4] rounded-2xl border border-[#000e00]/5 animate-slideUp">
          <p className="text-sm font-semibold text-[#000e00] mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-[#028355]" strokeWidth={2} />
            Selected Files ({selectedFiles.length})
          </p>
          <ul className="space-y-2.5">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#000e00]/5">
                <FileText size={16} className="text-[#028355] flex-shrink-0" strokeWidth={2} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#000e00] truncate">{file.name}</p>
                  <p className="text-xs text-[#000e00]/50">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <span className="px-2 py-1 bg-[#028355]/10 border border-[#028355]/20 rounded-lg text-xs font-semibold text-[#028355]">
                  Ready
                </span>
              </li>
            ))}
          </ul>
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
            <p className="text-sm text-[#000e00]/70 leading-relaxed">{uploadStatus.message}</p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#028355]/5 to-emerald-50 rounded-2xl border border-[#028355]/10">
        <p className="text-xs text-[#000e00]/70 leading-relaxed">
          <strong className="text-[#028355]">AI-Powered Analysis:</strong> Our advanced compliance engine checks your contracts against regulatory standards in real-time. Each document is analyzed for mandatory clauses, risk factors, and legal compliance.
        </p>
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

export default ComplianceBatchUpload;
