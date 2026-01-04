const { PrismaClient } = require('@prisma/client');
const StockValidationService = require('../services/stockValidationService');
const prisma = new PrismaClient();

/**
 * Get User's Watchlist (Dashboard Stocks)
 */
const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const watchlist = await prisma.watchlist.findMany({
      where: { userId },
      include: {
        stock: true
      },
      orderBy: {
        stock: {
          symbol: 'asc'
        }
      }
    });

    // Apply price simulation to each stock
    const updatedStocks = [];
    for (const item of watchlist) {
      let stock = item.stock;
      let changePercent = 0;
      
      // Only update price if enough time has passed
      if (StockValidationService.shouldUpdatePrice(stock.updatedAt)) {
        const priceData = StockValidationService.simulatePriceChangeWithData(stock.currentPrice);
        
        // Update price in database
        stock = await prisma.stock.update({
          where: { id: stock.id },
          data: { 
            currentPrice: priceData.price,
            updatedAt: new Date()
          }
        });
        changePercent = priceData.changePercent;
      }
      
      // Add change percentage to stock data
      stock.changePercent = changePercent;
      updatedStocks.push(stock);
    }

    res.status(200).json({
      success: true,
      message: 'Watchlist retrieved successfully',
      data: updatedStocks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Stock to Watchlist
 */
const addToWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required'
      });
    }

    // Use validation service to get or create stock
    const stockResult = await StockValidationService.getOrCreateStock(symbol);
    
    if (!stockResult.success) {
      return res.status(400).json({
        success: false,
        message: stockResult.error
      });
    }

    const stock = stockResult.data;

    // Check if already in watchlist
    const existingWatchlist = await prisma.watchlist.findUnique({
      where: {
        userId_stockId: {
          userId,
          stockId: stock.id
        }
      }
    });

    if (existingWatchlist) {
      return res.status(409).json({
        success: false,
        message: 'Stock already in watchlist'
      });
    }

    // Add to watchlist
    await prisma.watchlist.create({
      data: {
        userId,
        stockId: stock.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Stock added to watchlist successfully',
      data: stock
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Stock from Watchlist
 */
const removeFromWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { stockId } = req.params;

    // Check if stock exists in user's watchlist
    const watchlistItem = await prisma.watchlist.findUnique({
      where: {
        userId_stockId: {
          userId,
          stockId
        }
      }
    });

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found in watchlist'
      });
    }

    // Remove from watchlist
    await prisma.watchlist.delete({
      where: {
        userId_stockId: {
          userId,
          stockId
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Stock removed from watchlist successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
};