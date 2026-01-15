const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getTransactions } = require('../controllers/transactionController');

/**
 * Transaction Routes
 * All routes require JWT authentication
 */
router.use(authMiddleware);

// GET /api/transactions - Get user's transaction history
router.get('/', getTransactions);

module.exports = router;

