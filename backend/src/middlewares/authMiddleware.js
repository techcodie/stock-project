const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches userId to request
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization header is required' 
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }

    // Verify JWT token
    // If valid, decoded will contain the payload (userId)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach userId to request object for use in controllers
    req.user = {
      userId: decoded.userId
    };

    // Proceed to next middleware/controller
    next();
  } catch (error) {
    // Token is invalid or expired
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = authMiddleware;

