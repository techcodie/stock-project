const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { buyStock, sellStock } = require('../controllers/tradingController');

/**
 * Trading Routes
 * All routes require JWT authentication
 */
router.use(authMiddleware);

// POST /api/trade/buy - Buy stock
router.post('/buy', buyStock);

// POST /api/trade/sell - Sell stock
router.post('/sell', sellStock);

module.exports = router;

