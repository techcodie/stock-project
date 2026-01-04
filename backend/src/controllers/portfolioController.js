const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get Portfolio Controller
 * Returns user's current portfolio with stock details
 */
const getPortfolio = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get all portfolio entries with stock details
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        stock: {
          select: {
            id: true,
            symbol: true,
            name: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Portfolio retrieved successfully',
      data: portfolio
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPortfolio
};

