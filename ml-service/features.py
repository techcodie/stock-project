"""
Feature engineering for the price-direction model.

Every feature here is a classic, explainable technical indicator. The goal is
to describe recent price behaviour in a few scale-free numbers (returns,
ratios, oscillators) so the same model can be used for any stock.

Shared by train.py (to build the training set) and app.py (to build the
feature vector at prediction time) so the two can never drift apart.
"""
import numpy as np
import pandas as pd

# The exact columns (in order) the model is trained on and served with.
FEATURE_COLUMNS = [
    "return_1d",      # yesterday's return
    "return_5d",      # 1-week momentum
    "sma_ratio_10",   # close / 10-day average  (>1 = above trend)
    "sma_ratio_20",   # close / 20-day average
    "rsi_14",         # Relative Strength Index (0-100, >70 overbought)
    "macd_diff",      # MACD line minus signal line
    "volatility_10",  # 10-day std of daily returns (risk)
    "momentum_10",    # 10-day price change %
    "volume_ratio",   # today's volume / 20-day average volume
]


def _rsi(close: pd.Series, period: int = 14) -> pd.Series:
    """Relative Strength Index — momentum oscillator between 0 and 100."""
    delta = close.diff()
    gain = delta.clip(lower=0).rolling(period).mean()
    loss = (-delta.clip(upper=0)).rolling(period).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def _macd_diff(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.Series:
    """MACD histogram: how far the MACD line is above/below its signal line."""
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd = ema_fast - ema_slow
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    return macd - signal_line


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Given a price frame with columns [Open, High, Low, Close, Volume], add the
    FEATURE_COLUMNS. Returns a copy; rows with NaNs (from rolling windows) are
    left in so the caller can decide whether to drop or keep the last row.
    """
    out = df.copy()
    close = out["Close"]

    out["return_1d"] = close.pct_change()
    out["return_5d"] = close.pct_change(5)
    out["sma_ratio_10"] = close / close.rolling(10).mean()
    out["sma_ratio_20"] = close / close.rolling(20).mean()
    out["rsi_14"] = _rsi(close, 14)
    out["macd_diff"] = _macd_diff(close) / close  # normalise by price -> scale-free
    out["volatility_10"] = close.pct_change().rolling(10).std()
    out["momentum_10"] = close.pct_change(10)

    if "Volume" in out.columns:
        out["volume_ratio"] = out["Volume"] / out["Volume"].rolling(20).mean()
    else:
        out["volume_ratio"] = 1.0

    return out


def add_label(df: pd.DataFrame) -> pd.DataFrame:
    """Target = 1 if the NEXT day's close is higher than today's, else 0."""
    out = df.copy()
    out["target"] = (out["Close"].shift(-1) > out["Close"]).astype(int)
    return out
