import { useState } from 'react';
import api from '../services/api';
import StockChart from './StockChart';

function StockSearch() {
    const [searchSymbol, setSearchSymbol] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchSymbol.trim()) {
            setError('Please enter a stock symbol');
            return;
        }

        setLoading(true);
        setError('');
        setSearchResult(null);

        try {
            // Search for stock in the regular stocks endpoint
            const response = await api.get(`/stocks?q=${searchSymbol.trim()}`);

            if (response.data.success && response.data.data.length > 0) {
                // Get the first matching stock
                const stock = response.data.data[0];
                setSearchResult({
                    id: stock.id,
                    symbol: stock.symbol,
                    name: stock.name,
                    currentPrice: stock.currentPrice,
                    change: 0,
                    changePercent: 0,
                    volume: stock.volume || 0,
                    exchange: 'NSE'
                });
            } else {
                setError(`Stock "${searchSymbol}" not found. Try stock symbols like RELIANCE, TCS, INFY, HDFC, etc.`);
            }
        } catch (err) {
            console.error('Search error:', err);
            setError(err.response?.data?.message || 'Failed to search stock. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!searchResult) return;

        setRefreshing(true);
        try {
            // Fetch fresh price for the current stock
            const response = await api.get(`/stocks/${searchResult.id}/price`);

            if (response.data.success) {
                setSearchResult(prev => ({
                    ...prev,
                    currentPrice: response.data.data.currentPrice
                }));
            }
        } catch (err) {
            console.error('Refresh error:', err);
            setError('Failed to refresh price');
        } finally {
            setRefreshing(false);
        }
    };

    const handleClear = () => {
        setSearchSymbol('');
        setSearchResult(null);
        setError('');
    };

    return (
        <div className="stock-search-container">
            <div className="stock-search-header">
                <h2>Search Indian Stocks</h2>
                <p className="search-subtitle">Search for NSE/BSE stocks and view real-time prices</p>
            </div>

            <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-group">
                    <input
                        type="text"
                        placeholder="Enter stock symbol (e.g., RELIANCE, TCS, INFY)"
                        value={searchSymbol}
                        onChange={(e) => setSearchSymbol(e.target.value.toUpperCase())}
                        className="search-input"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="btn-search"
                        disabled={loading || !searchSymbol.trim()}
                    >
                        {loading ? (
                            <span className="btn-spinner"></span>
                        ) : (
                            'Search'
                        )}
                    </button>
                    {searchResult && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="btn-clear"
                            disabled={loading}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {error && (
                <div className="search-error">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}

            {searchResult && (
                <div className="search-result-card">
                    <div className="result-header">
                        <div>
                            <h3 className="result-symbol">{searchResult.symbol}</h3>
                            <p className="result-name">{searchResult.name}</p>
                        </div>
                        <div className="result-actions">
                            <button
                                onClick={handleRefresh}
                                className="btn-refresh-stock"
                                disabled={refreshing}
                                title="Refresh price"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={refreshing ? 'spinning' : ''}
                                >
                                    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9h-3m-6 9a9 9 0 0 1-9-9m9 9v-3m-9-6a9 9 0 0 1 9-9m-9 9h3m6-9v3" />
                                </svg>
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </button>
                            <span className="exchange-badge">{searchResult.exchange}</span>
                        </div>
                    </div>

                    <div className="result-price-section">
                        <div className="current-price">
                            <span className="price-label">Current Price</span>
                            <span className="price-value">₹{searchResult.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {searchResult.change !== 0 && (
                            <div className="price-change">
                                <span className={`change-value ${searchResult.change >= 0 ? 'positive' : 'negative'}`}>
                                    {searchResult.change >= 0 ? '+' : ''}{searchResult.change.toFixed(2)}
                                    ({searchResult.changePercent >= 0 ? '+' : ''}{searchResult.changePercent.toFixed(2)}%)
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="result-details">
                        <div className="detail-item">
                            <span className="detail-label">Volume</span>
                            <span className="detail-value">
                                {searchResult.volume ? searchResult.volume.toLocaleString('en-IN') : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <StockChart symbol={searchResult.symbol} />
                </div>
            )}

            <div className="popular-stocks">
                <p className="popular-label">Popular stocks:</p>
                <div className="popular-chips">
                    {['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICIBANK', 'SBIN'].map(symbol => (
                        <button
                            key={symbol}
                            className="chip"
                            onClick={() => {
                                setSearchSymbol(symbol);
                                setError('');
                            }}
                            disabled={loading}
                        >
                            {symbol}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default StockSearch;
