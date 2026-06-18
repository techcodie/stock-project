# 🤖 ML Service — Stock Price-Direction Prediction

A self-contained **machine-learning microservice** that predicts whether a stock will
close **up or down the next trading day**, and serves that prediction to the rest of the
app over a small REST API.

This is the part of the project that demonstrates the **full supervised-ML lifecycle**:
data → feature engineering → train/test split → model selection → evaluation → serving.

```
React  ──►  Node/Express (/api/ai/predict/:symbol)  ──►  FastAPI (this service)  ──►  model.pkl
                                                                  ▲
                                                       trained in notebooks/price_prediction.ipynb
```

---

## 🧠 The model

| | |
|---|---|
| **Problem** | Binary classification — next-day **Up (1)** vs **Down (0)** |
| **Models** | Logistic Regression & Random Forest (interpretable on purpose) |
| **Features** | 9 classic technical indicators (returns, SMA ratios, RSI, MACD, volatility, momentum, volume ratio) — all scale-free so one model serves every stock |
| **Label** | `1` if tomorrow's close > today's close |
| **Split** | **Chronological** 80/20 (no shuffling → no look-ahead bias) |
| **Validation** | 5-fold `TimeSeriesSplit` cross-validation |
| **Metrics** | Accuracy, Precision/Recall/F1, ROC-AUC, confusion matrix — compared against a **majority-class baseline** |

### Honest results

On the held-out (most recent) test period the model achieves a **small but consistent edge
over the baseline** (ROC-AUC > 0.5). That is the *expected* result — daily direction is
close to a random walk (efficient-market hypothesis). The value is the **rigorous, leak-free
workflow**, not an inflated accuracy number. Live metrics are in
[`models/metrics.json`](models/metrics.json) and the worked-through analysis (with plots) is
in [`notebooks/price_prediction.ipynb`](notebooks/price_prediction.ipynb).

> **Data:** the loader uses **real NSE data via `yfinance`** when available and falls back to
> a **market simulator** (Yahoo rate-limits aggressively). The simulator embeds momentum +
> mean-reversion so the indicators have real signal to learn. `metrics.json.data_source`
> records which was used.

---

## 🚀 Run it

```bash
cd ml-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# (optional) retrain — regenerates models/*.pkl + metrics.json
python train.py

# start the API
uvicorn app:app --port 8000
```

The trained artifacts are committed under `models/`, so the service runs immediately
without retraining. To use **real** market data: `pip install yfinance` then `python train.py`.

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | liveness + which model is loaded |
| `GET` | `/predict/{symbol}` | next-day prediction for one stock |
| `GET` | `/predict` | predictions for all stocks |
| `GET` | `/metrics` | the model card (training info + scores) |

```bash
curl http://localhost:8000/predict/RELIANCE
```

---

## 📁 Files

| File | Purpose |
|---|---|
| `data.py` | load OHLCV (yfinance → simulator fallback) |
| `features.py` | technical-indicator feature engineering (shared everywhere) |
| `train.py` | the training + evaluation pipeline → saves `models/` |
| `app.py` | FastAPI serving layer |
| `make_notebook.py` | builds the analysis notebook from the same code |
| `notebooks/price_prediction.ipynb` | the documented, executed ML walk-through |

---

## 🎤 Interview talking points

- *"I framed next-day direction as **binary classification**, engineered **technical-indicator
  features**, and trained interpretable models I can actually explain."*
- *"I used a **chronological** train/test split and `TimeSeriesSplit` CV to avoid **look-ahead
  bias** — the classic time-series mistake."*
- *"I evaluated against a **majority-class baseline** with **ROC-AUC** and a confusion matrix,
  and I'm honest that the edge is small because markets are near-efficient."*
- *"I **served** the model as a **FastAPI microservice** that the Node backend proxies to, so
  the React app gets predictions with a confidence and the **top contributing features**."*
- *"Feature importance + the probability/confidence in the UI make it **interpretable**, not a
  black box."*
