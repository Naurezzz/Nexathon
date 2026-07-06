"""
AEGIS-AI: Document Type Classifier Training
Model: ResNet18 CNN (Transfer Learning)
Dataset: Synthetic Document Images (2000 samples)
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os
from datetime import datetime
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import json

# Document classes
DOCUMENT_CLASSES = ['AADHAAR', 'PAN', 'GST', 'CERTIFICATE', 'OTHER']

class SyntheticDocumentGenerator:
    """Generate synthetic document images for training"""
    
    def __init__(self, n_samples_per_class=400):
        self.n_samples_per_class = n_samples_per_class
        self.output_dir = 'synthetic_docs'
        os.makedirs(self.output_dir, exist_ok=True)
        
        for doc_class in DOCUMENT_CLASSES:
            os.makedirs(os.path.join(self.output_dir, doc_class), exist_ok=True)
    
    def generate_aadhaar(self, idx):
        """Generate synthetic Aadhaar card"""
        img = Image.new('RGB', (850, 550), color='white')
        draw = ImageDraw.Draw(img)
        
        # Indian flag colors
        draw.rectangle([0, 0, 850, 30], fill='#FF9933')
        draw.rectangle([0, 30, 850, 60], fill='white')
        draw.rectangle([0, 60, 850, 90], fill='#138808')
        
        try:
            font = ImageFont.truetype("arial.ttf", 36)
            small_font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        draw.text((320, 120), "AADHAAR", fill='#DC143C', font=font)
        draw.text((250, 180), "GOVERNMENT OF INDIA", fill='#000080', font=small_font)
        draw.text((250, 250), f"{np.random.randint(1000,9999)} {np.random.randint(1000,9999)} {np.random.randint(1000,9999)}", fill='black', font=font)
        
        # Add some noise
        for _ in range(20):
            x, y = np.random.randint(100, 750), np.random.randint(300, 500)
            draw.ellipse([x, y, x+5, y+5], fill=(np.random.randint(200, 255), np.random.randint(200, 255), np.random.randint(200, 255)))
        
        filename = os.path.join(self.output_dir, 'AADHAAR', f'aadhaar_{idx}.jpg')
        img.save(filename, quality=85)
        return filename
    
    def generate_pan(self, idx):
        """Generate synthetic PAN card"""
        img = Image.new('RGB', (850, 550), color='#E8F4F8')
        draw = ImageDraw.Draw(img)
        
        draw.rectangle([0, 0, 850, 100], fill='#1E3A8A')
        
        try:
            font = ImageFont.truetype("arial.ttf", 32)
            small_font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        draw.text((200, 30), "INCOME TAX DEPARTMENT", fill='white', font=font)
        draw.text((280, 150), "Permanent Account Number", fill='#1E3A8A', font=small_font)
        
        # Generate random PAN
        pan = f"{chr(65+np.random.randint(0,26))}{chr(65+np.random.randint(0,26))}{chr(65+np.random.randint(0,26))}{chr(65+np.random.randint(0,26))}{chr(65+np.random.randint(0,26))}{np.random.randint(1000,9999)}{chr(65+np.random.randint(0,26))}"
        draw.text((280, 220), pan, fill='black', font=font)
        
        # Add noise
        for _ in range(15):
            x, y = np.random.randint(100, 750), np.random.randint(300, 500)
            draw.ellipse([x, y, x+3, y+3], fill=(np.random.randint(150, 200), np.random.randint(150, 200), np.random.randint(150, 200)))
        
        filename = os.path.join(self.output_dir, 'PAN', f'pan_{idx}.jpg')
        img.save(filename, quality=85)
        return filename
    
    def generate_gst(self, idx):
        """Generate synthetic GST certificate"""
        img = Image.new('RGB', (850, 600), color='white')
        draw = ImageDraw.Draw(img)
        
        draw.rectangle([10, 10, 840, 590], outline='#000080', width=5)
        
        try:
            font = ImageFont.truetype("arial.ttf", 30)
            small_font = ImageFont.truetype("arial.ttf", 22)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        draw.text((180, 50), "GOODS AND SERVICES TAX", fill='#000080', font=font)
        draw.text((250, 100), "REGISTRATION CERTIFICATE", fill='#000080', font=small_font)
        
        gstin = f"29{chr(65+np.random.randint(0,26))}{chr(65+np.random.randint(0,26))}{chr(65+np.random.randint(0,26))}{chr(65+np.random.randint(0,26))}{chr(65+np.random.randint(0,26))}{np.random.randint(1000,9999)}{chr(65+np.random.randint(0,26))}1Z5"
        draw.text((100, 200), f"GSTIN: {gstin}", fill='black', font=font)
        
        # Add noise
        for _ in range(25):
            x, y = np.random.randint(50, 800), np.random.randint(300, 550)
            draw.rectangle([x, y, x+2, y+2], fill=(np.random.randint(180, 220), np.random.randint(180, 220), np.random.randint(180, 220)))
        
        filename = os.path.join(self.output_dir, 'GST', f'gst_{idx}.jpg')
        img.save(filename, quality=85)
        return filename
    
    def generate_certificate(self, idx):
        """Generate synthetic certificate"""
        img = Image.new('RGB', (850, 650), color='#FFF8DC')
        draw = ImageDraw.Draw(img)
        
        draw.rectangle([20, 20, 830, 630], outline='#8B4513', width=8)
        draw.rectangle([30, 30, 820, 620], outline='#8B4513', width=2)
        
        try:
            font = ImageFont.truetype("arial.ttf", 36)
            small_font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        draw.text((150, 80), "CERTIFICATE OF INCORPORATION", fill='#8B4513', font=font)
        draw.text((200, 250), f"COMPANY_{np.random.randint(1000,9999)} PVT LTD", fill='black', font=font)
        draw.text((150, 350), f"Incorporated: {np.random.randint(1,28)}/0{np.random.randint(1,9)}/2024", fill='black', font=small_font)
        
        # Add decorative elements
        for _ in range(10):
            x, y = np.random.randint(50, 800), np.random.randint(400, 600)
            draw.ellipse([x, y, x+8, y+8], fill=(np.random.randint(139, 160), np.random.randint(69, 90), np.random.randint(19, 40)))
        
        filename = os.path.join(self.output_dir, 'CERTIFICATE', f'cert_{idx}.jpg')
        img.save(filename, quality=85)
        return filename
    
    def generate_other(self, idx):
        """Generate other document type"""
        bg_color = (np.random.randint(220, 255), np.random.randint(220, 255), np.random.randint(220, 255))
        img = Image.new('RGB', (850, 600), color=bg_color)
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.truetype("arial.ttf", 28)
        except:
            font = ImageFont.load_default()
        
        draw.text((250, 250), f"Generic Document {idx}", fill='black', font=font)
        draw.text((300, 320), f"Reference: DOC-{np.random.randint(10000,99999)}", fill='black', font=font)
        
        # Random shapes
        for _ in range(30):
            x, y = np.random.randint(50, 800), np.random.randint(50, 550)
            w, h = np.random.randint(5, 15), np.random.randint(5, 15)
            color = (np.random.randint(100, 200), np.random.randint(100, 200), np.random.randint(100, 200))
            draw.rectangle([x, y, x+w, y+h], fill=color)
        
        filename = os.path.join(self.output_dir, 'OTHER', f'other_{idx}.jpg')
        img.save(filename, quality=85)
        return filename
    
    def generate_all(self):
        """Generate complete dataset"""
        print("🎨 Generating synthetic document dataset...")
        print(f"   Creating {self.n_samples_per_class} samples per class")
        
        total = 0
        for doc_class in DOCUMENT_CLASSES:
            print(f"   Generating {doc_class}...", end=' ')
            for i in range(self.n_samples_per_class):
                if doc_class == 'AADHAAR':
                    self.generate_aadhaar(i)
                elif doc_class == 'PAN':
                    self.generate_pan(i)
                elif doc_class == 'GST':
                    self.generate_gst(i)
                elif doc_class == 'CERTIFICATE':
                    self.generate_certificate(i)
                else:
                    self.generate_other(i)
                total += 1
            print("✅")
        
        print(f"\n✅ Generated {total} document images")

class DocumentDataset(Dataset):
    """PyTorch dataset for document images"""
    
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.samples = []
        self.class_to_idx = {cls: idx for idx, cls in enumerate(DOCUMENT_CLASSES)}
        
        for cls in DOCUMENT_CLASSES:
            cls_dir = os.path.join(root_dir, cls)
            if os.path.exists(cls_dir):
                for img_name in os.listdir(cls_dir):
                    if img_name.endswith(('.jpg', '.png')):
                        self.samples.append((os.path.join(cls_dir, img_name), self.class_to_idx[cls]))
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
        
        return image, label

def train_document_classifier():
    """Train CNN document classifier"""
    
    print("="*70)
    print("AEGIS-AI: DOCUMENT CLASSIFIER TRAINING")
    print("="*70)
    print(f"Training started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Generate dataset
    generator = SyntheticDocumentGenerator(n_samples_per_class=400)
    generator.generate_all()
    
    # Data transforms with augmentation
    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Load dataset
    print("\n📊 Loading dataset...")
    dataset = DocumentDataset('synthetic_docs', transform=train_transform)
    
    # Split into train/val
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    # Update val dataset transform
    val_dataset.dataset.transform = val_transform
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=0)
    
    print(f"   Training samples: {train_size}")
    print(f"   Validation samples: {val_size}")
    
    # Load pre-trained ResNet18
    print("\n🤖 Loading ResNet18 model with transfer learning...")
    model = models.resnet18(pretrained=True)
    
    # Freeze early layers (transfer learning)
    for param in list(model.parameters())[:-10]:
        param.requires_grad = False
    
    # Replace final layer
    model.fc = nn.Linear(model.fc.in_features, len(DOCUMENT_CLASSES))
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    print(f"   Device: {device}")
    print(f"   Trainable parameters: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")
    
    # Training setup
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.1)
    
    # Training loop
    num_epochs = 15
    print(f"\n🎓 Training for {num_epochs} epochs...")
    
    history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}
    best_val_acc = 0.0
    
    for epoch in range(num_epochs):
        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()
        
        train_loss /= len(train_loader)
        train_acc = 100. * train_correct / train_total
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
        
        val_loss /= len(val_loader)
        val_acc = 100. * val_correct / val_total
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'document_classifier_best.pth')
        
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        print(f"Epoch {epoch+1}/{num_epochs} | "
              f"Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}%")
        
        scheduler.step()
    
    # Save final model
    torch.save(model.state_dict(), 'document_classifier.pth')
    
    # Save metadata
    metadata = {
        'training_date': datetime.now().isoformat(),
        'model': 'ResNet18',
        'classes': DOCUMENT_CLASSES,
        'num_classes': len(DOCUMENT_CLASSES),
        'train_samples': train_size,
        'val_samples': val_size,
        'best_val_accuracy': best_val_acc,
        'final_val_accuracy': val_acc,
        'epochs': num_epochs,
        'model_version': '1.0'
    }
    
    with open('document_classifier_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Plot training history
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
    
    ax1.plot(history['train_loss'], label='Train Loss', linewidth=2)
    ax1.plot(history['val_loss'], label='Val Loss', linewidth=2)
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('Training and Validation Loss')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    ax2.plot(history['train_acc'], label='Train Accuracy', linewidth=2)
    ax2.plot(history['val_acc'], label='Val Accuracy', linewidth=2)
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Accuracy (%)')
    ax2.set_title('Training and Validation Accuracy')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('document_classifier_training.png', dpi=300, bbox_inches='tight')
    
    print("\n" + "="*70)
    print("🎉 TRAINING COMPLETE!")
    print("="*70)
    print(f"   Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f"   Final Validation Accuracy: {val_acc:.2f}%")
    print("\nSaved files:")
    print("  • document_classifier.pth")
    print("  • document_classifier_best.pth")
    print("  • document_classifier_metadata.json")
    print("  • document_classifier_training.png")
    print(f"  • synthetic_docs/ (2000 training images)")

if __name__ == "__main__":
    train_document_classifier()
