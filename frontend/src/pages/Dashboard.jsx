import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StockSearch from '../components/StockSearch';

function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const fetchData = async () => {
    try {
      const [walletRes, portfolioRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/portfolio')
      ]);

      setBalance(walletRes.data.data.balance);
      setPortfolio(portfolioRes.data.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 5 seconds to get latest data
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleResetAccount = async () => {
    if (!window.confirm('Are you sure you want to reset your account? This will clear all your holdings and transactions, and restore your balance to ₹10,00,000.')) {
      return;
    }

    setResetting(true);
    setResetMessage('');

    try {
      const response = await api.post('/wallet/reset-account');
      if (response.data.success) {
        setResetMessage(response.data.message);
        // Refresh dashboard data
        await fetchData();
      }
    } catch (err) {
      setResetMessage(err.response?.data?.message || 'Failed to reset account');
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (error) return <div className="error-message">{error}</div>;

  const totalPortfolioValue = portfolio.reduce((sum, item) => sum + (item.currentValue || 0), 0);
  const totalProfitLoss = portfolio.reduce((sum, item) => sum + (item.profitLoss || 0), 0);
  const totalNetWorth = balance + totalPortfolioValue;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title-group">
            <div>
              <h1>Dashboard</h1>
              <p className="header-subtitle">Track your portfolio performance and market overview</p>
            </div>
          </div>
          <Link to="/trade" className="btn-primary header-action-btn">
            Trade Stocks
          </Link>
        </div>
      </header>

      {/* Reset Account Alert - Shows when net worth < 50,000 */}
      {totalNetWorth < 50000 && (
        <div className="reset-account-alert">
          <div className="reset-alert-content">
            <div className="reset-alert-icon">⚠️</div>
            <div className="reset-alert-text">
              <strong>Low Net Worth Alert!</strong>
              <p>Your net worth has fallen below ₹50,000. You can reset your account to start fresh with ₹10,00,000.</p>
            </div>
            <button
              onClick={handleResetAccount}
              disabled={resetting}
              className="btn-reset-account"
            >
              {resetting ? 'Resetting...' : 'Reset Account'}
            </button>
          </div>
          {resetMessage && <div className="reset-message">{resetMessage}</div>}
        </div>
      )}

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Wallet Balance</span>
          <div className="stat-card">
            <p className="stat-value">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-label">Portfolio Value</span>
          <div className="stat-card">
            <p className="stat-value">₹{totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-label">Total Profit/Loss</span>
          <div className={`stat-card ${totalProfitLoss >= 0 ? 'stat-card-profit' : 'stat-card-loss'}`}>
            <p className={`stat-value ${totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}₹{Math.abs(totalProfitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="stat-item">
          <span className="stat-label">Net Worth</span>
          <div className="stat-card highlight">
            <p className="stat-value">₹{totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Stock Search Component */}
      <StockSearch />

      {/* Recent Holdings Table */}
      <section className="dashboard-section">
        <h2>Your Holdings</h2>
        {portfolio.length === 0 ? (
          <div className="empty-state">
            <p>You don't own any stocks yet.</p>
            <Link to="/trade">Start Trading Now</Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Avg Price</th>
                  <th>Current Price</th>
                  <th>Value</th>
                  <th>P/L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((item) => (
                  <tr key={item.stock.symbol}>
                    <td><strong>{item.stock.symbol}</strong></td>
                    <td>{item.quantity}</td>
                    <td>₹{item.avgBuyPrice.toFixed(2)}</td>
                    <td>₹{item.stock.currentPrice.toFixed(2)}</td>
                    <td>₹{item.currentValue.toFixed(2)}</td>
                    <td className={item.profitLoss >= 0 ? 'text-success' : 'text-danger'}>
                      {item.profitLoss >= 0 ? '+' : ''}{item.profitLossPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;

