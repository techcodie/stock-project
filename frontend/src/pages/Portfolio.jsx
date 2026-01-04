import { useState, useEffect } from 'react';
import api from '../services/api';

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch portfolio data on component load
  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/portfolio');
      if (response.data.success) {
        setPortfolio(response.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load portfolio. Please try again.');
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

  // Calculate current value (using avgBuyPrice as current price for now)
  // Note: In a real app, you'd fetch current market price from an API
  const calculateCurrentValue = (quantity, avgBuyPrice) => {
    return quantity * avgBuyPrice;
  };

  // Calculate profit/loss
  const calculateProfitLoss = (quantity, avgBuyPrice, currentPrice = avgBuyPrice) => {
    return (currentPrice - avgBuyPrice) * quantity;
  };

  if (loading) {
    return (
      <div className="portfolio-container">
        <h2>My Portfolio</h2>
        <div className="loading-message">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-container">
        <h2>My Portfolio</h2>
        <div className="message error">{error}</div>
      </div>
    );
  }

  return (
    <div className="portfolio-container">
      <h2>My Portfolio</h2>

      {portfolio.length === 0 ? (
        <div className="empty-portfolio">
          <p>No holdings yet. Start trading to build your portfolio!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Stock Symbol</th>
                <th>Stock Name</th>
                <th>Quantity</th>
                <th>Avg Buy Price</th>
                <th>Current Value</th>
                <th>Profit / Loss</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((holding) => {
                const currentValue = calculateCurrentValue(holding.quantity, holding.avgBuyPrice);
                const profitLoss = calculateProfitLoss(holding.quantity, holding.avgBuyPrice);
                const profitLossClass = profitLoss >= 0 ? 'profit' : 'loss';

                return (
                  <tr key={holding.id}>
                    <td>{holding.stock?.symbol || 'N/A'}</td>
                    <td>{holding.stock?.name || 'N/A'}</td>
                    <td>{holding.quantity}</td>
                    <td>{formatCurrency(holding.avgBuyPrice)}</td>
                    <td>{formatCurrency(currentValue)}</td>
                    <td className={profitLossClass}>
                      {formatCurrency(profitLoss)}
                    </td>
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

export default Portfolio;
