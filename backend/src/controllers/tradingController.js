const tradingService = require('../services/tradingService');

/**
 * Buy Stock Controller
 */
const buyStock = async (req, res, next) => {
  try {
    const { stockId, quantity, price } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!stockId || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'stockId, quantity, and price are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    // Execute buy order
    const result = await tradingService.buyStock(userId, stockId, parseInt(quantity), parseFloat(price));

    res.status(200).json({
      success: true,
      message: 'Stock purchased successfully',
      data: result
    });
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
};

/**
 * Sell Stock Controller
 */
const sellStock = async (req, res, next) => {
  try {
    const { stockId, quantity, price } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!stockId || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'stockId, quantity, and price are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    // Execute sell order
    const result = await tradingService.sellStock(userId, stockId, parseInt(quantity), parseFloat(price));

    res.status(200).json({
      success: true,
      message: 'Stock sold successfully',
      data: result
    });
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
};

module.exports = {
  buyStock,
  sellStock
};

