import joblib

def load_model():
    return joblib.load('src/phish_detection_model.pkl')

def predict_url(url, model, preprocessor):
    # Transform the URL into features
    url_features = preprocess_single_url(url)
    url_transformed = preprocessor.transform([url_features])
    return model.predict(url_transformed), model.predict_proba(url_transformed)
