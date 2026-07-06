from PIL import Image, ImageDraw, ImageFont
import os

# Create test documents folder
os.makedirs('test_documents', exist_ok=True)

def create_sample_pan_card():
    """Create a sample PAN card image"""
    img = Image.new('RGB', (850, 550), color='#E8F4F8')
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default if not available
    try:
        title_font = ImageFont.truetype("arial.ttf", 40)
        text_font = ImageFont.truetype("arial.ttf", 28)
        small_font = ImageFont.truetype("arial.ttf", 20)
    except:
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw header
    draw.rectangle([0, 0, 850, 100], fill='#1E3A8A')
    draw.text((300, 30), "INCOME TAX DEPARTMENT", fill='white', font=title_font)
    draw.text((250, 80), "GOVERNMENT OF INDIA", fill='white', font=small_font)
    
    # Draw PAN details
    draw.text((50, 150), "Permanent Account Number", fill='#1E3A8A', font=text_font)
    draw.rectangle([50, 200, 800, 270], outline='#1E3A8A', width=3)
    draw.text((300, 220), "ABCDE1234F", fill='black', font=title_font)
    
    # Draw personal details
    draw.text((50, 300), "Name: JOHN DOE", fill='black', font=text_font)
    draw.text((50, 350), "Father's Name: RICHARD DOE", fill='black', font=text_font)
    draw.text((50, 400), "Date of Birth: 15/01/1990", fill='black', font=text_font)
    
    # Save
    img.save('test_documents/sample_pan_card.jpg', quality=95)
    print("✅ Created: sample_pan_card.jpg")

def create_sample_aadhaar_card():
    """Create a sample Aadhaar card image"""
    img = Image.new('RGB', (850, 550), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        title_font = ImageFont.truetype("arial.ttf", 36)
        text_font = ImageFont.truetype("arial.ttf", 26)
        small_font = ImageFont.truetype("arial.ttf", 18)
    except:
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw header with Indian flag colors
    draw.rectangle([0, 0, 850, 30], fill='#FF9933')  # Saffron
    draw.rectangle([0, 30, 850, 60], fill='white')
    draw.rectangle([0, 60, 850, 90], fill='#138808')  # Green
    
    # Title
    draw.text((250, 110), "GOVERNMENT OF INDIA", fill='#000080', font=text_font)
    draw.text((350, 150), "आधार", fill='#DC143C', font=title_font)
    draw.text((380, 190), "AADHAAR", fill='#DC143C', font=title_font)
    
    # Aadhaar number
    draw.rectangle([50, 250, 800, 320], outline='#DC143C', width=3)
    draw.text((280, 270), "1234 5678 9012", fill='black', font=title_font)
    
    # Personal details
    draw.text((50, 350), "Name: PRIYA SHARMA", fill='black', font=text_font)
    draw.text((50, 390), "DOB: 25/03/1992", fill='black', font=text_font)
    draw.text((50, 430), "Gender: Female", fill='black', font=text_font)
    
    # Save
    img.save('test_documents/sample_aadhaar_card.jpg', quality=95)
    print("✅ Created: sample_aadhaar_card.jpg")

def create_sample_gst_certificate():
    """Create a sample GST certificate"""
    img = Image.new('RGB', (850, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        title_font = ImageFont.truetype("arial.ttf", 36)
        text_font = ImageFont.truetype("arial.ttf", 24)
        small_font = ImageFont.truetype("arial.ttf", 18)
    except:
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Border
    draw.rectangle([10, 10, 840, 590], outline='#000080', width=5)
    
    # Title
    draw.text((200, 50), "GOODS AND SERVICES TAX", fill='#000080', font=title_font)
    draw.text((300, 100), "REGISTRATION CERTIFICATE", fill='#000080', font=text_font)
    
    # GST details
    draw.text((50, 170), "GSTIN: 29ABCDE1234F1Z5", fill='black', font=title_font)
    
    draw.rectangle([50, 230, 800, 280], outline='black', width=2)
    draw.text((60, 240), "Legal Name: ABC TECHNOLOGIES PVT LTD", fill='black', font=text_font)
    
    draw.text((50, 310), "Trade Name: ABC Tech", fill='black', font=text_font)
    draw.text((50, 350), "Constitution: Private Limited Company", fill='black', font=text_font)
    draw.text((50, 390), "Date of Registration: 01/07/2017", fill='black', font=text_font)
    draw.text((50, 430), "State: Karnataka", fill='black', font=text_font)
    
    draw.text((50, 500), "This certificate is electronically generated.", fill='gray', font=small_font)
    
    # Save
    img.save('test_documents/sample_gst_certificate.jpg', quality=95)
    print("✅ Created: sample_gst_certificate.jpg")

def create_tampered_document():
    """Create a document with obvious tampering"""
    img = Image.new('RGB', (850, 550), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        title_font = ImageFont.truetype("arial.ttf", 36)
        text_font = ImageFont.truetype("arial.ttf", 26)
    except:
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
    
    # Create a PAN-like document
    draw.rectangle([0, 0, 850, 100], fill='#1E3A8A')
    draw.text((300, 30), "INCOME TAX DEPARTMENT", fill='white', font=title_font)
    
    draw.rectangle([50, 200, 800, 270], outline='#1E3A8A', width=3)
    draw.text((300, 220), "ABCDE1234F", fill='black', font=title_font)
    
    # Add obvious tampering - mismatched text
    draw.text((50, 300), "Name: JOHN DOE", fill='black', font=text_font)
    
    # Simulate edit - different color/font indicating tampering
    draw.rectangle([50, 345, 400, 385], fill='white')  # White box over original
    draw.text((50, 350), "Name: JANE SMITH", fill='red', font=text_font)  # Different color
    
    # Save
    img.save('test_documents/tampered_document.jpg', quality=95)
    print("⚠️  Created: tampered_document.jpg (with simulated tampering)")

def create_company_certificate():
    """Create a sample company incorporation certificate"""
    img = Image.new('RGB', (850, 650), color='#FFF8DC')
    draw = ImageDraw.Draw(img)
    
    try:
        title_font = ImageFont.truetype("arial.ttf", 40)
        text_font = ImageFont.truetype("arial.ttf", 24)
        small_font = ImageFont.truetype("arial.ttf", 18)
    except:
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Decorative border
    draw.rectangle([20, 20, 830, 630], outline='#8B4513', width=8)
    draw.rectangle([30, 30, 820, 620], outline='#8B4513', width=2)
    
    # Title
    draw.text((200, 80), "CERTIFICATE OF INCORPORATION", fill='#8B4513', font=title_font)
    
    # Content
    draw.text((80, 180), "This is to certify that", fill='black', font=text_font)
    
    draw.rectangle([80, 230, 770, 280], outline='black', width=2)
    draw.text((150, 240), "TECH INNOVATIONS PRIVATE LIMITED", fill='black', font=title_font)
    
    draw.text((80, 320), "is incorporated under the Companies Act, 2013", fill='black', font=text_font)
    
    draw.text((80, 380), "Certificate Number: U72900KA2024PTC145678", fill='black', font=text_font)
    draw.text((80, 420), "Date of Incorporation: 15th January 2024", fill='black', font=text_font)
    draw.text((80, 460), "State: Karnataka", fill='black', font=text_font)
    
    draw.text((300, 550), "Registrar of Companies", fill='black', font=text_font)
    draw.text((350, 580), "(Official Seal)", fill='gray', font=small_font)
    
    # Save
    img.save('test_documents/company_certificate.jpg', quality=95)
    print("✅ Created: company_certificate.jpg")

if __name__ == "__main__":
    print("🎨 Creating test documents...\n")
    
    create_sample_pan_card()
    create_sample_aadhaar_card()
    create_sample_gst_certificate()
    create_company_certificate()
    create_tampered_document()
    
    print("\n✅ All test documents created in 'test_documents' folder!")
    print("\n📋 Test Documents Created:")
    print("1. sample_pan_card.jpg - Valid PAN card")
    print("2. sample_aadhaar_card.jpg - Valid Aadhaar card")
    print("3. sample_gst_certificate.jpg - Valid GST certificate")
    print("4. company_certificate.jpg - Company incorporation certificate")
    print("5. tampered_document.jpg - Document with tampering (for testing)")
