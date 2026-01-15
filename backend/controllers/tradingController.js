const { PrismaClient } = require('@prisma/client');
const { getStockPrice } = require('../services/priceService');
const prisma = new PrismaClient();

/**
 * Buy Stock Controller
 * Server determines current price - client cannot manipulate
 */
const buyStock = async (req, res, next) => {
  try {
    const { stockId, quantity } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!stockId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'stockId and quantity are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Execute buy order in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify stock exists and get current price
      const stock = await tx.stock.findUnique({ where: { id: stockId } });
      if (!stock) throw new Error('Stock not found');

      // Get current server price (cannot be manipulated by client)
      const currentPrice = stock.currentPrice;

      // Get user wallet
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      // Calculate total cost
      const totalCost = quantity * currentPrice;

      // Check balance
      if (wallet.balance < totalCost) {
        throw new Error(`Insufficient balance. Required: ₹${totalCost.toFixed(2)}, Available: ₹${wallet.balance.toFixed(2)}`);
      }

      // Deduct money
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: totalCost } }
      });

      // Update Portfolio
      const existingPortfolio = await tx.portfolio.findUnique({
        where: { userId_stockId: { userId, stockId } }
      });

      let portfolio;
      if (existingPortfolio) {
        const currentTotalCost = existingPortfolio.quantity * existingPortfolio.avgBuyPrice;
        const newTotalCost = currentTotalCost + totalCost;
        const newQuantity = existingPortfolio.quantity + quantity;
        const newAvgPrice = newTotalCost / newQuantity;

        portfolio = await tx.portfolio.update({
          where: { userId_stockId: { userId, stockId } },
          data: { quantity: newQuantity, avgBuyPrice: newAvgPrice }
        });
      } else {
        portfolio = await tx.portfolio.create({
          data: { userId, stockId, quantity, avgBuyPrice: currentPrice }
        });
      }

      // Record Transaction
      const transaction = await tx.transaction.create({
        data: { userId, stockId, type: 'BUY', quantity, price: currentPrice }
      });

      return {
        portfolio,
        transaction,
        executedPrice: currentPrice,
        totalCost,
        stock: { symbol: stock.symbol, name: stock.name }
      };
    });

    res.status(200).json({
      success: true,
      message: `Successfully bought ${quantity} shares of ${result.stock.symbol} at ₹${result.executedPrice.toFixed(2)} per share`,
      data: {
        stockSymbol: result.stock.symbol,
        stockName: result.stock.name,
        quantity: quantity,
        executedPrice: result.executedPrice,
        totalCost: result.totalCost,
        portfolio: result.portfolio
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sell Stock Controller
 * Server determines current price - client cannot manipulate
 */
const sellStock = async (req, res, next) => {
  try {
    const { stockId, quantity } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!stockId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'stockId and quantity are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Execute sell order in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Verify stock exists and get current price
      const stock = await tx.stock.findUnique({ where: { id: stockId } });
      if (!stock) throw new Error('Stock not found');

      // Get current server price
      const currentPrice = stock.currentPrice;

      // Get user wallet
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error('Wallet not found');

      // Check portfolio
      const portfolio = await tx.portfolio.findUnique({
        where: { userId_stockId: { userId, stockId } }
      });

      if (!portfolio) {
        throw new Error(`You don't own any shares of ${stock.symbol}`);
      }

      if (portfolio.quantity < quantity) {
        throw new Error(`Insufficient shares. You own ${portfolio.quantity}, trying to sell ${quantity}`);
      }

      // Calculate proceeds
      const totalProceeds = quantity * currentPrice;

      // Add money to wallet
      await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: totalProceeds } }
      });

      // Update Portfolio
      const remainingQuantity = portfolio.quantity - quantity;
      let updatedPortfolio;

      if (remainingQuantity === 0) {
        await tx.portfolio.delete({
          where: { userId_stockId: { userId, stockId } }
        });
        updatedPortfolio = null;
      } else {
        updatedPortfolio = await tx.portfolio.update({
          where: { userId_stockId: { userId, stockId } },
          data: { quantity: remainingQuantity }
        });
      }

      // Record Transaction
      const transaction = await tx.transaction.create({
        data: { userId, stockId, type: 'SELL', quantity, price: currentPrice }
      });

      return {
        portfolio: updatedPortfolio,
        transaction,
        executedPrice: currentPrice,
        totalProceeds,
        stock: { symbol: stock.symbol, name: stock.name }
      };
    });

    res.status(200).json({
      success: true,
      message: `Successfully sold ${quantity} shares of ${result.stock.symbol} at ₹${result.executedPrice.toFixed(2)} per share`,
      data: {
        stockSymbol: result.stock.symbol,
        stockName: result.stock.name,
        quantity: quantity,
        executedPrice: result.executedPrice,
        totalProceeds: result.totalProceeds,
        portfolio: result.portfolio
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  buyStock,
  sellStock
};
