const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches userId to request
 */
const authMiddleware = async (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user actually exists in the database
    // This is critical if the database was reset but the user still has a valid JWT
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists. Please login again.'
      });
    }

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
