import fs from 'fs';
import csv from 'csv-parser';
import mammoth from 'mammoth';

export const extractTextFromFile = async (filePath, mimetype) => {
  try {
    // Plain text files
    if (mimetype === 'text/plain' || filePath.endsWith('.txt')) {
      console.log('📄 Reading plain text file...');
      const text = fs.readFileSync(filePath, 'utf-8');
      return [{ text, source: 'txt' }];
    }

    // Word documents
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        filePath.endsWith('.docx')) {
      console.log('📄 Extracting text from Word document...');
      const result = await mammoth.extractRawText({ path: filePath });
      return [{ text: result.value, source: 'docx' }];
    }

    // CSV files (multiple contracts)
    if (mimetype === 'text/csv' || filePath.endsWith('.csv')) {
      console.log('📄 Parsing CSV with multiple contracts...');
      return await parseContractCSV(filePath);
    }

    throw new Error('Unsupported file format. Please use TXT, DOCX, or CSV files.');
  } catch (error) {
    console.error('Document extraction error:', error);
    throw error;
  }
};

async function parseContractCSV(filePath) {
  return new Promise((resolve, reject) => {
    const documents = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Support various column names
        const text = row.contract_text || row.text || row.document || row.content || 
                    row.contract || row.agreement || row.Contract || row.Text;
        const name = row.name || row.document_name || row.title || row.Name || 
                    row.DocumentName || `Document ${documents.length + 1}`;
        
        if (text && text.trim().length > 0) {
          documents.push({
            text: text.trim(),
            name: name,
            source: 'csv'
          });
        }
      })
      .on('end', () => {
        console.log(`✅ Parsed ${documents.length} contracts from CSV`);
        resolve(documents);
      })
      .on('error', reject);
  });
}
