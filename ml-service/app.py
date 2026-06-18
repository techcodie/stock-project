"""
ML microservice (FastAPI).

Loads the trained model once at startup and serves next-day direction
predictions over a small REST API. The Node/Express backend proxies to this
service, so the React app never talks to Python directly.

Run:  uvicorn app:app --port 8000
"""
import json

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from features import FEATURE_COLUMNS

MODELS_DIR = "models"

# --- Load artifacts once (fast, in-memory predictions thereafter) -----------
model = joblib.load(f"{MODELS_DIR}/model.pkl")
scaler = joblib.load(f"{MODELS_DIR}/scaler.pkl")
with open(f"{MODELS_DIR}/latest_features.json") as f:
    LATEST = json.load(f)
with open(f"{MODELS_DIR}/metrics.json") as f:
    METRICS = json.load(f)

IMPORTANCE = METRICS.get("feature_importance", {})

app = FastAPI(title="StockTrader ML Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)


def _predict(symbol: str) -> dict:
    entry = LATEST.get(symbol)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"No model data for symbol '{symbol}'")

    feats = entry["features"]
    x = np.array([[feats[c] for c in FEATURE_COLUMNS]])
    x_scaled = scaler.transform(x)

    prob_up = float(model.predict_proba(x_scaled)[0, 1])
    direction = "UP" if prob_up >= 0.5 else "DOWN"
    confidence = round(abs(prob_up - 0.5) * 2, 4)  # 0 = coin-flip, 1 = certain

    # The three features pushing this prediction the hardest (by global importance).
    top_signals = [
        {"feature": c, "value": round(feats[c], 4), "importance": IMPORTANCE.get(c, 0)}
        for c in sorted(FEATURE_COLUMNS, key=lambda c: -IMPORTANCE.get(c, 0))[:3]
    ]

    return {
        "symbol": symbol,
        "direction": direction,
        "probabilityUp": round(prob_up, 4),
        "confidence": confidence,
        "lastClose": entry["last_close"],
        "asOf": entry["as_of"],
        "model": METRICS.get("selected_model"),
        "modelAccuracy": METRICS.get("models", {}).get(METRICS.get("selected_model"), {}).get("accuracy"),
        "dataSource": METRICS.get("data_source"),
        "topSignals": top_signals,
        "disclaimer": "Educational ML demo on a single-day horizon — not financial advice.",
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": METRICS.get("selected_model"), "symbols": len(LATEST)}


@app.get("/metrics")
def metrics():
    """The model card: how it was trained and how well it scored."""
    return METRICS


@app.get("/symbols")
def symbols():
    return {"symbols": sorted(LATEST.keys())}


@app.get("/predict/{symbol}")
def predict(symbol: str):
    return _predict(symbol.upper())


@app.get("/predict")
def predict_all():
    return {"predictions": [_predict(s) for s in sorted(LATEST.keys())]}
