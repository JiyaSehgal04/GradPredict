import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'backend')
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')

pipeline = joblib.load(MODEL_PATH)

app = Flask(__name__)
CORS(app)

FEATURE_ORDER = ['gre', 'toefl', 'rating', 'sop', 'lor', 'gpa', 'research']

RANGES = {
    'gre':      (260, 340),
    'toefl':    (0,   120),
    'rating':   (1,   5),
    'sop':      (1.0, 5.0),
    'lor':      (1.0, 5.0),
    'gpa':      (0.0, 10.0),
    'research': (0,   1),
}


def validate(data):
    errors = {}
    for field, (lo, hi) in RANGES.items():
        val = data.get(field)
        if val is None:
            errors[field] = 'required'
        else:
            try:
                val = float(val)
                if not (lo <= val <= hi):
                    errors[field] = f'must be between {lo} and {hi}'
            except (TypeError, ValueError):
                errors[field] = 'must be a number'
    return errors


@app.route('/predict', methods=['POST'])
def predict():
    body = request.get_json(force=True, silent=True) or {}
    errors = validate(body)
    if errors:
        return jsonify({'error': 'validation failed', 'fields': errors}), 400

    features = pd.DataFrame([{f: float(body[f]) for f in FEATURE_ORDER}])
    raw = float(pipeline.predict(features)[0])
    probability = round(max(5.0, min(99.0, raw * 100)), 1)

    admitted = probability >= 83
    if probability >= 85:
        risk = 'Low'
    elif probability >= 65:
        risk = 'Medium'
    else:
        risk = 'High'

    return jsonify({
        'probability': probability,
        'admitted': admitted,
        'risk': risk,
        'raw_chance': round(raw, 4),
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'RandomForestRegressor'})
