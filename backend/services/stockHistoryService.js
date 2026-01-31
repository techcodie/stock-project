/**
 * Service to handle historical stock price data
 * In a real-world app, this would fetch from Yahoo Finance, Alpha Vantage, etc.
 * For this demo, we use a robust random walk generator to create realistic charts.
 */

const generateHistoricalData = (symbol, timeframe = '1M', currentPrice = 150) => {
    const data = [];
    let points = 30; // Default for 1M
    let intervalDays = 1;

    switch (timeframe) {
        case '1D':
            points = 24; // Hourly for 1 day
            intervalDays = 1 / 24;
            break;
        case '1W':
            points = 7;
            intervalDays = 1;
            break;
        case '1M':
            points = 30;
            intervalDays = 1;
            break;
        case '1Y':
            points = 52; // Weekly for 1 year
            intervalDays = 7;
            break;
        default:
            points = 30;
    }

    let lastPrice = currentPrice * (0.8 + Math.random() * 0.4); // Start somewhere around 20% of current
    const now = new Date();

    for (let i = points; i >= 0; i--) {
        const date = new Date(now.getTime() - i * intervalDays * 24 * 60 * 60 * 1000);

        // Random walk: next price = last price + random change
        // Volatility is ~2% per point
        const volatility = 0.02;
        const change = lastPrice * volatility * (Math.random() - 0.5);
        lastPrice = lastPrice + change;

        // Ensure price doesn't go below zero
        if (lastPrice < 1) lastPrice = 1 + Math.random();

        data.push({
            time: date.toISOString().split('T')[0] + (timeframe === '1D' ? ' ' + date.getHours() + ':00' : ''),
            price: parseFloat(lastPrice.toFixed(2))
        });
    }

    // Adjust the last point to match currentPrice roughly
    data[data.length - 1].price = currentPrice;

    return data;
};

module.exports = {
    generateHistoricalData
};
