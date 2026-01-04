const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getWalletBalance, addBalance } = require('../controllers/portfolioController');

/**
 * Wallet Routes
 * All routes require JWT authentication
 */
router.use(authMiddleware);

// GET /api/wallet/balance - Get wallet balance
router.get('/balance', getWalletBalance);

// POST /api/wallet/add-balance - Add virtual balance
router.post('/add-balance', addBalance);

module.exports = router;