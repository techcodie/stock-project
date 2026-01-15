const express = require('express');
const router = express.Router();
const { searchStocks, getStockById, getStockPrice } = require('../controllers/stockController');
const authMiddleware = require('../middleware/authMiddleware');

// All stock routes require authentication
router.use(authMiddleware);

// GET /api/stocks - Search/List all stocks
router.get('/', searchStocks);

// GET /api/stocks/:id - Get stock by ID
router.get('/:id', getStockById);

// GET /api/stocks/:id/price - Get current price for stock
router.get('/:id/price', getStockPrice);

module.exports = router;
