const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getWalletBalance, addBalance, resetAccount } = require('../controllers/portfolioController');

/**
 * Wallet Routes
 * All routes require JWT authentication
 */
router.use(authMiddleware);

// GET /api/wallet/balance - Get wallet balance
router.get('/balance', getWalletBalance);

// POST /api/wallet/add-balance - Add virtual balance
router.post('/add-balance', addBalance);

// POST /api/wallet/reset-account - Reset account when net worth < 50,000
router.post('/reset-account', resetAccount);

module.exports = router;