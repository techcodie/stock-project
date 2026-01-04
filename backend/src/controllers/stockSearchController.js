const { PrismaClient } = require('@prisma/client');
const StockValidationService = require('../services/stockValidationService');
const prisma = new PrismaClient();

/**
 * Search for stocks by symbol or name
 */
const searchStocks = async (req, res, next) => {
  try {
    const query = req.query.q || req.query.query;
    
    console.log('Search query received:', query);
    
    // Validate query length to prevent excessive API calls
    if (!query || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        message: 'Query too short - need at least 2 characters',
        data: []
      });
    }

    const searchQuery = query.trim();

    // Add mock search results for common stocks
    // Add mock search results for common stocks
    const mockResults = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'META', name: 'Meta Platforms Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'NFLX', name: 'Netflix Inc.' },
      { symbol: 'UBER', name: 'Uber Technologies Inc.' },
      { symbol: 'SPOT', name: 'Spotify Technology S.A.' },
      { symbol: 'SNAP', name: 'Snap Inc.' },
      { symbol: 'ZOOM', name: 'Zoom Video Communications Inc.' },
      { symbol: 'SHOP', name: 'Shopify Inc.' },
      { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
      { symbol: 'ZOMATO', name: 'Zomato Limited' },
      { symbol: 'SWIGGY', name: 'Swiggy Limited' },
      { symbol: 'PAYTM', name: 'Paytm Limited' },
      { symbol: 'RELIANCE', name: 'Reliance Industries Limited' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Limited' },
      { symbol: 'INFY', name: 'Infosys Limited' },
      { symbol: 'HDFC', name: 'HDFC Bank Limited' },
      { symbol: 'ICICI', name: 'ICICI Bank Limited' },
      { symbol: 'BAJAJ', name: 'Bajaj Finance Limited' },
      { symbol: 'AIRTEL', name: 'Bharti Airtel Limited' }
    ];

    // Filter valid stock symbols from mock results
    const validResults = mockResults.filter(stock => 
      StockValidationService.validateSymbol(stock.symbol) &&
      (stock.symbol.includes(searchQuery.toUpperCase()) || 
       stock.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    res.status(200).json({
      success: true,
      message: 'Stock search results',
      data: validResults.slice(0, 10)
    });
  } catch (error) {
    console.error('Stock search error:', error);
    res.status(200).json({
      success: true,
      message: 'Search completed with fallback results',
      data: []
    });
  }
};

/**
 * Add a new stock to the database with validation
 */
const addStock = async (req, res, next) => {
  try {
    const { symbol, name } = req.body;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required'
      });
    }

    // Use validation service for lazy creation
    const result = await StockValidationService.getOrCreateStock(symbol);
    
    if (result.success) {
      // If name was provided and stock is new, update the name
      if (name && result.isNew) {
        const updatedStock = await prisma.stock.update({
          where: { id: result.data.id },
          data: { name: name.trim() }
        });
        result.data = updatedStock;
      }
      
      const message = result.isNew ? 
        'Stock created successfully' : 
        'Stock already exists';
        
      res.status(result.isNew ? 201 : 200).json({
        success: true,
        message: message,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchStocks,
  addStock
};