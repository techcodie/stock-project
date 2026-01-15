import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StockSearch from '../components/StockSearch';

function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    fetchData();
  }, []);

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
