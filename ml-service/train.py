"""
Train the price-direction model.

Pipeline (the classic supervised-ML lifecycle):
  1. Load OHLCV history for every stock (real if available, else simulated).
  2. Engineer technical-indicator features + a next-day up/down label.
  3. Chronological train/test split (NO shuffling — avoids look-ahead bias,
     which is the #1 mistake people make with time-series ML).
  4. Standardise features, train two interpretable models, and compare them
     to a majority-class baseline.
  5. Evaluate (accuracy, precision/recall/F1, ROC-AUC, confusion matrix) and
     save the winner + a feature vector per stock for live serving.

Run:  python train.py
"""
import json
from datetime import datetime, timezone

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, confusion_matrix, f1_score, precision_score,
    recall_score, roc_auc_score,
)
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.preprocessing import StandardScaler
import joblib

from data import SYMBOLS, load_prices
from features import FEATURE_COLUMNS, add_features, add_label

MODELS_DIR = "models"
TEST_FRACTION = 0.2  # last 20% of time = test set


def build_dataset():
    """Build one big labelled table across all stocks; track the data source."""
    frames, sources = [], set()
    latest = {}  # symbol -> latest feature vector for serving

    for symbol in SYMBOLS:
        prices = load_prices(symbol)
        sources.add(prices.attrs.get("source", "unknown"))

        feat = add_features(prices)
        labelled = add_label(feat)

        # Latest fully-formed feature row (used by the API to predict "today").
        latest_row = feat[FEATURE_COLUMNS].dropna().iloc[-1]
        latest[symbol] = {
            "features": {c: float(latest_row[c]) for c in FEATURE_COLUMNS},
            "last_close": float(prices["Close"].iloc[-1]),
            "as_of": str(prices.index[-1].date()),
        }

        labelled = labelled.dropna(subset=FEATURE_COLUMNS + ["target"]).copy()
        labelled["symbol"] = symbol
        labelled["date"] = labelled.index
        frames.append(labelled)

    data = pd.concat(frames, ignore_index=True).sort_values("date").reset_index(drop=True)
    source = "yfinance" if sources == {"yfinance"} else ("mixed" if "yfinance" in sources else "simulated")
    return data, latest, source


def time_split(data):
    """Chronological split: earliest 80% train, most recent 20% test."""
    cutoff = data["date"].quantile(1 - TEST_FRACTION)
    train = data[data["date"] <= cutoff]
    test = data[data["date"] > cutoff]
    return train, test


def evaluate(name, model, X_test, y_test):
    pred = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]
    return {
        "accuracy": round(accuracy_score(y_test, pred), 4),
        "precision": round(precision_score(y_test, pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, pred, zero_division=0), 4),
        "f1": round(f1_score(y_test, pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
    }


def main():
    print("Building dataset...")
    data, latest, source = build_dataset()
    print(f"  data source: {source}")
    print(f"  samples: {len(data)}  |  stocks: {data['symbol'].nunique()}")

    train, test = time_split(data)
    X_train, y_train = train[FEATURE_COLUMNS].values, train["target"].values
    X_test, y_test = test[FEATURE_COLUMNS].values, test["target"].values
    print(f"  train: {len(X_train)}  |  test: {len(X_test)}")

    # Standardise (fit on train ONLY).
    scaler = StandardScaler().fit(X_train)
    X_train_s, X_test_s = scaler.transform(X_train), scaler.transform(X_test)

    # Honest baseline: always predict the majority class.
    majority = int(round(y_train.mean()))
    baseline_acc = round(float((y_test == majority).mean()), 4)

    candidates = {
        "logistic_regression": LogisticRegression(max_iter=1000, C=0.5),
        "random_forest": RandomForestClassifier(
            n_estimators=200, max_depth=5, min_samples_leaf=25, random_state=42,
        ),
    }

    tscv = TimeSeriesSplit(n_splits=5)
    results = {}
    fitted = {}
    for name, model in candidates.items():
        model.fit(X_train_s, y_train)
        fitted[name] = model
        metrics = evaluate(name, model, X_test_s, y_test)
        cv = cross_val_score(model, X_train_s, y_train, cv=tscv, scoring="accuracy")
        metrics["cv_accuracy_mean"] = round(float(cv.mean()), 4)
        metrics["cv_accuracy_std"] = round(float(cv.std()), 4)
        results[name] = metrics
        print(f"  {name:20s} acc={metrics['accuracy']}  roc_auc={metrics['roc_auc']}  cv={metrics['cv_accuracy_mean']}")

    # Pick the model with the best test ROC-AUC.
    best_name = max(results, key=lambda n: results[n]["roc_auc"])
    best_model = fitted[best_name]
    print(f"  baseline accuracy: {baseline_acc}")
    print(f"  selected: {best_name}")

    # Feature importance (coefficients for LR, impurity importance for RF).
    if best_name == "logistic_regression":
        importance = dict(zip(FEATURE_COLUMNS, np.abs(best_model.coef_[0])))
    else:
        importance = dict(zip(FEATURE_COLUMNS, best_model.feature_importances_))
    importance = {k: round(float(v), 4) for k, v in sorted(importance.items(), key=lambda kv: -kv[1])}

    # --- Save artifacts -----------------------------------------------------
    joblib.dump(best_model, f"{MODELS_DIR}/model.pkl")
    joblib.dump(scaler, f"{MODELS_DIR}/scaler.pkl")

    metrics_out = {
        "data_source": source,
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "n_samples": len(data),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "features": FEATURE_COLUMNS,
        "baseline_accuracy": baseline_acc,
        "selected_model": best_name,
        "models": results,
        "feature_importance": importance,
    }
    with open(f"{MODELS_DIR}/metrics.json", "w") as f:
        json.dump(metrics_out, f, indent=2)
    with open(f"{MODELS_DIR}/latest_features.json", "w") as f:
        json.dump(latest, f, indent=2)
    with open(f"{MODELS_DIR}/feature_columns.json", "w") as f:
        json.dump(FEATURE_COLUMNS, f, indent=2)

    # Confusion matrix plot for the notebook / README.
    cm = np.array(results[best_name]["confusion_matrix"])
    fig, ax = plt.subplots(figsize=(4, 4))
    ax.imshow(cm, cmap="Greens")
    ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
    ax.set_xticklabels(["Down", "Up"]); ax.set_yticklabels(["Down", "Up"])
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    ax.set_title(f"Confusion Matrix — {best_name}")
    for i in range(2):
        for j in range(2):
            ax.text(j, i, cm[i, j], ha="center", va="center", fontsize=14)
    fig.tight_layout()
    fig.savefig(f"{MODELS_DIR}/confusion_matrix.png", dpi=110)

    print("Saved model + metrics to models/. Done.")


if __name__ == "__main__":
    main()
