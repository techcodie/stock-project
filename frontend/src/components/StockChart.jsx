import { useState, useEffect, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import api from '../services/api';

const StockChart = ({ symbol }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeframe, setTimeframe] = useState('1M');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!symbol) return;
            setLoading(true);
            setError('');
            try {
                const response = await api.get(`/stocks/${symbol}/history?timeframe=${timeframe}`);
                if (response.data.success) {
                    setHistory(response.data.data);
                } else {
                    setError('Failed to load chart data');
                }
            } catch (err) {
                console.error('Error fetching stock history:', err);
                setError('Service unavailable. Showing offline simulation.');
                // Fallback for demo purposes if backend isn't running or error occurs
                generateMockHistory(symbol, timeframe);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [symbol, timeframe]);

    const generateMockHistory = (sym, tf) => {
        // Robust fallback generator if API fails
        const points = tf === '1D' ? 24 : tf === '1W' ? 7 : tf === '1M' ? 30 : 52;
        const mockData = [];
        let lastPrice = 1500 + Math.random() * 500;
        for (let i = points; i >= 0; i--) {
            lastPrice = lastPrice * (1 + (Math.random() - 0.5) * 0.02);
            mockData.push({
                time: `Point ${points - i}`,
                price: parseFloat(lastPrice.toFixed(2))
            });
        }
        setHistory(mockData);
    };

    const isPriceUp = useMemo(() => {
        if (history.length < 2) return true;
        return history[history.length - 1].price >= history[0].price;
    }, [history]);

    const chartColor = isPriceUp ? '#10b981' : '#ef4444'; // Green-500 or Red-500

    if (loading && history.length === 0) {
        return (
            <div className="chart-loading">
                <div className="spinner"></div>
                <span>Loading Chart...</span>
            </div>
        );
    }

    return (
        <div className="stock-chart-wrapper">
            <div className="chart-controls">
                <div className="timeframe-selector">
                    {['1D', '1W', '1M', '1Y'].map((tf) => (
                        <button
                            key={tf}
                            className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                            onClick={() => setTimeframe(tf)}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
                {error && <span className="chart-error-msg">{error}</span>}
            </div>

            <div className="chart-container" style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <AreaChart data={history}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                        <XAxis
                            dataKey="time"
                            hide={true}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            orientation="right"
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: chartColor }}
                            labelStyle={{ display: 'none' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke={chartColor}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <style sx>{`
                .stock-chart-wrapper {
                    background: #111827;
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid #374151;
                    margin-top: 20px;
                }
                .chart-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .timeframe-selector {
                    display: flex;
                    gap: 8px;
                    background: #1f2937;
                    padding: 4px;
                    border-radius: 8px;
                }
                .tf-btn {
                    padding: 4px 12px;
                    border-radius: 6px;
                    border: none;
                    background: transparent;
                    color: #9ca3af;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tf-btn:hover {
                    color: #fff;
                }
                .tf-btn.active {
                    background: #374151;
                    color: #fff;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                .chart-loading {
                    height: 300px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    background: #111827;
                    border-radius: 12px;
                    color: #9ca3af;
                }
                .spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid #374151;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 10px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .chart-error-msg {
                    font-size: 12px;
                    color: #9ca3af;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export default StockChart;
