"""
Train a Random Forest Regressor on the Graduate Admissions dataset and save it.
Uses a sklearn Pipeline (no scaling needed — RF is tree-based).
Run once: python3 train_model.py
"""
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

CSV_PATH = "/Users/jiyasehgal/GradPredict_EDA/Graduate-Admission-Prediction/Admission_Predict_Ver1.1.csv"

df = pd.read_csv(CSV_PATH)
df = df.rename(columns={
    'Serial No.': 'no', 'GRE Score': 'gre', 'TOEFL Score': 'toefl',
    'University Rating': 'rating', 'SOP': 'sop', 'LOR ': 'lor',
    'CGPA': 'gpa', 'Research': 'research', 'Chance of Admit ': 'chance'
})
df.drop(['no'], axis=1, inplace=True)

FEATURES = ['gre', 'toefl', 'rating', 'sop', 'lor', 'gpa', 'research']
X = df[FEATURES]
y = df['chance']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)

pipeline = Pipeline([
    ('rf', RandomForestRegressor(n_estimators=300, max_features='sqrt', random_state=0))
])
pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)
print(f"RMSE: {rmse:.4f}  |  R²: {r2:.4f}")

model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
joblib.dump(pipeline, model_path)
print(f"Saved pipeline → {model_path}")
