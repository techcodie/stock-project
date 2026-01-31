const express = require('express');
const router = express.Router();
const { searchStocks, getStockById, getStockPrice, getStockHistory } = require('../controllers/stockController');
const authMiddleware = require('../middleware/authMiddleware');

// All stock routes require authentication
router.use(authMiddleware);

// GET /api/stocks - Search/List all stocks
router.get('/', searchStocks);

// GET /api/stocks/:symbol/history - Get historical price data
router.get('/:symbol/history', getStockHistory);

// GET /api/stocks/:id - Get stock by ID
router.get('/:id', getStockById);

// GET /api/stocks/:id/price - Get current price for stock
router.get('/:id/price', getStockPrice);

module.exports = router;
