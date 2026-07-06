"""
AEGIS-AI: Business Document Forgery Detection
Training on Real Receipt/Invoice Forgery Dataset
Model: ResNet50 + Tampering Detection CNN
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
import numpy as np
import os
import json
from pathlib import Path
from datetime import datetime
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import seaborn as sns
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# New document classes (business documents only)
DOCUMENT_CLASSES = {
    'INVOICE': 0,
    'RECEIPT': 1,
    'CONTRACT': 2,
    'STATEMENT': 3,
    'CERTIFICATE': 4
}

# Forgery detection labels
FORGERY_LABELS = {
    'AUTHENTIC': 0,
    'FORGED': 1
}

class BusinessDocumentDataset(Dataset):
    """Dataset for real business document images with forgery labels"""
    
    def __init__(self, root_dir, transform=None, mode='train'):
        self.root_dir = root_dir
        self.transform = transform
        self.mode = mode
        self.samples = []
        
        # Load annotations
        self._load_annotations()
    
    def _load_annotations(self):
        """Load document annotations with forgery labels"""
        annotations_file = os.path.join(self.root_dir, 'annotations.json')
        
        if os.path.exists(annotations_file):
            with open(annotations_file, 'r') as f:
                data = json.load(f)
                self.samples = data.get(self.mode, [])
        else:
            logger.warning(f"Annotations file not found: {annotations_file}")
            # Fallback: load all images from directories
            self._load_from_directories()
    
    def _load_from_directories(self):
        """Fallback: load from directory structure"""
        for doc_type, label in DOCUMENT_CLASSES.items():
            doc_dir = os.path.join(self.root_dir, self.mode, doc_type.lower())
            if os.path.exists(doc_dir):
                for img_file in os.listdir(doc_dir):
                    if img_file.endswith(('.jpg', '.jpeg', '.png')):
                        # Determine if forged based on filename or subdirectory
                        is_forged = 'forged' in img_file.lower() or 'fake' in img_file.lower()
                        
                        self.samples.append({
                            'image_path': os.path.join(doc_dir, img_file),
                            'doc_type': label,
                            'is_forged': 1 if is_forged else 0
                        })
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        sample = self.samples[idx]
        
        # Load image
        image = Image.open(sample['image_path']).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
        
        return {
            'image': image,
            'doc_type': torch.tensor(sample['doc_type'], dtype=torch.long),
            'is_forged': torch.tensor(sample['is_forged'], dtype=torch.long)
        }

class DocumentForgeryDetector(nn.Module):
    """
    Dual-Task CNN:
    1. Document Type Classification (5 classes)
    2. Forgery Detection (Binary)
    """
    
    def __init__(self, num_doc_classes=5, pretrained=True):
        super().__init__()
        
        # Backbone: ResNet50 (pre-trained on ImageNet)
        self.backbone = models.resnet50(pretrained=pretrained)
        
        # Remove final FC layer
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Identity()
        
        # Document type classifier head
        self.doc_classifier = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_doc_classes)
        )
        
        # Forgery detector head
        self.forgery_detector = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 2)  # Binary: authentic vs forged
        )
    
    def forward(self, x):
        # Extract features
        features = self.backbone(x)
        
        # Dual outputs
        doc_type = self.doc_classifier(features)
        forgery = self.forgery_detector(features)
        
        return doc_type, forgery

def prepare_transforms():
    """Image preprocessing and augmentation"""
    
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.3),
        transforms.RandomRotation(5),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_transform

def train_epoch(model, dataloader, criterion_doc, criterion_forgery, optimizer, device):
    """Train for one epoch"""
    model.train()
    
    running_loss = 0.0
    correct_doc = 0
    correct_forgery = 0
    total = 0
    
    for batch in dataloader:
        images = batch['image'].to(device)
        doc_labels = batch['doc_type'].to(device)
        forgery_labels = batch['is_forged'].to(device)
        
        optimizer.zero_grad()
        
        # Forward pass
        doc_out, forgery_out = model(images)
        
        # Calculate losses
        loss_doc = criterion_doc(doc_out, doc_labels)
        loss_forgery = criterion_forgery(forgery_out, forgery_labels)
        
        # Combined loss (weighted)
        loss = 0.4 * loss_doc + 0.6 * loss_forgery  # Prioritize forgery detection
        
        # Backward pass
        loss.backward()
        optimizer.step()
        
        # Statistics
        running_loss += loss.item()
        
        _, pred_doc = torch.max(doc_out, 1)
        _, pred_forgery = torch.max(forgery_out, 1)
        
        correct_doc += (pred_doc == doc_labels).sum().item()
        correct_forgery += (pred_forgery == forgery_labels).sum().item()
        total += images.size(0)
    
    epoch_loss = running_loss / len(dataloader)
    doc_acc = 100 * correct_doc / total
    forgery_acc = 100 * correct_forgery / total
    
    return epoch_loss, doc_acc, forgery_acc

def validate(model, dataloader, criterion_doc, criterion_forgery, device):
    """Validation step"""
    model.eval()
    
    running_loss = 0.0
    correct_doc = 0
    correct_forgery = 0
    total = 0
    
    all_forgery_preds = []
    all_forgery_labels = []
    
    with torch.no_grad():
        for batch in dataloader:
            images = batch['image'].to(device)
            doc_labels = batch['doc_type'].to(device)
            forgery_labels = batch['is_forged'].to(device)
            
            doc_out, forgery_out = model(images)
            
            loss_doc = criterion_doc(doc_out, doc_labels)
            loss_forgery = criterion_forgery(forgery_out, forgery_labels)
            loss = 0.4 * loss_doc + 0.6 * loss_forgery
            
            running_loss += loss.item()
            
            _, pred_doc = torch.max(doc_out, 1)
            _, pred_forgery = torch.max(forgery_out, 1)
            
            correct_doc += (pred_doc == doc_labels).sum().item()
            correct_forgery += (pred_forgery == forgery_labels).sum().item()
            total += images.size(0)
            
            # Store for ROC-AUC
            forgery_probs = torch.softmax(forgery_out, dim=1)[:, 1]
            all_forgery_preds.extend(forgery_probs.cpu().numpy())
            all_forgery_labels.extend(forgery_labels.cpu().numpy())
    
    val_loss = running_loss / len(dataloader)
    doc_acc = 100 * correct_doc / total
    forgery_acc = 100 * correct_forgery / total
    
    # Calculate ROC-AUC for forgery detection
    roc_auc = roc_auc_score(all_forgery_labels, all_forgery_preds)
    
    return val_loss, doc_acc, forgery_acc, roc_auc

def main():
    logger.info("=" * 70)
    logger.info("AEGIS-AI: BUSINESS DOCUMENT FORGERY DETECTION TRAINING")
    logger.info("Real Dataset | ResNet50 + Dual-Task Learning")
    logger.info("=" * 70 + "\n")
    
    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {device}")
    
    # Hyperparameters
    batch_size = 16
    num_epochs = 25
    learning_rate = 0.0001
    
    # Transforms
    train_transform, val_transform = prepare_transforms()
    
    # Check if data exists
    data_dir = 'data/processed'
    if not os.path.exists(data_dir):
        logger.error(f"❌ Data directory not found: {data_dir}")
        logger.info("Run: python data/prepare_dataset.py first")
        return
    
    # Datasets
    train_dataset = BusinessDocumentDataset(data_dir, transform=train_transform, mode='train')
    val_dataset = BusinessDocumentDataset(data_dir, transform=val_transform, mode='val')
    
    logger.info(f"\nDataset Statistics:")
    logger.info(f"  Training samples: {len(train_dataset)}")
    logger.info(f"  Validation samples: {len(val_dataset)}")
    
    if len(train_dataset) == 0:
        logger.error("❌ No training data found!")
        logger.info("Ensure data/processed/train/ contains document images")
        return
    
    # DataLoaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)
    
    # Model
    model = DocumentForgeryDetector(num_doc_classes=len(DOCUMENT_CLASSES), pretrained=False)
    model = model.to(device)
    
    # Loss functions
    criterion_doc = nn.CrossEntropyLoss()
    criterion_forgery = nn.CrossEntropyLoss()
    
    # Optimizer
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=3, factor=0.5)
    
    # Training loop
    best_forgery_acc = 0.0
    history = {'train_loss': [], 'val_loss': [], 'forgery_acc': [], 'roc_auc': []}
    
    logger.info("\n" + "=" * 70)
    logger.info("STARTING TRAINING")
    logger.info("=" * 70 + "\n")
    
    for epoch in range(num_epochs):
        logger.info(f"Epoch [{epoch+1}/{num_epochs}]")
        
        # Train
        train_loss, train_doc_acc, train_forgery_acc = train_epoch(
            model, train_loader, criterion_doc, criterion_forgery, optimizer, device
        )
        
        # Validate
        val_loss, val_doc_acc, val_forgery_acc, roc_auc = validate(
            model, val_loader, criterion_doc, criterion_forgery, device
        )
        
        # Scheduler step
        scheduler.step(val_loss)
        
        # Log metrics
        logger.info(f"  Train Loss: {train_loss:.4f} | Doc Acc: {train_doc_acc:.2f}% | Forgery Acc: {train_forgery_acc:.2f}%")
        logger.info(f"  Val Loss: {val_loss:.4f} | Doc Acc: {val_doc_acc:.2f}% | Forgery Acc: {val_forgery_acc:.2f}% | ROC-AUC: {roc_auc:.4f}\n")
        
        # Save history
        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['forgery_acc'].append(val_forgery_acc)
        history['roc_auc'].append(roc_auc)
        
        # Save best model
        if val_forgery_acc > best_forgery_acc:
            best_forgery_acc = val_forgery_acc
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'forgery_acc': val_forgery_acc,
                'roc_auc': roc_auc,
                'doc_classes': DOCUMENT_CLASSES,
                'forgery_labels': FORGERY_LABELS
            }, 'document_forgery_detector_best.pth')
            logger.info(f"✅ Saved best model (Forgery Acc: {val_forgery_acc:.2f}%)")
    
    # Save final model
    torch.save(model.state_dict(), 'document_forgery_detector_final.pth')
    
    # Save training history
    with open('training_history.json', 'w') as f:
        json.dump(history, f, indent=2)
    
    logger.info("\n" + "=" * 70)
    logger.info("TRAINING COMPLETE!")
    logger.info("=" * 70)
    logger.info(f"Best Forgery Detection Accuracy: {best_forgery_acc:.2f}%")
    logger.info(f"Final ROC-AUC: {history['roc_auc'][-1]:.4f}")
    logger.info("\nSaved artifacts:")
    logger.info("  • document_forgery_detector_best.pth")
    logger.info("  • document_forgery_detector_final.pth")
    logger.info("  • training_history.json")
    logger.info("=" * 70 + "\n")

if __name__ == "__main__":
    main()
