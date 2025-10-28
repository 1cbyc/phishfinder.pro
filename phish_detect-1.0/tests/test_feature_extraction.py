import unittest
from src.feature_extraction import preprocess_features
from src.data_preprocessing import load_data, split_data

class TestFeatureExtraction(unittest.TestCase):

    def test_preprocess_features(self):
        features, target = load_data()
        X_train, X_test, _, _ = split_data(features, target)
        X_train_transformed, X_test_transformed = preprocess_features(X_train, X_test)
        
        self.assertEqual(X_train_transformed.shape[1], X_test_transformed.shape[1])

if __name__ == "__main__":
    unittest.main()
