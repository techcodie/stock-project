const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get Transactions Controller
 * Returns user's transaction history
 */
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get all transactions with stock details, ordered by most recent first
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        stock: {
          select: {
            id: true,
            symbol: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Transactions retrieved successfully',
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions
};

