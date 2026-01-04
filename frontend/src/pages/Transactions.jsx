import { useState, useEffect } from 'react';
import api from '../services/api';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch transactions data on component load
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
      setError(err.response?.data?.message || 'Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="transactions-container">
        <h2>Transaction History</h2>
        <div className="loading-message">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-container">
        <h2>Transaction History</h2>
        <div className="message error">{error}</div>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <h2>Transaction History</h2>

      {transactions.length === 0 ? (
        <div className="empty-transactions">
          <p>No transactions found. Start trading to see your transaction history!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Stock Symbol</th>
                <th>Stock Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const typeClass = transaction.type === 'BUY' ? 'type-buy' : 'type-sell';

                return (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.createdAt)}</td>
                    <td>{transaction.stock?.symbol || 'N/A'}</td>
                    <td>{transaction.stock?.name || 'N/A'}</td>
                    <td>
                      <span className={typeClass}>{transaction.type}</span>
                    </td>
                    <td>{transaction.quantity}</td>
                    <td>{formatCurrency(transaction.price)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Transactions;
