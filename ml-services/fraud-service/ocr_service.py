from fastapi import UploadFile
import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image
import io
import re
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Configure Tesseract path (uncomment and adjust for Windows)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class InvoiceExtractor:
    """Extract invoice data from PDF/Image using OCR"""
    
    @staticmethod
    async def extract_from_file(file: UploadFile) -> dict:
        """Extract text and parse invoice data from uploaded file"""
        try:
            content = await file.read()
            filename = file.filename.lower()
            
            logger.info(f"📄 Processing file: {file.filename} ({len(content)} bytes)")
            
            # Extract text based on file type
            if filename.endswith('.pdf'):
                text = await InvoiceExtractor._extract_from_pdf(content)
            elif filename.endswith(('.png', '.jpg', '.jpeg')):
                text = await InvoiceExtractor._extract_from_image(content)
            else:
                raise ValueError("Unsupported file type")
            
            logger.info(f"✅ Extracted {len(text)} characters")
            
            # Parse invoice fields
            invoice_data = InvoiceExtractor._parse_invoice(text)
            
            return {
                "success": True,
                "raw_text": text[:1000],  # First 1000 chars for preview
                "parsed_data": invoice_data,
                "filename": file.filename
            }
            
        except Exception as e:
            logger.error(f"❌ Extraction error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    async def _extract_from_pdf(content: bytes) -> str:
        """Extract text from PDF using OCR"""
        try:
            logger.info("   Converting PDF to images...")
            # Convert PDF to images (max 3 pages)
            images = convert_from_bytes(content, dpi=300, first_page=1, last_page=3)
            
            text = ""
            for i, image in enumerate(images):
                logger.info(f"   OCR on page {i+1}/{len(images)}...")
                page_text = pytesseract.image_to_string(image, lang='eng')
                text += page_text + "\n"
            
            return text
            
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            raise
    
    @staticmethod
    async def _extract_from_image(content: bytes) -> str:
        """Extract text from image using OCR"""
        try:
            logger.info("   Running OCR on image...")
            image = Image.open(io.BytesIO(content))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            text = pytesseract.image_to_string(image, lang='eng')
            return text
            
        except Exception as e:
            logger.error(f"Image extraction error: {e}")
            raise
    
    @staticmethod
    def _parse_invoice(text: str) -> dict:
        """Parse invoice fields from extracted text using regex patterns"""
        
        # Indian invoice patterns
        patterns = {
            'invoice_no': [
                r'Invoice\s*(?:No|Number|#)\s*:?\s*([A-Z0-9\-/]+)',
                r'Bill\s*(?:No|Number|#)\s*:?\s*([A-Z0-9\-/]+)',
                r'INV(?:OICE)?[-\s]*(?:NO)?[-\s]*:?\s*([A-Z0-9\-/]+)',
                r'Tax\s*Invoice\s*(?:No)?\s*:?\s*([A-Z0-9\-/]+)'
            ],
            'date': [
                r'Date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Invoice\s*Date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'Bill\s*Date\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})'
            ],
            'gstin': [
                r'GSTIN\s*:?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})',
                r'GST\s*(?:No|Number)\s*:?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})',
                r'GST\s*IN\s*:?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})'
            ],
            'total_amount': [
                r'Total\s*Amount\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'Grand\s*Total\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'Amount\s*Payable\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'Net\s*Amount\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'Total\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)'
            ],
            'gst_amount': [
                r'(?:Total\s*)?GST\s*(?:Amount)?\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'Tax\s*Amount\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'CGST.*?₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'SGST.*?₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'IGST.*?₹?\s*Rs\.?\s*([\d,]+\.?\d*)'
            ],
            'base_amount': [
                r'(?:Taxable|Sub)\s*(?:Amount|Total)\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'Amount\s*Before\s*Tax\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)',
                r'Subtotal\s*:?\s*₹?\s*Rs\.?\s*([\d,]+\.?\d*)'
            ]
        }
        
        result = {}
        
        # Extract each field
        for field, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
                if match:
                    value = match.group(1).strip()
                    
                    # Clean numeric values
                    if field in ['total_amount', 'gst_amount', 'base_amount']:
                        value = value.replace(',', '').replace('Rs.', '').replace('₹', '').strip()
                        try:
                            value = float(value)
                            result[field] = value
                            logger.info(f"   ✓ Found {field}: {value}")
                            break
                        except:
                            continue
                    else:
                        result[field] = value
                        logger.info(f"   ✓ Found {field}: {value}")
                        break
        
        # Extract vendor name (near top, after common headers)
        vendor_patterns = [
            r'(?:To|Bill\s*To|Billed\s*To|Customer)\s*:?\s*\n\s*([A-Za-z][A-Za-z\s&\.,Ltd]+)',
            r'M/s\.?\s*([A-Z][A-Za-z\s&\.,Ltd]{5,})',
        ]
        
        for pattern in vendor_patterns:
            match = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
            if match:
                vendor = match.group(1).strip()
                # Clean up
                vendor = re.sub(r'\s+', ' ', vendor)
                if len(vendor) > 5 and not vendor.lower().startswith('invoice'):
                    result['vendor'] = vendor[:100]  # Max 100 chars
                    logger.info(f"   ✓ Found vendor: {vendor}")
                    break
        
        # Calculate missing fields
        if 'total_amount' in result and 'gst_amount' in result:
            if 'base_amount' not in result:
                result['base_amount'] = result['total_amount'] - result['gst_amount']
                logger.info(f"   ✓ Calculated base_amount: {result['base_amount']}")
        
        if 'base_amount' in result and 'gst_amount' in result:
            if result['base_amount'] > 0:
                gst_rate = round((result['gst_amount'] / result['base_amount']) * 100, 2)
                # Validate GST rate
                valid_rates = [0, 0.25, 3, 5, 12, 18, 28]
                closest_rate = min(valid_rates, key=lambda x: abs(x - gst_rate))
                if abs(gst_rate - closest_rate) < 2:  # Within 2% tolerance
                    result['gst_rate'] = closest_rate
                    logger.info(f"   ✓ Calculated gst_rate: {closest_rate}%")
        
        # Normalize date format
        if 'date' in result:
            try:
                # Try parsing date
                date_str = result['date']
                for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%d-%m-%y', '%d/%m/%y']:
                    try:
                        date_obj = datetime.strptime(date_str, fmt)
                        result['date'] = date_obj.strftime('%Y-%m-%d')
                        break
                    except:
                        continue
            except:
                pass
        
        logger.info(f"📊 Parsed {len(result)} fields: {list(result.keys())}")
        
        return result
