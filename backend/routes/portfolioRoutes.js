const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getPortfolio } = require('../controllers/portfolioController');

/**
 * Portfolio Routes
 * All routes require JWT authentication
 */
router.use(authMiddleware);

// GET /api/portfolio - Get user's portfolio
router.get('/', getPortfolio);

module.exports = router;

