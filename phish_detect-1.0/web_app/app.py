# from flask import Flask, render_template, request
# from src.phish_detection_model import load_model, predict_url

# app = Flask(__name__)
# model = load_model()
# preprocessor = None  # to load the preprocessor if saved separately

# @app.route("/", methods=["GET", "POST"])
# def index():
#     prediction, confidence = None, None
#     if request.method == "POST":
#         url = request.form["url"]
#         prediction, confidence = predict_url(url, model, preprocessor)
#         confidence = round(confidence[0][1] * 100, 2)  # if the 2nd column is phishing probability
    
#     return render_template("index.html", prediction=prediction, confidence=confidence)

# if __name__ == "__main__":
#     app.run(debug=True)

from web_app.routes import app

if __name__ == '__main__':
    app.run(debug=True)

# i did it that this script simply runs the Flask app, delegating routes to web_app/routes.py