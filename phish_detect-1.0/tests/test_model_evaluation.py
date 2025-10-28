import unittest
from src.model_training import train_model
from src.model_evaluation import evaluate_model
from src.data_preprocessing import load_data, split_data
from src.feature_extraction import preprocess_features

class TestModelEvaluation(unittest.TestCase):

    def test_evaluate_model(self):
        features, target = load_data()
        X_train, X_test, y_train, y_test = split_data(features, target)
        X_train_transformed, X_test_transformed = preprocess_features(X_train, X_test)
        
        model = train_model(X_train_transformed, y_train)
        results = evaluate_model(model, X_test_transformed, y_test)
        
        self.assertIn('roc_auc', results)
        self.assertIn('classification_report', results)

if __name__ == "__main__":
    unittest.main()
