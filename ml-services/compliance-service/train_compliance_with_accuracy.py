"""
AEGIS-AI: Compliance Clause Detector Training - WITH REAL ACCURACY METRICS
Model: BERT + Random Forest for Legal Clause Detection
Dataset: Synthetic Contract Clauses (5000+ samples)
Output: Complete accuracy report + confusion matrix
"""

from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, accuracy_score, precision_recall_fscore_support,
    confusion_matrix, roc_auc_score
)
import numpy as np
import pandas as pd
import joblib
import json
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

# Legal clause categories
CLAUSE_TYPES = [
    'Termination', 'Liability', 'Confidentiality', 'Payment', 
    'Intellectual Property', 'Dispute Resolution', 'Force Majeure',
    'Warranty', 'Indemnity', 'Non-Compete', 'Data Protection',
    'Amendment', 'Governing Law', 'Assignment'
]

# Template texts for each clause type
CLAUSE_TEMPLATES = {
    'Termination': [
        "Either party may terminate this agreement with 30 days written notice",
        "The contract can be terminated immediately for material breach",
        "Notice period for termination shall be 60 days",
        "Termination clause specifies conditions for ending the agreement",
        "Party may terminate for convenience with prior notice",
        "Termination without cause requires 90 days advance notice",
        "Immediate termination allowed for breach of confidentiality",
        "Upon termination all obligations cease except payment"
    ],
    'Liability': [
        "Limitation of liability shall not exceed the contract value",
        "Company shall not be liable for indirect or consequential damages",
        "Maximum liability is capped at the fees paid",
        "Neither party liable for damages beyond direct losses",
        "Liability limited to amount paid in preceding 12 months",
        "No liability for loss of profits or revenue",
        "Aggregate liability shall not exceed contract price"
    ],
    'Confidentiality': [
        "All proprietary information must be kept confidential",
        "Confidential information shall not be disclosed to third parties",
        "Trade secrets and confidential data are protected",
        "Confidentiality obligations survive termination",
        "Non-disclosure of sensitive business information required",
        "Confidential information includes technical and business data",
        "Breach of confidentiality results in immediate termination"
    ],
    'Payment': [
        "Payment terms are net 30 days from invoice date",
        "Fees shall be paid monthly in advance",
        "Late payments incur 2% monthly interest",
        "Payment schedule is defined in Exhibit A",
        "Invoices payable within 15 business days",
        "Annual fees payable in quarterly installments",
        "Payment by wire transfer to designated account"
    ],
    'Intellectual Property': [
        "All work product and IP belongs to the company",
        "Intellectual property rights are assigned to client",
        "Ownership of inventions created during employment",
        "IP rights vest upon creation",
        "Patents and copyrights remain with employer",
        "Background IP retained by original owner",
        "License granted for use of proprietary technology"
    ],
    'Dispute Resolution': [
        "Disputes shall be resolved through binding arbitration",
        "Parties agree to mediation before litigation",
        "Arbitration under rules of AAA in specified jurisdiction",
        "Governing law and jurisdiction clause for disputes",
        "Alternative dispute resolution mechanisms apply",
        "Arbitration in Mumbai under Indian Arbitration Act",
        "Disputes subject to exclusive jurisdiction of Delhi courts"
    ],
    'Force Majeure': [
        "Neither party liable for delays due to force majeure events",
        "Acts of God excuse performance obligations",
        "Force majeure includes pandemics, war, natural disasters",
        "Performance suspended during unforeseeable circumstances",
        "Force majeure relief from contractual obligations",
        "Notice required within 48 hours of force majeure event",
        "Contract may terminate if force majeure exceeds 90 days"
    ],
    'Warranty': [
        "Company warrants services will be performed professionally",
        "No warranty beyond what is expressly stated",
        "Limited warranty period of 90 days",
        "Warranty of merchantability and fitness for purpose",
        "Warranties are disclaimed to maximum extent",
        "Express warranties do not include implied warranties",
        "Warranty remedy limited to re-performance of services"
    ],
    'Indemnity': [
        "Party shall indemnify and hold harmless from claims",
        "Indemnification for third-party claims and losses",
        "Mutual indemnity for breach of obligations",
        "Indemnity covers legal fees and damages",
        "Protection against liability arising from negligence",
        "Indemnified party entitled to defense costs",
        "Indemnity survives termination of agreement"
    ],
    'Non-Compete': [
        "Employee shall not compete for 12 months post-termination",
        "Non-compete restrictions in specified geographical area",
        "No solicitation of clients or employees",
        "Restriction on competitive activities during and after employment",
        "Non-compete covenant enforceable for reasonable period",
        "Non-compete applies within 50 mile radius",
        "Breach of non-compete results in injunctive relief"
    ],
    'Data Protection': [
        "Personal data processed in compliance with GDPR",
        "Data protection obligations under applicable privacy laws",
        "Security measures to protect sensitive information",
        "Data breach notification requirements",
        "Compliance with IT Act 2000 and data privacy regulations",
        "Data subject rights honored per privacy regulations",
        "Cross-border data transfers comply with applicable law"
    ],
    'Amendment': [
        "Agreement may be amended only in writing signed by both parties",
        "Modifications require mutual written consent",
        "No oral amendments are valid",
        "Changes to contract terms documented in writing",
        "Amendment process requires approval of authorized representatives",
        "Amendments effective upon execution by both parties",
        "Email amendments not binding unless digitally signed"
    ],
    'Governing Law': [
        "Agreement governed by laws of specified jurisdiction",
        "Courts of designated state have exclusive jurisdiction",
        "Indian law governs this contract",
        "Applicable law and venue for legal proceedings",
        "Jurisdiction clause specifies competent courts",
        "Laws of Maharashtra govern without regard to conflicts",
        "Parties submit to jurisdiction of courts in Mumbai"
    ],
    'Assignment': [
        "Agreement may not be assigned without written consent",
        "Rights and obligations are not transferable",
        "Assignment permitted with prior approval",
        "Contract binds successors and assigns",
        "No assignment to third parties without consent",
        "Assignment rights limited to mergers and acquisitions",
        "Consent to assignment not unreasonably withheld"
    ]
}


def generate_training_data(samples_per_class=400):
    """Generate realistic synthetic training data for clause detection"""
    
    print("🔧 Generating synthetic contract clause dataset...")
    
    data = []
    
    for clause_type, templates in CLAUSE_TEMPLATES.items():
        for _ in range(samples_per_class):
            # Select random template
            template = np.random.choice(templates)
            
            # Add realistic variations
            variations = [
                template,
                template.replace("shall", "will"),
                template.replace("may", "can"),
                template.replace("must", "shall"),
                template.upper(),
                template.lower(),
                f"The parties agree that {template.lower()}",
                f"It is understood that {template.lower()}",
                f"Notwithstanding anything to the contrary, {template.lower()}",
                f"Subject to the terms herein, {template.lower()}",
                f"For the avoidance of doubt, {template.lower()}"
            ]
            
            text = np.random.choice(variations)
            
            # Add noise for robustness (30% chance)
            if np.random.random() < 0.3:
                words = text.split()
                if len(words) > 5:
                    # Random perturbations
                    if np.random.random() < 0.5:
                        # Remove random word
                        idx = np.random.randint(0, len(words))
                        words.pop(idx)
                    else:
                        # Swap two words
                        if len(words) > 3:
                            idx1, idx2 = np.random.choice(len(words), 2, replace=False)
                            words[idx1], words[idx2] = words[idx2], words[idx1]
                    text = " ".join(words)
            
            # Add punctuation variations
            if np.random.random() < 0.2:
                text = text.replace(".", ";")
            
            data.append({
                'text': text,
                'clause_type': clause_type,
                'label': CLAUSE_TYPES.index(clause_type)
            })
    
    df = pd.DataFrame(data)
    print(f"✅ Generated {len(df)} training samples")
    print(f"   Classes: {len(CLAUSE_TYPES)}")
    print(f"   Samples per class: ~{len(df) // len(CLAUSE_TYPES)}")
    
    return df


def train_compliance_model():
    """Train BERT-based compliance clause detector with full metrics"""
    
    print("="*80)
    print("🏛️  AEGIS-AI: COMPLIANCE CLAUSE DETECTOR TRAINING")
    print("="*80)
    print(f"Training started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Generate dataset
    df = generate_training_data(samples_per_class=400)
    
    # Save dataset
    df.to_csv('compliance_training_dataset.csv', index=False)
    print(f"✅ Saved dataset: compliance_training_dataset.csv\n")
    
    # Load pre-trained BERT model for embeddings
    print("🤖 Loading BERT model (sentence-transformers)...")
    bert_model = SentenceTransformer('all-MiniLM-L6-v2')  # Lightweight BERT
    print("✅ BERT model loaded\n")
    
    # Generate embeddings
    print("🔢 Generating BERT embeddings (this may take 1-2 minutes)...")
    X = bert_model.encode(df['text'].tolist(), show_progress_bar=True, batch_size=32)
    y = df['label'].values
    
    print(f"✅ Embedding shape: {X.shape}")
    print(f"   Features per sample: {X.shape[1]}\n")
    
    # Train-test split (stratified to maintain class balance)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print("📊 Dataset split:")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Test samples: {len(X_test)}")
    print(f"   Train/Test ratio: {len(X_train)/len(X_test):.1f}:1\n")
    
    # Train classifier on BERT embeddings
    print("🎓 Training Random Forest classifier...")
    classifier = RandomForestClassifier(
        n_estimators=200,
        max_depth=20,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1,
        verbose=0
    )
    
    classifier.fit(X_train, y_train)
    print("✅ Training complete\n")
    
    # Evaluate
    print("📊 Evaluating model performance...\n")
    y_pred = classifier.predict(X_test)
    y_pred_proba = classifier.predict_proba(X_test)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, y_pred, average='weighted', zero_division=0
    )
    
    # Per-class metrics
    per_class_report = classification_report(
        y_test, y_pred,
        target_names=CLAUSE_TYPES,
        zero_division=0,
        output_dict=True
    )
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    
    # Print results
    print("="*80)
    print("📈 MODEL PERFORMANCE METRICS")
    print("="*80)
    print(f"\n🎯 OVERALL METRICS:")
    print(f"   ✅ Accuracy:  {accuracy*100:.2f}%")
    print(f"   ✅ Precision: {precision*100:.2f}%")
    print(f"   ✅ Recall:    {recall*100:.2f}%")
    print(f"   ✅ F1-Score:  {f1*100:.2f}%")
    
    print(f"\n📊 PER-CLASS PERFORMANCE:\n")
    print(classification_report(
        y_test, y_pred,
        target_names=CLAUSE_TYPES,
        zero_division=0
    ))
    
    # Top and bottom performing classes
    class_accuracies = {}
    for i, clause_type in enumerate(CLAUSE_TYPES):
        mask = (y_test == i)
        if mask.sum() > 0:
            class_acc = (y_pred[mask] == i).sum() / mask.sum()
            class_accuracies[clause_type] = class_acc
    
    sorted_classes = sorted(class_accuracies.items(), key=lambda x: x[1], reverse=True)
    
    print("\n🏆 TOP 3 PERFORMING CLAUSE TYPES:")
    for i, (clause, acc) in enumerate(sorted_classes[:3], 1):
        print(f"   {i}. {clause}: {acc*100:.1f}%")
    
    print("\n⚠️  BOTTOM 3 PERFORMING CLAUSE TYPES:")
    for i, (clause, acc) in enumerate(sorted_classes[-3:], 1):
        print(f"   {i}. {clause}: {acc*100:.1f}%")
    
    # Confusion matrix analysis
    print(f"\n📊 CONFUSION MATRIX SUMMARY:")
    correct_predictions = np.diag(cm).sum()
    total_predictions = cm.sum()
    print(f"   Correct classifications: {correct_predictions}/{total_predictions}")
    print(f"   Misclassifications: {total_predictions - correct_predictions}")
    
    # Save models
    print("\n" + "="*80)
    print("💾 SAVING TRAINED MODELS")
    print("="*80)
    
    # Model configuration with ALL metrics
    model_config = {
        'bert_model_name': 'all-MiniLM-L6-v2',
        'clause_types': CLAUSE_TYPES,
        'n_classes': len(CLAUSE_TYPES),
        'n_features': X.shape[1],
        'training_date': datetime.now().isoformat(),
        'training_samples': len(df),
        'test_samples': len(X_test),
        'model_version': '1.0',
        'metrics': {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'per_class_metrics': {
                clause: {
                    'precision': float(per_class_report[clause]['precision']),
                    'recall': float(per_class_report[clause]['recall']),
                    'f1-score': float(per_class_report[clause]['f1-score']),
                    'support': int(per_class_report[clause]['support'])
                }
                for clause in CLAUSE_TYPES
            }
        },
        'classifier_params': {
            'n_estimators': 200,
            'max_depth': 20,
            'min_samples_split': 5
        }
    }
    
    with open('compliance_model_config.json', 'w') as f:
        json.dump(model_config, f, indent=2)
    print("✅ compliance_model_config.json")
    
    # Save classifier
    joblib.dump(classifier, 'compliance_classifier.pkl')
    print("✅ compliance_classifier.pkl")
    
    joblib.dump(CLAUSE_TYPES, 'clause_types.pkl')
    print("✅ clause_types.pkl")
    
    # Save confusion matrix
    np.save('confusion_matrix.npy', cm)
    print("✅ confusion_matrix.npy")
    
    print("\n" + "="*80)
    print("🎉 TRAINING COMPLETE!")
    print("="*80)
    print(f"\n✅ Compliance Clause Detector trained successfully!")
    print(f"✅ Achieves {accuracy*100:.2f}% accuracy on {len(CLAUSE_TYPES)} clause types")
    print(f"✅ Precision: {precision*100:.2f}% | Recall: {recall*100:.2f}% | F1: {f1*100:.2f}%")
    print(f"✅ Model ready for deployment in compliance service!")
    
    print("\n📁 Saved Files:")
    print("   • compliance_classifier.pkl")
    print("   • clause_types.pkl")
    print("   • compliance_model_config.json")
    print("   • compliance_training_dataset.csv")
    print("   • confusion_matrix.npy")
    
    print("\n📌 Next Steps:")
    print("   1. Check metrics: cat compliance_model_config.json")
    print("   2. Test model: python test_compliance.py")
    print("   3. Deploy: Use in compliance service API")
    
    print("\n" + "="*80 + "\n")
    
    return accuracy, model_config


if __name__ == "__main__":
    accuracy, config = train_compliance_model()
