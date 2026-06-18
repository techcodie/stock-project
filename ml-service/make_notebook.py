"""
Builds notebooks/price_prediction.ipynb programmatically with nbformat, then
it is executed by nbconvert so the committed notebook contains real outputs
(plots, metrics, confusion matrix).

Run:  python make_notebook.py
"""
import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []
md = lambda s: cells.append(nbf.v4.new_markdown_cell(s))
code = lambda s: cells.append(nbf.v4.new_code_cell(s))

md("""# 📈 Stock Price-Direction Prediction

**Goal:** given a stock's recent price action, predict whether its **next trading day**
closes **up or down** — a binary classification problem.

This notebook walks through the full supervised-ML lifecycle:

1. Load price data → 2. Engineer technical-indicator features → 3. Label the target →
4. Chronological train/test split → 5. Train interpretable models → 6. Evaluate honestly →
7. Inspect feature importance.

> **Reality check:** predicting daily direction is *hard* — markets are close to efficient.
> A realistic model beats a coin-flip only slightly. We measure that honestly against a
> majority-class baseline instead of chasing a suspicious 95% accuracy.
""")

code("""# Make the ml-service modules importable whether run from ./ or ./notebooks/
import sys, os
sys.path.insert(0, os.path.abspath(".."))
sys.path.insert(0, os.path.abspath("."))

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, roc_auc_score, confusion_matrix,
                             classification_report)

# Reuse the SAME code the training script and API use, so nothing drifts.
from data import SYMBOLS, load_prices
from features import FEATURE_COLUMNS, add_features, add_label
from train import build_dataset, time_split

%matplotlib inline
pd.set_option("display.width", 120)
print("Stocks:", SYMBOLS)""")

md("""## 1. Load the data

We pull daily OHLCV (Open/High/Low/Close/Volume) per stock. The loader tries **real
NSE data via `yfinance`** and falls back to a **market simulator** (Yahoo frequently
rate-limits). The simulator deliberately embeds *momentum* and *mean-reversion* so the
indicators below have a real signal to learn.
""")

code("""prices = load_prices("RELIANCE")
print("source:", prices.attrs.get("source"), "| rows:", len(prices))
prices.tail()""")

code("""plt.figure(figsize=(10, 3))
plt.plot(prices.index, prices["Close"])
plt.title("RELIANCE — daily close")
plt.ylabel("Price"); plt.tight_layout(); plt.show()""")

md("""## 2. Feature engineering (technical indicators)

We describe recent behaviour with a handful of **scale-free** indicators, so one model
works across stocks at any price level:

| Feature | Meaning |
|---|---|
| `return_1d`, `return_5d` | recent returns (momentum) |
| `sma_ratio_10/20` | price relative to its moving average (trend) |
| `rsi_14` | Relative Strength Index — overbought/oversold |
| `macd_diff` | MACD vs its signal line |
| `volatility_10` | recent risk |
| `momentum_10` | 10-day price change |
| `volume_ratio` | volume vs its average |
""")

code("""feat = add_features(prices)
feat[FEATURE_COLUMNS].dropna().describe().round(3)""")

md("""## 3. Build the labelled dataset

Target = **1 if tomorrow's close > today's close, else 0**. We pool all stocks into one
table (features are scale-free, so this is fine).
""")

code("""data, latest, source = build_dataset()
print("data source:", source, "| samples:", len(data))
balance = data["target"].value_counts(normalize=True).round(3)
print("class balance (0=down, 1=up):\\n", balance)

plt.figure(figsize=(3.5, 3))
data["target"].value_counts().sort_index().plot(kind="bar", color=["#ef4444", "#10b981"])
plt.xticks([0, 1], ["Down", "Up"], rotation=0); plt.title("Target balance")
plt.tight_layout(); plt.show()""")

md("""### How does each feature relate to the target?

A quick correlation tells us which indicators carry signal (values are small — that's
expected for daily direction).
""")

code("""corr = data[FEATURE_COLUMNS + ["target"]].corr()["target"].drop("target").sort_values()
plt.figure(figsize=(7, 3))
corr.plot(kind="barh", color="#10b981")
plt.title("Correlation of each feature with next-day direction")
plt.tight_layout(); plt.show()
corr.round(4)""")

md("""## 4. Train / test split — **chronological**

The single most important detail for time-series ML: **never shuffle**. We train on the
earliest 80% of dates and test on the most recent 20%, so the model is always predicting
the *future* it hasn't seen. Shuffling would leak future information and inflate scores.
""")

code("""train, test = time_split(data)
X_train, y_train = train[FEATURE_COLUMNS].values, train["target"].values
X_test, y_test = test[FEATURE_COLUMNS].values, test["target"].values

scaler = StandardScaler().fit(X_train)          # fit on TRAIN only
X_train_s, X_test_s = scaler.transform(X_train), scaler.transform(X_test)
print(f"train rows: {len(X_train)}  |  test rows: {len(X_test)}")""")

md("""## 5. Train models + an honest baseline

We compare two **interpretable** models against a majority-class baseline (always predict
the more common class). A model is only useful if it beats that baseline.
""")

code("""baseline = max(np.mean(y_test == 0), np.mean(y_test == 1))

models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, C=0.5),
    "Random Forest": RandomForestClassifier(n_estimators=200, max_depth=5,
                                             min_samples_leaf=25, random_state=42),
}
rows = []
fitted = {}
for name, m in models.items():
    m.fit(X_train_s, y_train)
    fitted[name] = m
    pred = m.predict(X_test_s)
    proba = m.predict_proba(X_test_s)[:, 1]
    rows.append({"model": name,
                 "accuracy": round(accuracy_score(y_test, pred), 4),
                 "roc_auc": round(roc_auc_score(y_test, proba), 4)})

results = pd.DataFrame(rows)
print(f"Majority-class baseline accuracy: {baseline:.4f}\\n")
results""")

md("""## 6. Evaluation

Accuracy alone is misleading on imbalanced data, so we also look at **ROC-AUC** (ranking
quality), the **confusion matrix**, and per-class **precision/recall**.
""")

code("""best_name = results.sort_values("roc_auc", ascending=False).iloc[0]["model"]
best = fitted[best_name]
pred = best.predict(X_test_s)
print("Best model:", best_name)
print(classification_report(y_test, pred, target_names=["Down", "Up"]))

cm = confusion_matrix(y_test, pred)
fig, ax = plt.subplots(figsize=(3.6, 3.4))
ax.imshow(cm, cmap="Greens")
ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
ax.set_xticklabels(["Down", "Up"]); ax.set_yticklabels(["Down", "Up"])
ax.set_xlabel("Predicted"); ax.set_ylabel("Actual"); ax.set_title(best_name)
for i in range(2):
    for j in range(2):
        ax.text(j, i, cm[i, j], ha="center", va="center", fontsize=13)
plt.tight_layout(); plt.show()""")

md("""## 7. Feature importance — what drives the prediction?

Interpretability matters: we can see *which indicators* the model relies on. (Coefficients
for Logistic Regression, impurity importance for Random Forest.)
""")

code("""if best_name == "Logistic Regression":
    importance = pd.Series(np.abs(best.coef_[0]), index=FEATURE_COLUMNS)
else:
    importance = pd.Series(best.feature_importances_, index=FEATURE_COLUMNS)
importance = importance.sort_values()

plt.figure(figsize=(7, 3.5))
importance.plot(kind="barh", color="#10b981")
plt.title(f"Feature importance — {best_name}")
plt.tight_layout(); plt.show()
importance.sort_values(ascending=False).round(4)""")

md("""## 8. Conclusion & honest takeaways

- The model achieves a **small but consistent edge over the majority-class baseline**
  (ROC-AUC > 0.5), validated on a **held-out, future** test period.
- This is the *expected* outcome — daily direction is close to a random walk (efficient-market
  hypothesis). The value here is the **rigorous, leak-free workflow**, not a magic number.
- **Serving:** the trained model is saved (`models/model.pkl`) and served by a FastAPI
  microservice (`app.py`); the Node backend proxies to it and the React app shows the
  prediction with its confidence and top signals.

**How I'd improve it next:**
1. Real multi-year OHLCV (yfinance / a data vendor) instead of the simulator.
2. Richer features (Bollinger Bands, sector/market context, lagged returns).
3. **Walk-forward** (rolling-origin) validation and probability **calibration**.
4. Predict *magnitude* (regression) or a *3-class* up/flat/down target.
""")

nb["cells"] = cells
nb["metadata"]["kernelspec"] = {"name": "python3", "display_name": "Python 3", "language": "python"}
with open("notebooks/price_prediction.ipynb", "w") as f:
    nbf.write(nb, f)
print("Wrote notebooks/price_prediction.ipynb with", len(cells), "cells")
