import { useState, useEffect } from 'react';
import api from '../services/api';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, BUY, SELL

  // Fetch transactions data
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/transactions');
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (err) {
      console.error('Transactions error:', err);
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format time ago
  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t =>
    filter === 'ALL' || t.type === filter
  );

  // Calculate stats
  const buyCount = transactions.filter(t => t.type === 'BUY').length;
  const sellCount = transactions.filter(t => t.type === 'SELL').length;
  const totalVolume = transactions.reduce((sum, t) => sum + (t.quantity * t.price), 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <div>
          <h1>Transaction History</h1>
          <p className="transactions-subtitle">View all your trading activity</p>
        </div>
        <button onClick={fetchTransactions} className="btn-refresh">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9h-3m-6 9a9 9 0 0 1-9-9m9 9v-3m-9-6a9 9 0 0 1 9-9m-9 9h3m6-9v3" />
          </svg>
          Refresh
        </button>
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

      {/* Stats Cards */}
      {transactions.length > 0 && (
        <div className="transactions-stats">
          <div className="stat-card">
            <div className="stat-icon buy-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Buy Orders</div>
              <div className="stat-value">{buyCount}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon sell-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Sell Orders</div>
              <div className="stat-value">{sellCount}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon total-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Volume</div>
              <div className="stat-value">₹{totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon count-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Trades</div>
              <div className="stat-value">{transactions.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {transactions.length > 0 && (
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All ({transactions.length})
          </button>
          <button
            className={`filter-tab ${filter === 'BUY' ? 'active' : ''}`}
            onClick={() => setFilter('BUY')}
          >
            Buy ({buyCount})
          </button>
          <button
            className={`filter-tab ${filter === 'SELL' ? 'active' : ''}`}
            onClick={() => setFilter('SELL')}
          >
            Sell ({sellCount})
          </button>
        </div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
          </svg>
          <h3>No Transactions Yet</h3>
          <p>Your trading history will appear here once you start buying or selling stocks</p>
        </div>
      ) : (
        <div className="transactions-list">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className={`transaction-type-badge ${transaction.type.toLowerCase()}`}>
                {transaction.type === 'BUY' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {transaction.type}
              </div>

              <div className="transaction-main">
                <div className="transaction-stock">
                  <div className="transaction-symbol">{transaction.stock?.symbol || 'N/A'}</div>
                  <div className="transaction-name">{transaction.stock?.name || 'Unknown Stock'}</div>
                </div>

                <div className="transaction-details">
                  <div className="transaction-detail">
                    <span className="detail-label">Quantity</span>
                    <span className="detail-value">{transaction.quantity} shares</span>
                  </div>
                  <div className="transaction-detail">
                    <span className="detail-label">Price</span>
                    <span className="detail-value">₹{transaction.price?.toFixed(2)}</span>
                  </div>
                  <div className="transaction-detail">
                    <span className="detail-label">Total</span>
                    <span className="detail-value total">
                      ₹{(transaction.quantity * transaction.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="transaction-time">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {timeAgo(transaction.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Transactions;
