/**
 * Global Error Handler Middleware
 * Handles all errors and sends appropriate HTTP responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err.message === 'Insufficient balance') {
    return res.status(400).json({
      success: false,
      message: 'Insufficient balance to complete transaction'
    });
  }

  if (err.message === 'Stock not found') {
    return res.status(404).json({
      success: false,
      message: 'Stock not found'
    });
  }

  if (err.message === 'Stock not in portfolio') {
    return res.status(400).json({
      success: false,
      message: 'Stock not found in your portfolio'
    });
  }

  if (err.message === 'Insufficient shares') {
    return res.status(400).json({
      success: false,
      message: 'Insufficient shares to sell'
    });
  }

  if (err.message === 'Wallet not found') {
    return res.status(404).json({
      success: false,
      message: 'Wallet not found'
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found'
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;

