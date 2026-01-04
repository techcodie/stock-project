import { useState } from 'react';
import api from '../services/api';

function Trade() {
  // Buy form state
  const [buyForm, setBuyForm] = useState({
    stockId: '',
    quantity: '',
    price: ''
  });
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyMessage, setBuyMessage] = useState('');
  const [buyError, setBuyError] = useState('');

  // Sell form state
  const [sellForm, setSellForm] = useState({
    stockId: '',
    quantity: '',
    price: ''
  });
  const [sellLoading, setSellLoading] = useState(false);
  const [sellMessage, setSellMessage] = useState('');
  const [sellError, setSellError] = useState('');

  // Handle buy form input changes
  const handleBuyChange = (e) => {
    setBuyForm({
      ...buyForm,
      [e.target.name]: e.target.value
    });
    setBuyMessage('');
    setBuyError('');
  };

  // Handle sell form input changes
  const handleSellChange = (e) => {
    setSellForm({
      ...sellForm,
      [e.target.name]: e.target.value
    });
    setSellMessage('');
    setSellError('');
  };

  // Handle buy stock submission
  const handleBuySubmit = async (e) => {
    e.preventDefault();
    setBuyMessage('');
    setBuyError('');
    setBuyLoading(true);

    try {
      const response = await api.post('/trade/buy', {
        stockId: buyForm.stockId,
        quantity: parseInt(buyForm.quantity),
        price: parseFloat(buyForm.price)
      });

      if (response.data.success) {
        setBuyMessage('Stock purchased successfully!');
        // Reset form
        setBuyForm({
          stockId: '',
          quantity: '',
          price: ''
        });
      }
    } catch (err) {
      setBuyError(err.response?.data?.message || 'Failed to buy stock. Please try again.');
    } finally {
      setBuyLoading(false);
    }
  };

  // Handle sell stock submission
  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setSellMessage('');
    setSellError('');
    setSellLoading(true);

    try {
      const response = await api.post('/trade/sell', {
        stockId: sellForm.stockId,
        quantity: parseInt(sellForm.quantity),
        price: parseFloat(sellForm.price)
      });

      if (response.data.success) {
        setSellMessage('Stock sold successfully!');
        // Reset form
        setSellForm({
          stockId: '',
          quantity: '',
          price: ''
        });
      }
    } catch (err) {
      setSellError(err.response?.data?.message || 'Failed to sell stock. Please try again.');
    } finally {
      setSellLoading(false);
    }
  };

  return (
    <div className="trade-container">
      <h2>Trade Stocks</h2>

      <div className="trade-sections">
        {/* Buy Stock Section */}
        <div className="trade-section buy-section">
          <h3>Buy Stock</h3>
          <form onSubmit={handleBuySubmit} className="trade-form">
            <div className="form-group">
              <label htmlFor="buy-stockId">Stock ID</label>
              <input
                type="text"
                id="buy-stockId"
                name="stockId"
                value={buyForm.stockId}
                onChange={handleBuyChange}
                required
                disabled={buyLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="buy-quantity">Quantity</label>
              <input
                type="number"
                id="buy-quantity"
                name="quantity"
                value={buyForm.quantity}
                onChange={handleBuyChange}
                min="1"
                required
                disabled={buyLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="buy-price">Price per Share</label>
              <input
                type="number"
                id="buy-price"
                name="price"
                value={buyForm.price}
                onChange={handleBuyChange}
                min="0.01"
                step="0.01"
                required
                disabled={buyLoading}
              />
            </div>
            {buyMessage && <div className="message success">{buyMessage}</div>}
            {buyError && <div className="message error">{buyError}</div>}
            {buyLoading && <div className="loading-text">Processing...</div>}
            <button
              type="submit"
              className="btn-primary btn-buy"
              disabled={buyLoading}
            >
              Buy Stock
            </button>
          </form>
        </div>

        {/* Sell Stock Section */}
        <div className="trade-section sell-section">
          <h3>Sell Stock</h3>
          <form onSubmit={handleSellSubmit} className="trade-form">
            <div className="form-group">
              <label htmlFor="sell-stockId">Stock ID</label>
              <input
                type="text"
                id="sell-stockId"
                name="stockId"
                value={sellForm.stockId}
                onChange={handleSellChange}
                required
                disabled={sellLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sell-quantity">Quantity</label>
              <input
                type="number"
                id="sell-quantity"
                name="quantity"
                value={sellForm.quantity}
                onChange={handleSellChange}
                min="1"
                required
                disabled={sellLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sell-price">Price per Share</label>
              <input
                type="number"
                id="sell-price"
                name="price"
                value={sellForm.price}
                onChange={handleSellChange}
                min="0.01"
                step="0.01"
                required
                disabled={sellLoading}
              />
            </div>
            {sellMessage && <div className="message success">{sellMessage}</div>}
            {sellError && <div className="message error">{sellError}</div>}
            {sellLoading && <div className="loading-text">Processing...</div>}
            <button
              type="submit"
              className="btn-primary btn-sell"
              disabled={sellLoading}
            >
              Sell Stock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Trade;
