import pandas as pd
from sklearn.model_selection import train_test_split

def load_data():
    # Load the phishIIL dataset
    data = pd.read_csv('data/phishIIL.csv')
    
    # Drop FILENAME column (not useful for training)
    features = data.drop(columns=['FILENAME'])
    
    # Extract target (label) and encode it
    # In phishIIL, label=1 means phishing, label=0 means legitimate
    target = features['label']
    features = features.drop(columns=['label'])
    
    # Also save URLs for potential URL-based feature extraction later
    urls = data['URL'] if 'URL' in data.columns else data.get('url', None)
    
    return features, target, urls

def split_data(features, target, urls=None):
    """Split data into train and test sets"""
    if urls is not None:
        return train_test_split(features, target, urls, test_size=0.2, random_state=42)
    else:
        return train_test_split(features, target, test_size=0.2, random_state=42)

# the plan now on this script is to load phishing and legit url data. then label the phishing data as 1 and legit as 0. then split the data into training and test sets.

