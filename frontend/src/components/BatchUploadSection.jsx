import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Files, Sparkles } from 'lucide-react';
import axios from '../config/axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function BatchUploadSection({ onAnalysisComplete }) {
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
      
      const response = await axios.post(`${API_BASE}/api/upload/analyze-batch`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully processed ${response.data.totalInvoices} invoices from ${response.data.filesProcessed} files!` 
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
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 10,
    disabled: uploading
  });

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-xl shadow-sm">
          <Files size={24} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#000e00]">Batch Upload</h2>
          <p className="text-[#000e00]/60 text-sm">Upload multiple files at once (up to 10 files)</p>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${isDragActive ? 'border-[#028355] bg-[#028355]/5' : 'border-[#000e00]/10 hover:border-[#028355]/50 bg-[#e9edf4]/30'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <Loader2 size={48} className="text-[#028355] animate-spin" strokeWidth={2.5} />
              <p className="text-lg font-semibold text-[#000e00]">Processing {selectedFiles.length} files...</p>
              <p className="text-sm text-[#000e00]/60">AI is analyzing all invoices for fraud patterns</p>
            </>
          ) : (
            <>
              <div className="relative">
                <Files size={48} className="text-[#028355]" strokeWidth={2} />
                <Sparkles size={20} className="absolute -top-1 -right-1 text-[#028355] animate-pulse" strokeWidth={2.5} />
              </div>
              {isDragActive ? (
                <p className="text-lg font-semibold text-[#028355]">Drop files here...</p>
              ) : (
                <>
                  <p className="text-lg font-semibold text-[#000e00]">Drag & drop multiple files here</p>
                  <p className="text-[#000e00]/60">or click to select files</p>
                  <div className="flex gap-3 mt-2 flex-wrap justify-center">
                    <span className="px-4 py-2 bg-[#028355]/10 border border-[#028355]/20 rounded-full text-sm font-semibold text-[#028355]">
                      ✅ CSV
                    </span>
                    <span className="px-4 py-2 bg-[#028355]/10 border border-[#028355]/20 rounded-full text-sm font-semibold text-[#028355]">
                      ✅ Excel
                    </span>
                    <span className="px-4 py-2 bg-[#000e00]/5 border border-[#000e00]/10 rounded-full text-sm font-medium text-[#000e00]/40">
                      🚧 PDF (Soon)
                    </span>
                  </div>
                  <p className="text-xs text-[#000e00]/40 mt-2">Up to 10 files, 10MB each</p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {selectedFiles.length > 0 && !uploading && (
        <div className="mt-4 p-4 bg-[#e9edf4] rounded-2xl border border-[#000e00]/5">
          <p className="text-sm font-semibold text-[#000e00] mb-2">Selected Files:</p>
          <ul className="text-xs text-[#000e00]/70 space-y-1.5">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex items-center gap-2">
                <FileText size={14} className="text-[#028355]" strokeWidth={2} />
                {file.name} <span className="text-[#000e00]/50">({(file.size / 1024).toFixed(2)} KB)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploadStatus && (
        <div className={`mt-4 p-4 rounded-2xl flex items-center gap-3 ${
          uploadStatus.type === 'success' ? 'bg-[#028355]/10 border border-[#028355]/20' :
          uploadStatus.type === 'error' ? 'bg-red-500/10 border border-red-500/20' :
          'bg-blue-500/10 border border-blue-500/20'
        }`}>
          {uploadStatus.type === 'success' && <CheckCircle size={20} className="text-[#028355]" strokeWidth={2.5} />}
          {uploadStatus.type === 'error' && <AlertCircle size={20} className="text-red-500" strokeWidth={2.5} />}
          {uploadStatus.type === 'loading' && <Loader2 size={20} className="text-blue-500 animate-spin" strokeWidth={2.5} />}
          <p className="text-sm font-medium text-[#000e00]">{uploadStatus.message}</p>
        </div>
      )}
    </div>
  );
}

export default BatchUploadSection;
