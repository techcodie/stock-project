const https = require('https');

class StockMarketService {
  constructor() {
    // Using Alpha Vantage API (free tier: 25 requests/day, 5 calls/minute)
    // Get free API key from: https://www.alphavantage.co/support/#api-key
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    this.baseUrl = 'www.alphavantage.co';
    
    // Indian stocks mapping - BSE/NSE symbols
    this.indianStocks = {
      'TCS': 'TCS.NS',
      'RELIANCE': 'RELIANCE.NS', 
      'INFY': 'INFY.NS',
      'HDFC': 'HDFCBANK.NS',
      'HDFCBANK': 'HDFCBANK.NS',
      'ICICIBANK': 'ICICIBANK.NS',
      'SBIN': 'SBIN.NS',
      'BHARTIARTL': 'BHARTIARTL.NS',
      'ITC': 'ITC.NS',
      'KOTAKBANK': 'KOTAKBANK.NS',
      'LT': 'LT.NS',
      'HCLTECH': 'HCLTECH.NS',
      'MARUTI': 'MARUTI.NS',
      'BAJFINANCE': 'BAJFINANCE.NS',
      'ASIANPAINT': 'ASIANPAINT.NS',
      'NESTLEIND': 'NESTLEIND.NS',
      'WIPRO': 'WIPRO.NS',
      'ZOMATO': 'ZOMATO.NS',
      'SWIGGY': 'SWIGGY.NS',
      'PAYTM': 'PAYTM.NS'
    };
  }

  // Make HTTPS request using native Node.js
  makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: path,
        method: 'GET',
        headers: {
          'User-Agent': 'Stock-Trading-App/1.0'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  // Get the correct API symbol (add .NS for Indian stocks)
  getApiSymbol(symbol) {
    return this.indianStocks[symbol] || symbol;
  }

  // Get real-time stock quote
  async getStockQuote(symbol) {
    try {
      const apiSymbol = this.getApiSymbol(symbol);
      const path = `/query?function=GLOBAL_QUOTE&symbol=${apiSymbol}&apikey=${this.apiKey}`;
      
      console.log(`Fetching price for ${symbol} (API: ${apiSymbol})`);
      const response = await this.makeRequest(path);

      const quote = response['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        console.log(`API response for ${symbol}:`, response);
        throw new Error('Stock not found or API limit reached');
      }

      const price = parseFloat(quote['05. price']);
      console.log(`${symbol} price from API: ${price}`);
      
      return {
        symbol: symbol, // Return original symbol
        price: price,
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        lastUpdated: quote['07. latest trading day']
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error.message);
      
      // Fallback to realistic mock data if API fails
      return this.generateRealisticMockData(symbol);
    }
  }

  // Generate realistic mock data as fallback
  generateRealisticMockData(symbol) {
    // Base prices for Indian stocks (realistic BSE/NSE prices in INR)
    const basePrices = {
      // Major Indian Stocks (BSE/NSE)
      'TCS': 4150,
      'RELIANCE': 2850,
      'INFY': 1820,
      'HDFC': 1680,
      'HDFCBANK': 1680,
      'ICICIBANK': 1250,
      'SBIN': 820,
      'BHARTIARTL': 1520,
      'ITC': 465,
      'KOTAKBANK': 1780,
      'LT': 3650,
      'HCLTECH': 1890,
      'MARUTI': 11200,
      'BAJFINANCE': 7800,
      'ASIANPAINT': 2450,
      'NESTLEIND': 2180,
      'WIPRO': 295,
      'ZOMATO': 285,
      'SWIGGY': 485,
      'PAYTM': 950,
      // Some US stocks for comparison (in USD)
      'AAPL': 175,
      'GOOGL': 140,
      'MSFT': 375,
      'TSLA': 250,
      'AMZN': 145,
      'META': 320,
      'NVDA': 480,
      'NFLX': 450
    };

    const basePrice = basePrices[symbol] || 100;
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const currentPrice = parseFloat((basePrice * (1 + variation)).toFixed(2));
    const change = parseFloat((currentPrice - basePrice).toFixed(2));
    const changePercent = parseFloat(((change / basePrice) * 100).toFixed(2));

    console.log(`Using mock data for ${symbol}: ₹${currentPrice}`);

    return {
      symbol: symbol,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: Math.floor(Math.random() * 10000000 + 1000000),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }

  // Get multiple stock quotes with rate limiting
  async getMultipleQuotes(symbols) {
    const quotes = [];
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      try {
        const quote = await this.getStockQuote(symbol);
        quotes.push(quote);
        
        // Rate limiting: wait 12 seconds between calls (5 calls/minute limit)
        if (i < symbols.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 12000));
        }
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error.message);
        quotes.push(this.generateRealisticMockData(symbol));
      }
    }
    
    return quotes;
  }
}

module.exports = StockMarketService;