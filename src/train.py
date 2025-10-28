"""
Complete training script for phishing detection model
"""
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix
import numpy as np

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_preprocessing import load_data, split_data
from feature_engineering import preprocess_features

def train_model():
    """Complete training pipeline"""
    print("=" * 60)
    print("PHISHING DETECTION MODEL TRAINING")
    print("=" * 60)
    
    # Load data
    print("\n[1/5] Loading data...")
    try:
        features, target, urls = load_data()
        print(f"✓ Loaded {len(features)} samples")
        print(f"  - Phishing: {target.sum()} ({target.mean()*100:.1f}%)")
        print(f"  - Legitimate: {(1-target).sum()} ({(1-target).mean()*100:.1f}%)")
    except Exception as e:
        print(f"✗ Error loading data: {e}")
        return
    
    # Split data
    print("\n[2/5] Splitting data...")
    try:
        X_train, X_test, y_train, y_test = split_data(features, target)
        print(f"✓ Train set: {len(X_train)} samples")
        print(f"✓ Test set: {len(X_test)} samples")
    except Exception as e:
        print(f"✗ Error splitting data: {e}")
        return
    
    # Preprocess features
    print("\n[3/5] Preprocessing features...")
    try:
        X_train_processed, X_test_processed, label_encoders = preprocess_features(X_train, X_test)
        print(f"✓ Features processed")
        print(f"  - Feature count: {X_train_processed.shape[1]}")
    except Exception as e:
        print(f"✗ Error preprocessing: {e}")
        return
    
    # Train model
    print("\n[4/5] Training model...")
    try:
        # Using Random Forest for better performance
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1
        )
        
        print("  Training Random Forest...")
        model.fit(X_train_processed, y_train)
        print("✓ Model trained successfully")
        
        # Save model and label encoders
        joblib.dump(model, 'src/phish_detection_model.pkl')
        joblib.dump(label_encoders, 'src/label_encoders.pkl')
        print("✓ Model saved to src/phish_detection_model.pkl")
        print("✓ Label encoders saved to src/label_encoders.pkl")
        
    except Exception as e:
        print(f"✗ Error training model: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Evaluate model
    print("\n[5/5] Evaluating model...")
    try:
        y_pred = model.predict(X_test_processed)
        y_proba = model.predict_proba(X_test_processed)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        print(f"\n{'=' * 60}")
        print("MODEL PERFORMANCE METRICS")
        print(f"{'=' * 60}")
        print(f"Accuracy:  {accuracy * 100:.2f}%")
        print(f"Precision: {precision * 100:.2f}%")
        print(f"Recall:    {recall * 100:.2f}%")
        print(f"F1 Score:  {f1 * 100:.2f}%")
        print(f"\n{'=' * 60}")
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred)
        print("\nConfusion Matrix:")
        print(cm)
        print(f"\n  True Negatives (Legitimate): {cm[0][0]}")
        print(f"  False Positives:            {cm[0][1]}")
        print(f"  False Negatives:            {cm[1][0]}")
        print(f"  True Positives (Phishing):  {cm[1][1]}")
        
        # Classification report
        print(f"\n{'=' * 60}")
        print("Classification Report:")
        print(f"{'=' * 60}")
        print(classification_report(y_test, y_pred, target_names=['Legitimate', 'Phishing']))
        print(f"{'=' * 60}\n")
        
    except Exception as e:
        print(f"✗ Error evaluating model: {e}")
        import traceback
        traceback.print_exc()
        return
    
    print("Training completed successfully! ✓")

if __name__ == "__main__":
    train_model()
