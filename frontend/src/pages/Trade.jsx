import { useState, useEffect } from 'react';
import api from '../services/api';

function Trade() {
  // Stock selection and data
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [previousPrice, setPreviousPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(0);
  const [loading, setLoading] = useState(true);

  // Trading state
  const [buyQuantity, setBuyQuantity] = useState('');
  const [sellQuantity, setSellQuantity] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [buyMessage, setBuyMessage] = useState('');
  const [sellMessage, setSellMessage] = useState('');
  const [buyError, setBuyError] = useState('');
  const [sellError, setSellError] = useState('');

  // User data
  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);

  // Fetch all stocks on mount
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await api.get('/stocks');
        if (response.data.success) {
          setStocks(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching stocks:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserData = async () => {
      try {
        const [walletRes, portfolioRes] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/portfolio')
        ]);
        setBalance(walletRes.data.data.balance);
        setPortfolio(portfolioRes.data.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchStocks();
    fetchUserData();
  }, []);

  // Poll for price updates when stock is selected
  useEffect(() => {
    if (!selectedStock) return;

    const fetchPrice = async () => {
      try {
        const response = await api.get(`/stocks/${selectedStock.id}`);
        if (response.data.success) {
          const newPrice = response.data.data.currentPrice;
          if (currentPrice !== null) {
            setPreviousPrice(currentPrice);
            setPriceChange(newPrice - currentPrice);
          }
          setCurrentPrice(newPrice);
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };

    // Fetch immediately
    fetchPrice();

    // Set up polling every 3 seconds
    const interval = setInterval(fetchPrice, 3000);

    return () => clearInterval(interval);
  }, [selectedStock, currentPrice]);

  // Handle stock selection
  const handleStockSelect = (e) => {
    const stockId = e.target.value;
    if (!stockId) {
      setSelectedStock(null);
      setCurrentPrice(null);
      setPreviousPrice(null);
      setPriceChange(0);
      return;
    }

    const stock = stocks.find(s => s.id === stockId);
    setSelectedStock(stock);
    setCurrentPrice(stock.currentPrice);
    setPreviousPrice(null);
    setPriceChange(0);

    // Clear previous messages
    setBuyMessage('');
    setSellMessage('');
    setBuyError('');
    setSellError('');
  };

  // Handle buy
  const handleBuy = async (e) => {
    e.preventDefault();
    if (!selectedStock || !buyQuantity) return;

    setBuyLoading(true);
    setBuyMessage('');
    setBuyError('');

    try {
      const response = await api.post('/trade/buy', {
        stockId: selectedStock.id,
        quantity: parseInt(buyQuantity)
      });

      if (response.data.success) {
        setBuyMessage(response.data.message);
        setBuyQuantity('');

        // Refresh user data
        const [walletRes, portfolioRes] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/portfolio')
        ]);
        setBalance(walletRes.data.data.balance);
        setPortfolio(portfolioRes.data.data);
      }
    } catch (error) {
      setBuyError(error.response?.data?.message || 'Failed to buy stock');
    } finally {
      setBuyLoading(false);
    }
  };

  // Handle sell
  const handleSell = async (e) => {
    e.preventDefault();
    if (!selectedStock || !sellQuantity) return;

    setSellLoading(true);
    setSellMessage('');
    setSellError('');

    try {
      const response = await api.post('/trade/sell', {
        stockId: selectedStock.id,
        quantity: parseInt(sellQuantity)
      });

      if (response.data.success) {
        setSellMessage(response.data.message);
        setSellQuantity('');

        // Refresh user data
        const [walletRes, portfolioRes] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/portfolio')
        ]);
        setBalance(walletRes.data.data.balance);
        setPortfolio(portfolioRes.data.data);
      }
    } catch (error) {
      setSellError(error.response?.data?.message || 'Failed to sell stock');
    } finally {
      setSellLoading(false);
    }
  };

  // Calculate total cost/proceeds
  const buyTotal = buyQuantity && currentPrice ? buyQuantity * currentPrice : 0;
  const sellTotal = sellQuantity && currentPrice ? sellQuantity * currentPrice : 0;

  // Get owned quantity for selected stock
  const ownedQuantity = selectedStock
    ? portfolio.find(p => p.stock.id === selectedStock.id)?.quantity || 0
    : 0;

  // Check if can afford to buy
  const canAfford = buyTotal <= balance;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="trade-page">
      <div className="trade-header">
        <h1>Trade Stocks</h1>
        <p className="trade-subtitle">Real-time stock trading with live prices</p>
      </div>

      {/* Stock Selection */}
      <div className="stock-selector-card">
        <label htmlFor="stock-select" className="selector-label">
          Select Stock to Trade
        </label>
        <select
          id="stock-select"
          value={selectedStock?.id || ''}
          onChange={handleStockSelect}
          className="stock-select"
        >
          <option value="">-- Choose a stock --</option>
          {stocks.map(stock => (
            <option key={stock.id} value={stock.id}>
              {stock.symbol} - {stock.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Display - Only show when stock is selected */}
      {selectedStock && currentPrice !== null && (
        <div className="price-display-card">
          <div className="price-header">
            <div>
              <h2>{selectedStock.symbol}</h2>
              <p className="stock-name">{selectedStock.name}</p>
            </div>
            <div className="price-section">
              <div className="current-price-label">Current Price</div>
              <div className="current-price-value">
                ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {priceChange !== 0 && (
                <div className={`price-change ${priceChange > 0 ? 'positive' : 'negative'}`}>
                  {priceChange > 0 ? '↑' : '↓'} ₹{Math.abs(priceChange).toFixed(2)}
                </div>
              )}
            </div>
          </div>
          <div className="holdings-info">
            <span>Your Holdings:</span>
            <strong>{ownedQuantity} shares</strong>
          </div>
        </div>
      )}

      {/* Trading Forms - Only show when stock is selected */}
      {selectedStock && currentPrice !== null && (
        <div className="trade-grid">
          {/* Buy Card */}
          <div className="trade-card buy-card">
            <div className="trade-card-header">
              <div className="trade-icon buy-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <h2>Buy {selectedStock.symbol}</h2>
                <p className="card-subtitle">Purchase shares at current market price</p>
              </div>
            </div>

            <form onSubmit={handleBuy} className="trade-form">
              <div className="balance-display">
                <span>Available Balance:</span>
                <strong>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>

              <div className="form-group">
                <label htmlFor="buy-quantity">Quantity (shares)</label>
                <input
                  type="number"
                  id="buy-quantity"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(e.target.value)}
                  min="1"
                  placeholder="Enter quantity"
                  disabled={buyLoading}
                  className="trade-input"
                />
              </div>

              {buyQuantity && (
                <div className={`total-display ${!canAfford ? 'insufficient' : ''}`}>
                  <span>Total Cost:</span>
                  <span className="total-value">
                    ₹{buyTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {!canAfford && buyQuantity && (
                <div className="warning-message">
                  ⚠️ Insufficient balance
                </div>
              )}

              {buyMessage && (
                <div className="alert alert-success">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {buyMessage}
                </div>
              )}

              {buyError && (
                <div className="alert alert-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {buyError}
                </div>
              )}

              <button
                type="submit"
                className="trade-btn trade-btn-buy"
                disabled={buyLoading || !buyQuantity || !canAfford}
              >
                {buyLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Buy {buyQuantity || 0} Shares
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sell Card */}
          <div className="trade-card sell-card">
            <div className="trade-card-header">
              <div className="trade-icon sell-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                </svg>
              </div>
              <div>
                <h2>Sell {selectedStock.symbol}</h2>
                <p className="card-subtitle">Sell shares at current market price</p>
              </div>
            </div>

            <form onSubmit={handleSell} className="trade-form">
              <div className="balance-display">
                <span>Your Holdings:</span>
                <strong>{ownedQuantity} shares</strong>
              </div>

              <div className="form-group">
                <label htmlFor="sell-quantity">Quantity (shares)</label>
                <input
                  type="number"
                  id="sell-quantity"
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  min="1"
                  max={ownedQuantity}
                  placeholder="Enter quantity"
                  disabled={sellLoading || ownedQuantity === 0}
                  className="trade-input"
                />
              </div>

              {sellQuantity && (
                <div className="total-display">
                  <span>Total Proceeds:</span>
                  <span className="total-value">
                    ₹{sellTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {sellQuantity > ownedQuantity && (
                <div className="warning-message">
                  ⚠️ Cannot sell more than you own
                </div>
              )}

              {sellMessage && (
                <div className="alert alert-success">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {sellMessage}
                </div>
              )}

              {sellError && (
                <div className="alert alert-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {sellError}
                </div>
              )}

              <button
                type="submit"
                className="trade-btn trade-btn-sell"
                disabled={sellLoading || !sellQuantity || sellQuantity > ownedQuantity || ownedQuantity === 0}
              >
                {sellLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    Sell {sellQuantity || 0} Shares
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Empty state when no stock selected */}
      {!selectedStock && (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
          <p>Select a stock from the dropdown above to start trading</p>
        </div>
      )}
    </div>
  );
}

export default Trade;
