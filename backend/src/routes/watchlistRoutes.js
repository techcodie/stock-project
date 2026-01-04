const express = require('express');
const router = express.Router();
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const authMiddleware = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/watchlist - Get user's watchlist
router.get('/', getWatchlist);

// POST /api/watchlist - Add stock to watchlist
router.post('/', addToWatchlist);

// DELETE /api/watchlist/:stockId - Remove stock from watchlist
router.delete('/:stockId', removeFromWatchlist);

module.exports = router;