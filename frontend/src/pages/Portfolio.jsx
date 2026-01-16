import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch portfolio data
  useEffect(() => {
    fetchPortfolio();

    // Auto-refresh every 5 seconds to get latest prices
    const interval = setInterval(() => {
      fetchPortfolio(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchPortfolio = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    setError('');

    try {
      const response = await api.get('/portfolio');
      if (response.data.success) {
        setPortfolio(response.data.data || []);
      }
    } catch (err) {
      console.error('Portfolio error:', err);
      setError(err.response?.data?.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate totals
  const totalInvestment = portfolio.reduce((sum, item) =>
    sum + (item.avgBuyPrice * item.quantity), 0
  );

  const totalCurrentValue = portfolio.reduce((sum, item) =>
    sum + (item.currentValue || 0), 0
  );

  const totalProfitLoss = portfolio.reduce((sum, item) =>
    sum + (item.profitLoss || 0), 0
  );

  const profitLossPercent = totalInvestment > 0
    ? ((totalProfitLoss / totalInvestment) * 100)
    : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <div>
          <h1>My Portfolio</h1>
          <p className="portfolio-subtitle">Track your investments and performance</p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => fetchPortfolio()}
            className="btn-refresh"
            disabled={refreshing}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={refreshing ? 'spinning' : ''}>
              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9h-3m-6 9a9 9 0 0 1-9-9m9 9v-3m-9-6a9 9 0 0 1 9-9m-9 9h3m6-9v3" />
            </svg>
            Refresh
          </button>
          <Link to="/trade" className="btn-trade-action">
            Trade Stocks
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {portfolio.length > 0 && (
        <div className="portfolio-summary">
          <div className="summary-card">
            <div className="summary-icon investment-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="summary-content">
              <div className="summary-label">Total Investment</div>
              <div className="summary-value">₹{totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon value-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
            <div className="summary-content">
              <div className="summary-label">Current Value</div>
              <div className="summary-value">₹{totalCurrentValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div className="summary-card highlight">
            <div className={`summary-icon ${totalProfitLoss >= 0 ? 'profit-icon' : 'loss-icon'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={totalProfitLoss >= 0 ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M5 12l7 7 7-7"} />
              </svg>
            </div>
            <div className="summary-content">
              <div className="summary-label">Total P/L</div>
              <div className={`summary-value ${totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}₹{Math.abs(totalProfitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="summary-percent">
                  ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Table */}
      {portfolio.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
          <h3>No Holdings Yet</h3>
          <p>Start trading to build your portfolio and track your investments</p>
          <Link to="/trade" className="btn-primary" style={{ marginTop: '1.5rem' }}>
            Start Trading
          </Link>
        </div>
      ) : (
        <div className="portfolio-table-card">
          <div className="table-header">
            <h2>Your Holdings</h2>
            <span className="holdings-count">{portfolio.length} {portfolio.length === 1 ? 'Stock' : 'Stocks'}</span>
          </div>
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Avg Buy Price</th>
                  <th className="text-right">Current Price</th>
                  <th className="text-right">Current Value</th>
                  <th className="text-right">P/L</th>
                  <th className="text-right">P/L %</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((holding) => (
                  <tr key={holding.id} className="portfolio-row">
                    <td>
                      <div className="stock-cell">
                        <div className="stock-symbol">{holding.stock?.symbol || 'N/A'}</div>
                        <div className="stock-name">{holding.stock?.name || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="text-right">
                      <strong>{holding.quantity}</strong>
                    </td>
                    <td className="text-right">
                      ₹{holding.avgBuyPrice?.toFixed(2) || '0.00'}
                    </td>
                    <td className="text-right">
                      <strong>₹{holding.stock?.currentPrice?.toFixed(2) || '0.00'}</strong>
                    </td>
                    <td className="text-right">
                      <strong>₹{(holding.currentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </td>
                    <td className={`text-right ${(holding.profitLoss || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                      <strong>
                        {(holding.profitLoss || 0) >= 0 ? '+' : ''}₹{Math.abs(holding.profitLoss || 0).toFixed(2)}
                      </strong>
                    </td>
                    <td className={`text-right ${(holding.profitLossPercent || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                      <div className="pl-badge">
                        {(holding.profitLossPercent || 0) >= 0 ? '↑' : '↓'} {Math.abs(holding.profitLossPercent || 0).toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Portfolio;
