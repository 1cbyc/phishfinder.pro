import unittest
from src.data_preprocessing import load_data, split_data

class TestDataPreprocessing(unittest.TestCase):

    def test_load_data(self):
        features, target = load_data()
        self.assertIsNotNone(features)
        self.assertIsNotNone(target)

    def test_split_data(self):
        features, target = load_data()
        X_train, X_test, y_train, y_test = split_data(features, target)
        self.assertEqual(len(X_train) + len(X_test), len(features))
        self.assertEqual(len(y_train) + len(y_test), len(target))

if __name__ == "__main__":
    unittest.main()
