import FraudResult from '../models/FraudResult.js';
import { generatePDFReport, generateExcelReport } from '../services/exportService.js';
import fs from 'fs';
import path from 'path';

export const exportReport = async (req, res) => {
  try {
    const { uploadId, format } = req.params;
    const userId = req.user.id;
    
    // Get fraud results
    const fraudResult = await FraudResult.findOne({ uploadId });
    
    if (!fraudResult) {
      return res.status(404).json({ error: 'Analysis results not found' });
    }
    
    const fileName = `fraud_report_${uploadId}_${Date.now()}.${format}`;
    let filePath;
    
    if (format === 'pdf') {
      filePath = await generatePDFReport(fraudResult, fileName);
    } else if (format === 'xlsx' || format === 'excel') {
      filePath = await generateExcelReport(fraudResult, fileName);
    } else {
      return res.status(400).json({ error: 'Invalid format. Use pdf or excel' });
    }
    
    // Send file for download
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download report' });
      }
      
      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 60000); // Delete after 1 minute
    });
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Report generation failed', details: error.message });
  }
};
