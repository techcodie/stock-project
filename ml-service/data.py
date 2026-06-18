"""
Price data loading.

Two sources, in order of preference:
  1. Real daily OHLCV from Yahoo Finance (yfinance) for NSE tickers (SYMBOL.NS).
  2. A market simulator fallback used when yfinance isn't installed or the
     network/Yahoo is unavailable (it frequently rate-limits).

The simulator is NOT a pure random walk — it deliberately embeds *momentum*
and *mean-reversion*, the two effects technical indicators are designed to
capture. That gives the model real, learnable structure so the demo shows a
believable edge over a coin-flip. Real markets are far closer to efficient,
which is exactly the kind of nuance worth discussing in an interview.
"""
import numpy as np
import pandas as pd

# The stocks the trading app knows about.
SYMBOLS = [
    "RELIANCE", "TCS", "INFY", "HDFC", "ICICIBANK", "SBIN",
    "BHARTIARTL", "ITC", "KOTAKBANK", "LT", "WIPRO", "ASIANPAINT",
]

# Stable per-symbol seed so the simulated history is reproducible.
def _seed_for(symbol: str) -> int:
    return abs(hash(symbol)) % (2**31)


def _simulate(symbol: str, n_days: int = 850) -> pd.DataFrame:
    rng = np.random.default_rng(_seed_for(symbol))

    start_price = float(rng.uniform(150, 3000))
    drift = 0.0004                      # slight upward bias
    momentum_coef = 0.18               # returns are mildly autocorrelated
    mean_rev_coef = 0.03               # prices get pulled back toward a slow EMA
    vol = 0.015

    price = start_price
    ema = start_price
    prev_ret = 0.0
    closes, opens, highs, lows, volumes = [], [], [], [], []

    for _ in range(n_days):
        # Volatility clustering (GARCH-like): big moves follow big moves.
        vol = 0.92 * vol + 0.08 * abs(prev_ret) + 0.0015
        vol = float(np.clip(vol, 0.006, 0.05))

        momentum = momentum_coef * prev_ret
        mean_rev = -mean_rev_coef * (price / ema - 1.0)
        shock = rng.normal(0, vol)
        ret = drift + momentum + mean_rev + shock

        open_p = price
        price = max(1.0, price * (1.0 + ret))
        ema = 0.95 * ema + 0.05 * price

        intraday = abs(rng.normal(0, vol)) * price
        high = max(open_p, price) + intraday
        low = min(open_p, price) - intraday
        volume = int(1_000_000 * (1.0 + 4.0 * abs(ret)) * rng.uniform(0.6, 1.4))

        opens.append(open_p); closes.append(price)
        highs.append(high); lows.append(max(1.0, low)); volumes.append(volume)
        prev_ret = ret

    dates = pd.bdate_range(end=pd.Timestamp("2026-06-25"), periods=n_days)
    return pd.DataFrame(
        {"Open": opens, "High": highs, "Low": lows, "Close": closes, "Volume": volumes},
        index=dates,
    )


def load_prices(symbol: str, period: str = "3y", use_real: bool = True) -> pd.DataFrame:
    """
    Return a daily OHLCV DataFrame for `symbol`, newest last.
    Falls back to the simulator if real data can't be fetched.
    """
    if use_real:
        try:
            import yfinance as yf  # optional dependency

            df = yf.download(
                f"{symbol}.NS", period=period, interval="1d",
                auto_adjust=True, progress=False,
            )
            if df is not None and len(df) > 200:
                df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()
                df.attrs["source"] = "yfinance"
                return df
        except Exception:
            pass  # fall through to the simulator

    df = _simulate(symbol)
    df.attrs["source"] = "simulated"
    return df
