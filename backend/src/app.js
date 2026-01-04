require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tradingRoutes = require('./routes/tradingRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

// Import error handler
const errorHandler = require('./middlewares/errorHandler');

// Create Express application
const app = express();

// Middleware
// Parse JSON request bodies
app.use(express.json());

// Enable CORS (Cross-Origin Resource Sharing)
// Allow requests from frontend running on port 5173
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

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

