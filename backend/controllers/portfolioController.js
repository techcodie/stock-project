const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to simulate realistic price changes
const simulatePrice = (basePrice) => {
  // Generate random change between -2% and +2%
  const changePercent = (Math.random() - 0.5) * 4;
  let newPrice = basePrice + (basePrice * changePercent / 100);
  newPrice = Math.max(0.1, Math.round(newPrice * 100) / 100);
  return { price: newPrice, changePercent: parseFloat(changePercent.toFixed(2)) };
};

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

    // Inject live simulated prices
    const portfolioWithPrices = portfolio.map((holding) => {
      // Use the stock's stored currentPrice as base for simulation
      // In a real app, this would fetch from an external API
      const quote = simulatePrice(holding.stock.currentPrice);
      return {
        ...holding,
        stock: {
          ...holding.stock,
          currentPrice: quote.price,
          changePercent: quote.changePercent
        },
        currentValue: holding.quantity * quote.price,
        profitLoss: (holding.quantity * quote.price) - (holding.quantity * holding.avgBuyPrice),
        profitLossPercent: ((quote.price - holding.avgBuyPrice) / holding.avgBuyPrice) * 100
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

module.exports = {
  getPortfolio,
  getWalletBalance,
  addBalance
};
