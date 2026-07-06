import csv from 'csv-parser';
import XLSX from 'xlsx';
import fs from 'fs';

export const parseCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`✅ Parsed ${results.length} rows from CSV`);
        resolve(results);
      })
      .on('error', reject);
  });
};

export const parseExcel = async (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ Parsed ${data.length} rows from Excel`);
    return data;
  } catch (error) {
    throw new Error(`Excel parsing failed: ${error.message}`);
  }
};

export const parseDocument = async (filePath, mimetype) => {
  try {
    if (mimetype === 'text/csv' || filePath.endsWith('.csv')) {
      return await parseCSV(filePath);
    }
    
    if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        mimetype === 'application/vnd.ms-excel' ||
        filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
      return await parseExcel(filePath);
    }
    
    // PDF Support - Coming Soon
    if (mimetype === 'application/pdf' || filePath.endsWith('.pdf')) {
      console.log('⚠️ PDF parsing is currently disabled. Please convert to CSV or Excel.');
      throw new Error('PDF parsing is temporarily disabled. Please use CSV or Excel files. We are working on PDF support!');
    }
    
    throw new Error('Unsupported file format. Please use CSV or Excel files.');
  } catch (error) {
    console.error('Document parsing error:', error);
    throw error;
  }
};

export const normalizeInvoiceData = (data) => {
  return data.map(row => {
    // Handle CSV/Excel data
    const invoice_no = row.invoice_no || row.Invoice || row.InvoiceNumber || row.invoice_number || row['Invoice Number'];
    const vendor = row.vendor || row.Vendor || row.VendorName || row.vendor_name || row['Vendor Name'];
    const date = row.date || row.Date || row.InvoiceDate || row.invoice_date || row['Invoice Date'];
    const base_amount = parseFloat(row.base_amount || row.BaseAmount || row.Amount || row.amount || 0);
    const gst_rate = parseFloat(row.gst_rate || row.GSTRate || row.GST || row.gst || row['GST Rate'] || 18);
    const gst_amount = parseFloat(row.gst_amount || row.GSTAmount || row['GST Amount'] || (base_amount * gst_rate / 100));
    const total_amount = parseFloat(row.total_amount || row.TotalAmount || row.Total || row.total || (base_amount + gst_amount));
    
    return {
      invoice_no: invoice_no || 'UNKNOWN',
      vendor: vendor || 'UNKNOWN',
      date: date || new Date().toISOString().split('T')[0],
      base_amount,
      gst_rate,
      gst_amount,
      total_amount,
      confidence: 100
    };
  }).filter(inv => inv.invoice_no !== 'UNKNOWN' && inv.total_amount > 0);
};
