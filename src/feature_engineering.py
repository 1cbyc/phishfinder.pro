from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import pandas as pd
import numpy as np

def preprocess_features(X_train, X_test):
    """Preprocess features by handling missing values and scaling"""
    # Create copies to avoid warnings
    X_train = X_train.copy()
    X_test = X_test.copy()
    
    # Handle missing values with median for numeric columns
    numeric_features = X_train.select_dtypes(include=[np.number]).columns
    for col in numeric_features:
        median_val = X_train[col].median()
        X_train[col].fillna(median_val, inplace=True)
        X_test[col].fillna(median_val, inplace=True)
    
    # Handle categorical columns (fill with 'unknown')
    categorical_features = X_train.select_dtypes(include=['object']).columns
    for col in categorical_features:
        X_train[col].fillna('unknown', inplace=True)
        X_test[col].fillna('unknown', inplace=True)
    
    # Encode categorical features
    label_encoders = {}
    for col in categorical_features:
        le = LabelEncoder()
        X_train[col] = le.fit_transform(X_train[col].astype(str))
        # Handle unseen categories in test set
        test_categories = X_test[col].astype(str)
        known_categories = set(le.classes_)
        test_categories = test_categories.apply(lambda x: x if x in known_categories else 'unknown')
        try:
            X_test[col] = le.transform(test_categories)
        except:
            # If 'unknown' is not in classes, add it
            le.classes_ = np.append(le.classes_, 'unknown')
            X_test[col] = le.transform(test_categories)
        label_encoders[col] = le
    
    # Scale numeric features
    scaler = StandardScaler()
    X_train[numeric_features] = scaler.fit_transform(X_train[numeric_features])
    X_test[numeric_features] = scaler.transform(X_test[numeric_features])
    
    return X_train, X_test, label_encoders

# what i did here is to ensure all categorical features are encoded and normalize or scale numerical features if necessary.