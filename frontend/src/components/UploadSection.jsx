import { useState, useEffect } from 'react';
import { Upload, FileText, Plus, Trash2, Sparkles, Loader2, Shield } from 'lucide-react';
import { analyzeFraud } from '../services/api';
import toast from 'react-hot-toast';

function UploadSection({ onAnalysisComplete, onAnalysisStart, loading, initialData }) {
  const [invoices, setInvoices] = useState([{
    invoice_no: '',
    vendor: '',
    date: '',
    base_amount: '',
    gst_rate: 18,
    gst_amount: '',
    total_amount: '',
    gstin: ''
  }]);

  // Auto-fill from PDF extraction
  useEffect(() => {
    if (initialData) {
      const newInvoice = {
        invoice_no: initialData.invoice_no || '',
        vendor: initialData.vendor || '',
        date: initialData.date || '',
        base_amount: initialData.base_amount?.toString() || '',
        gst_rate: initialData.gst_rate || 18,
        gst_amount: initialData.gst_amount?.toString() || '',
        total_amount: initialData.total_amount?.toString() || '',
        gstin: initialData.gstin || ''
      };
      
      // Auto-calculate if missing
      if (newInvoice.base_amount && newInvoice.gst_rate && !newInvoice.gst_amount) {
        const base = parseFloat(newInvoice.base_amount);
        const rate = parseFloat(newInvoice.gst_rate);
        newInvoice.gst_amount = (base * rate / 100).toFixed(2);
        newInvoice.total_amount = (base + parseFloat(newInvoice.gst_amount)).toFixed(2);
      }
      
      setInvoices([newInvoice]);
    }
  }, [initialData]);

  const addInvoice = () => {
    setInvoices([...invoices, {
      invoice_no: '',
      vendor: '',
      date: '',
      base_amount: '',
      gst_rate: 18,
      gst_amount: '',
      total_amount: '',
      gstin: ''
    }]);
  };

  const removeInvoice = (index) => {
    const newInvoices = invoices.filter((_, i) => i !== index);
    setInvoices(newInvoices);
  };

  const updateInvoice = (index, field, value) => {
    const newInvoices = [...invoices];
    newInvoices[index][field] = value;

    if (field === 'base_amount' || field === 'gst_rate') {
      const baseAmount = parseFloat(newInvoices[index].base_amount) || 0;
      const gstRate = parseFloat(newInvoices[index].gst_rate) || 0;
      newInvoices[index].gst_amount = (baseAmount * gstRate / 100).toFixed(2);
      newInvoices[index].total_amount = (baseAmount + parseFloat(newInvoices[index].gst_amount)).toFixed(2);
    }

    setInvoices(newInvoices);
  };

  const handleAnalyze = async () => {
    try {
      onAnalysisStart();
      
      const validInvoices = invoices.filter(inv => 
        inv.invoice_no && inv.vendor && inv.date && inv.base_amount
      ).map(inv => ({
        ...inv,
        base_amount: parseFloat(inv.base_amount),
        gst_rate: parseFloat(inv.gst_rate),
        gst_amount: parseFloat(inv.gst_amount),
        total_amount: parseFloat(inv.total_amount),
        gstin: inv.gstin || null
      }));

      if (validInvoices.length === 0) {
        toast.error('Please fill in at least one complete invoice');
        return;
      }

      const result = await analyzeFraud(validInvoices);
      onAnalysisComplete(result);
      toast.success('✅ Fraud analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.message);
    }
  };

  const loadSampleData = () => {
    setInvoices([
      {
        invoice_no: 'INV-2025-001',
        vendor: 'Central Warehousing Corporation',
        date: '2025-10-28',
        base_amount: '100000',
        gst_rate: 18,
        gst_amount: '18000',
        total_amount: '118000',
        gstin: '24AAACC1206D1ZM'
      },
      {
        invoice_no: 'INV-2025-002',
        vendor: 'Suspicious Vendor Inc',
        date: '2025-10-28',
        base_amount: '89500',
        gst_rate: 15,
        gst_amount: '13425',
        total_amount: '102925',
        gstin: 'INVALID123'
      },
      {
        invoice_no: 'INV-2025-003',
        vendor: 'Google India Pvt Ltd',
        date: '2025-10-28',
        base_amount: '256000',
        gst_rate: 18,
        gst_amount: '50000',
        total_amount: '306000',
        gstin: '29AABCG5937N1ZP'
      },
      {
        invoice_no: 'INV-2025-004',
        vendor: 'Prime Electronics Corp',
        date: '2025-10-28',
        base_amount: '48500',
        gst_rate: 18,
        gst_amount: '8730',
        total_amount: '57230',
        gstin: '29AABCM0658G1Z5'
      }
    ]);
    toast.success('📋 Sample data loaded with real GSTINs!');
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8 mb-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#028355]/10 rounded-xl">
            <FileText size={24} className="text-[#028355]" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#000e00]">Invoice Details {initialData && '(From PDF)'}</h2>
            <p className="text-[#000e00]/60 text-sm">
              {initialData ? 'Review extracted data and fill missing fields' : 'Enter invoice details with GSTIN for comprehensive fraud detection'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadSampleData} 
            className="px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-700 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm"
          >
            <Sparkles size={16} strokeWidth={2} />
            Load Sample
          </button>
          <button 
            onClick={addInvoice} 
            className="px-4 py-2.5 bg-[#028355]/10 hover:bg-[#028355]/20 border border-[#028355]/20 text-[#028355] rounded-xl font-semibold transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={16} strokeWidth={2} />
            Add Invoice
          </button>
        </div>
      </div>

      {/* Invoice Cards */}
      <div className="space-y-4">
        {invoices.map((invoice, index) => (
          <div key={index} className="bg-gradient-to-r from-[#e9edf4] to-white rounded-2xl border border-[#000e00]/10 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#028355] flex items-center gap-2">
                <span className="w-8 h-8 bg-[#028355] text-white rounded-lg flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                Invoice #{index + 1}
              </h3>
              {invoices.length > 1 && (
                <button 
                  onClick={() => removeInvoice(index)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={18} className="text-red-600" strokeWidth={2} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputField
                label="Invoice Number *"
                value={invoice.invoice_no}
                onChange={(e) => updateInvoice(index, 'invoice_no', e.target.value)}
                placeholder="INV-2025-001"
              />
              <InputField
                label="Vendor Name *"
                value={invoice.vendor}
                onChange={(e) => updateInvoice(index, 'vendor', e.target.value)}
                placeholder="ABC Company Pvt Ltd"
              />
              <InputField
                label="Date *"
                type="date"
                value={invoice.date}
                onChange={(e) => updateInvoice(index, 'date', e.target.value)}
              />
              <InputField
                label="Base Amount (₹) *"
                type="number"
                value={invoice.base_amount}
                onChange={(e) => updateInvoice(index, 'base_amount', e.target.value)}
                placeholder="125000"
              />
              <InputField
                label="GST Rate (%) *"
                type="number"
                value={invoice.gst_rate}
                onChange={(e) => updateInvoice(index, 'gst_rate', e.target.value)}
              />
              <InputField
                label="GST Amount (₹)"
                value={invoice.gst_amount}
                disabled
              />
              <InputField
                label="Total Amount (₹)"
                value={invoice.total_amount}
                disabled
              />
              <InputField
                label={<span className="flex items-center gap-1">GSTIN <Shield size={14} className="text-[#028355]" /></span>}
                value={invoice.gstin}
                onChange={(e) => updateInvoice(index, 'gstin', e.target.value.toUpperCase())}
                placeholder="27AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>

            {/* GSTIN Help Text */}
            {invoice.gstin && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-xs text-blue-900 flex items-center gap-2">
                  <Shield size={14} strokeWidth={2} />
                  <span><strong>Government Verification:</strong> This GSTIN will be validated against official Indian GST records</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Analyze Button */}
      <button 
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full mt-6 py-4 bg-[#028355] hover:bg-[#028355]/90 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 size={22} className="animate-spin" strokeWidth={2.5} />
            <span>Analyzing with ML + Government Verification...</span>
          </>
        ) : (
          <>
            <Upload size={22} strokeWidth={2.5} />
            <span>Analyze Invoices with AI + GSTIN Check</span>
          </>
        )}
      </button>

      {/* Info Banner */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#028355]/5 to-emerald-50 rounded-2xl border border-[#028355]/10">
        <p className="text-xs text-[#000e00]/70 leading-relaxed">
          <strong className="text-[#028355]">🔐 Advanced Fraud Detection:</strong> Our AI analyzes 10+ fraud indicators including GST validation, GSTIN verification with Government records, duplicate detection, threshold manipulation, calculation errors, and anomaly patterns. Enter GSTIN for enhanced verification!
        </p>
      </div>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, disabled, maxLength }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#000e00] mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full px-4 py-3 rounded-xl border transition-all
          ${disabled 
            ? 'bg-[#e9edf4] border-[#000e00]/5 text-[#000e00]/50 cursor-not-allowed' 
            : 'bg-white border-[#000e00]/10 text-[#000e00] focus:outline-none focus:ring-2 focus:ring-[#028355]/20 focus:border-[#028355]'
          } placeholder:text-[#000e00]/40`}
      />
    </div>
  );
}

export default UploadSection;
