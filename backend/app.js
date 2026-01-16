require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
// Import routes
const authRoutes = require('./routes/authRoutes');
const tradingRoutes = require('./routes/tradingRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const stockRoutes = require('./routes/stockRoutes');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

// Create Express application
const app = express();

// Middleware
// Parse JSON request bodies
app.use(express.json());

// Enable CORS (Cross-Origin Resource Sharing)
// Allow requests from frontend running on port 5173
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running'
  });
});

// API Routes
// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// Trading routes (auth required)
app.use('/api/trade', tradingRoutes);

// Portfolio routes (auth required)
app.use('/api/portfolio', portfolioRoutes);

// Transaction routes (auth required)
app.use('/api/transactions', transactionRoutes);

// Wallet routes (auth required)
app.use('/api/wallet', walletRoutes);

// Stock routes (auth required)
app.use('/api/stocks', stockRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;


// Server restart trigger for Auth Middleware updates
