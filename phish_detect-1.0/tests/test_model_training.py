from src.data_preprocessing import load_data, split_data
from src.feature_extraction import extract_features
from src.model_training import train_model, evaluate_model

def test_model():
    data = load_data()
    X_train, X_test, y_train, y_test = split_data(data)
    X_train_tfidf, X_test_tfidf = extract_features(X_train, X_test)
    
    model = train_model(X_train_tfidf, y_train)
    results = evaluate_model(model, X_test_tfidf, y_test)
    
    assert results['accuracy'] > 0.7, "Model accuracy is below threshold!"
    print("Test passed! Model metrics:", results)


# trying to run the test this way
if __name__ == "__main__":
    test_model()
