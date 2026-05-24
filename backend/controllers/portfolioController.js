const prisma = require('../lib/prisma');

/**
 * Get Portfolio Controller
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
            name: true,
            currentPrice: true
          }
        }
      }
    });

    // Calculate profit/loss from the stock's real current price. The price
    // engine (services/priceService.js) keeps stock.currentPrice fresh every
    // few seconds, so the portfolio, the trade page, and the price engine all
    // show the same price instead of each one randomizing its own.
    const portfolioWithPrices = portfolio.map((holding) => {
      const currentPrice = holding.stock.currentPrice;
      const currentValue = holding.quantity * currentPrice;
      const investedValue = holding.quantity * holding.avgBuyPrice;
      return {
        ...holding,
        currentValue,
        profitLoss: currentValue - investedValue,
        profitLossPercent:
          holding.avgBuyPrice > 0
            ? ((currentPrice - holding.avgBuyPrice) / holding.avgBuyPrice) * 100
            : 0
      };
    });

    res.status(200).json({
      success: true,
      data: portfolioWithPrices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Wallet Balance
 */
const getWalletBalance = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let wallet = await prisma.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId } });
    }

    res.status(200).json({
      success: true,
      data: { balance: wallet.balance }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Funds to Wallet
 */
const addBalance = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: { balance: { increment: parseFloat(amount) } },
      create: { userId, balance: 1000000 + parseFloat(amount) }
    });

    res.status(200).json({
      success: true,
      message: 'Funds added',
      data: { balance: wallet.balance }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Account - Clear portfolio and reset wallet to 10,00,000
 * Only allowed when net worth is below 50,000
 */
const resetAccount = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get current wallet balance
    const wallet = await prisma.wallet.findUnique({ where: { userId } });

    // Get portfolio value
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      include: { stock: true }
    });

    // Calculate total portfolio value
    const portfolioValue = portfolio.reduce((total, holding) => {
      return total + (holding.quantity * holding.stock.currentPrice);
    }, 0);

    const netWorth = (wallet?.balance || 0) + portfolioValue;

    // Check if net worth is below 50,000
    if (netWorth >= 50000) {
      return res.status(400).json({
        success: false,
        message: `Net worth (₹${netWorth.toFixed(2)}) is above ₹50,000. Account reset not allowed.`
      });
    }

    // Reset account in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all portfolio entries
      await tx.portfolio.deleteMany({ where: { userId } });

      // Delete all transactions
      await tx.transaction.deleteMany({ where: { userId } });

      // Reset wallet balance to 10,00,000
      await tx.wallet.update({
        where: { userId },
        data: { balance: 1000000 }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Account reset successfully! Your balance has been restored to ₹10,00,000.',
      data: { balance: 1000000 }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPortfolio,
  getWalletBalance,
  addBalance,
  resetAccount
};
