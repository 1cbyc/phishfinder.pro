# from flask import Flask, render_template, request, redirect, url_for
from flask import Flask, render_template, request
import joblib
from src.phish_detection_model import predict_url

app = Flask(__name__)
model = joblib.load('src/phish_detection_model.pkl')
preprocessor = None  # i made it load the preprocessor here if it was saved separately

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/detect', methods=['POST'])
def detect():
    url = request.form.get('url')
    # prediction = model.predict([url])[0]
    prediction, confidence = predict_url(url, model, preprocessor)
    confidence_percentage = round(confidence[0][1] * 100, 2)  # that is if phishing probability in 2nd column
    result = "Phishing" if prediction == 1 else "Legitimate"

    # return render_template('result.html', url=url, result=result)
    return render_template('result.html', url=url, result=result, confidence=confidence_percentage)

if __name__ == '__main__':
    app.run(debug=True)

# i did it in a way that this script handles routing, prediction, and rendering of both the main form and result pages.