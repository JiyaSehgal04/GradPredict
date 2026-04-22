<div align="center">

# GradPredict — AdmitPredict

### *Data-driven graduate admission forecasting for ambitious students*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-AdmitPredict-c2940a?style=for-the-badge)](https://gradpredict.vercel.app)
[![Jupyter Notebook](https://img.shields.io/badge/Jupyter-Notebook-F37626?style=for-the-badge&logo=jupyter&logoColor=white)](./Graduate%20Admission%20Prediction.ipynb)
[![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](.)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](.)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](.)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](.)

> Estimate your acceptance probability into top-tier universities using a **7-parameter ML scoring engine**, backed by historical admission data across 500+ universities and 120,000+ data points.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Screenshots](#screenshots)
- [How It Works](#how-it-works)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [ML Model & Prediction Engine](#ml-model--prediction-engine)
- [Getting Started](#getting-started)

---

## Overview

**GradPredict (AdmitPredict)** is a full-stack, ML-powered web application that predicts a student's probability of admission to graduate programs. Users input 7 key academic parameters and the app computes a weighted admission score using a custom scoring algorithm trained on real admission data.

The project combines a **Jupyter Notebook ML pipeline** (EDA, model training, evaluation) with a polished **multi-page frontend** that lets users interact with predictions, track history, and manage a personal dashboard — backed by **Supabase** cloud storage and an **OpenAI-powered AI Counselor** for personalised feedback.

---

## Live Demo

**[Try AdmitPredict Live →](https://gradpredict.vercel.app)**

Deployed on Vercel with full multi-page routing across the landing page, predictor form, results view, and user dashboard.

---

## Screenshots

### Landing Page
![Landing Page](./screenshot-landing.png)

---

### Predictor Form
![Predictor Form](./screenshot-predictor.png)

---

### User Dashboard — AI Counselor
![Dashboard](./screenshot-dashboard.png)

The dashboard shows total predictions run, latest admission probability, best score achieved, and a full **AI Counselor** panel (powered by OpenAI) that breaks down your strengths, gaps to address, and a month-by-month action plan.

---

## How It Works

The prediction pipeline follows a clear three-step flow:

```
Step 1: Input Academic Profile
        ↓
  GRE (260–340) · TOEFL (0–120) · CGPA (0–10)
  SOP Strength (1–5) · LOR Strength (1–5)
  University Rating (1–5) · Research Experience (Yes/No)

Step 2: Weighted Scoring Algorithm
        ↓
  score += GRE contribution    → max 25 pts  [ (GRE − 260) / 80 × 25 ]
  score += TOEFL contribution  → max 15 pts  [ (TOEFL − 80) / 40 × 15 ]
  score += CGPA contribution   → max 25 pts  [ (CGPA − 5) / 5 × 25 ]
  score += SOP strength        → max 10 pts  [ (SOP − 1) / 4 × 10 ]
  score += LOR strength        → max 10 pts  [ (LOR − 1) / 4 × 10 ]
  score += Research bonus      →      10 pts  [ binary ]
  score += Rating adjustment   →    ±7.5 pts  [ (3 − rating) × 2.5 ]

  Final probability = clamp(score, 5%, 99%)

Step 3: Results + Persistence
        ↓
  Probability % displayed · Saved to Supabase · Logged to local history
  AI Counselor generates personalised assessment via OpenAI
```

---

## Features

### Prediction Engine
- 7-parameter weighted scoring model with per-feature normalization
- Real-time input validation with inline error messages for each field
- "Fast Calc" quick predictor on the landing page — pre-fills GPA & GRE and routes directly to results
- Probability clamped to a realistic 5–99% range (no false certainties)

### AI Counselor (OpenAI-powered)
- Generates a personalised overall assessment based on your latest prediction
- Highlights your **strengths** (e.g. GRE, TOEFL, research) and **gaps to address** (e.g. SOP, LOR)
- Produces a timestamped **action plan** with month-by-month improvement targets
- Risk classification: **Safe / Medium Risk / High Risk** based on probability band
- Refreshable on demand from the dashboard

### Personal Dashboard
- Summary cards: total predictions, latest probability, best score ever
- Persistent prediction history (up to 20 entries stored locally)
- Cloud sync via **Supabase** — predictions tied to authenticated user accounts
- User session managed via localStorage with name/email context passed to all pages

### Authentication
- Dedicated sign-in and login pages (`signin.html`, `login.html`)
- User identity stored client-side and attached to every Supabase prediction record

### UI/UX Design
- **Neo-brutalist** design system — bold 4px borders, hard drop-shadows (`8px 8px 0px 0px #221e10`), Lexend typeface
- Full dark/light mode via Tailwind's `darkMode: "class"` configuration
- Custom Tailwind theme: primary gold `#c2940a`, ink `#221e10`, cream `#f8f8f5`, input yellow `#fff9e6`
- Fully responsive grid layout — mobile-first
- Interactive SOP/LOR sliders with live value labels
- Submit button shows a cloud-upload state while Supabase saves the record

### Data Persistence
- **Supabase (PostgreSQL)** — all 7 inputs + computed probability stored per user
- LocalStorage fallback — works offline and for non-authenticated users
- Graceful Supabase error handling — failure is logged but never blocks the UX

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Styling** | Tailwind CSS (CDN — Forms & Container Queries plugins) |
| **Typography** | Google Fonts — Lexend (weights 300–800) |
| **Icons** | Google Material Icons & Material Symbols Outlined |
| **Backend / DB** | Supabase JS SDK v2 (PostgreSQL REST API) |
| **AI Counselor** | OpenAI API |
| **ML / Data Science** | Python, Jupyter Notebook, pandas, scikit-learn |
| **Deployment** | Vercel |

---

## Project Structure

```
GradPredict/
│
├── index.html                           # Landing page — hero, metrics, 3-step process, fast calc
├── predict.html                         # Admission input form — 7-parameter predictor UI
├── results.html                         # Prediction results display page
├── dashboard.html                       # User dashboard — history, AI Counselor, stats
├── login.html                           # Returning user login
├── signin.html                          # New user registration
│
├── styles.css                           # Global stylesheet (landing page)
├── db.js                                # Supabase client init & DB helpers
│
├── Graduate Admission Prediction.ipynb  # Jupyter Notebook — EDA, model training, evaluation
│
├── admission_input_form/                # Component assets for predictor form
├── admitpredict_landing_page/           # Landing page component assets
├── prediction_results_page/             # Results page component assets
└── user_prediction_dashboard/           # Dashboard component assets
```

---

## ML Model & Prediction Engine

The core ML work lives in **`Graduate Admission Prediction.ipynb`**:

- **Exploratory Data Analysis (EDA)** — distributions of GRE, TOEFL, CGPA, research flags, and admit rates
- **Feature Engineering** — Pearson correlation analysis of all 7 features against admission probability
- **Model Training** — regression model on historical graduate admission data (Kaggle Graduate Admissions dataset)
- **Evaluation** — benchmark testing achieving a reported **94% accuracy** on held-out test data

The scoring function in `predict.html` is a lightweight, client-side implementation of the trained model's feature weights — enabling instant, serverless predictions directly in the browser with zero API latency.

**Input Parameter Weights:**

| Parameter | Input Range | Max Contribution |
|---|---|---|
| GRE Score | 260 – 340 | 25 points |
| TOEFL Score | 0 – 120 | 15 points |
| CGPA | 0.0 – 10.0 | 25 points |
| SOP Strength | 1.0 – 5.0 | 10 points |
| LOR Strength | 1.0 – 5.0 | 10 points |
| Research Experience | Yes / No | 10 points |
| University Rating | 1 – 5 | ±7.5 points |
| **Total** | | **~107.5 pts → normalized to %** |

---

## Getting Started

### Run Locally

```bash
# Clone the repository
git clone https://github.com/JiyaSehgal04/GradPredict.git
cd GradPredict

# Open in browser (no build step needed)
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

### Run the ML Notebook

```bash
pip install jupyter pandas numpy matplotlib seaborn scikit-learn
jupyter notebook "Graduate Admission Prediction.ipynb"
```

### Configure Supabase (for cloud persistence)

1. Create a free project at [supabase.com](https://supabase.com)
2. Create a `predictions` table with columns:
   `user_email`, `user_name`, `gre`, `toefl`, `cgpa`, `sop`, `lor`, `research`, `rating`, `probability`
3. Add your project URL and anon key to `db.js`

---

## License

Open source under the [MIT License](LICENSE). Free to use, fork, and build upon.

---

<div align="center">

**Built for the ambitious. Designed to be honest. Deployed for everyone.**

[![GitHub stars](https://img.shields.io/github/stars/JiyaSehgal04/GradPredict?style=social)](https://github.com/JiyaSehgal04/GradPredict/stargazers)

</div><img width="3420" height="1706" alt="screenshot-dashboard" src="https://github.com/user-attachments/assets/148740fa-2ba4-4465-85d2-9e717b5c97dc" />

