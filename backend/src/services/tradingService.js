const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Trading Service - Handles buy and sell trading logic
 */

/**
 * Buy Stock Service
 * Processes a buy order: deducts money, updates portfolio, creates transaction
 */
const buyStock = async (userId, stockId, quantity, price) => {
  // Use transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Get user wallet
    const wallet = await tx.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Calculate total cost
    const totalCost = quantity * price;

    // Check if user has sufficient balance
    if (wallet.balance < totalCost) {
      throw new Error('Insufficient balance');
    }

    // Verify stock exists
    const stock = await tx.stock.findUnique({
      where: { id: stockId }
    });

    if (!stock) {
      throw new Error('Stock not found');
    }

    // Deduct money from wallet
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: totalCost
        }
      }
    });

    // Check if user already has this stock in portfolio
    const existingPortfolio = await tx.portfolio.findUnique({
      where: {
        userId_stockId: {
          userId,
          stockId
        }
      }
    });

    let portfolio;

    if (existingPortfolio) {
      // Update existing portfolio entry
      // Calculate new average buy price
      const currentTotalCost = existingPortfolio.quantity * existingPortfolio.avgBuyPrice;
      const newTotalCost = currentTotalCost + totalCost;
      const newQuantity = existingPortfolio.quantity + quantity;
      const newAvgPrice = newTotalCost / newQuantity;

      portfolio = await tx.portfolio.update({
        where: {
          userId_stockId: {
            userId,
            stockId
          }
        },
        data: {
          quantity: newQuantity,
          avgBuyPrice: newAvgPrice
        }
      });
    } else {
      // Create new portfolio entry
      portfolio = await tx.portfolio.create({
        data: {
          userId,
          stockId,
          quantity,
          avgBuyPrice: price
        }
      });
    }

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        stockId,
        type: 'BUY',
        quantity,
        price
      }
    });

    return {
      portfolio,
      transaction
    };
  });
};

/**
 * Sell Stock Service
 * Processes a sell order: adds money, updates portfolio, creates transaction
 */
const sellStock = async (userId, stockId, quantity, price) => {
  // Use transaction to ensure data consistency
  return await prisma.$transaction(async (tx) => {
    // Get user wallet
    const wallet = await tx.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Verify stock exists
    const stock = await tx.stock.findUnique({
      where: { id: stockId }
    });

    if (!stock) {
      throw new Error('Stock not found');
    }

    // Get user's portfolio entry for this stock
    const portfolio = await tx.portfolio.findUnique({
      where: {
        userId_stockId: {
          userId,
          stockId
        }
      }
    });

    if (!portfolio) {
      throw new Error('Stock not in portfolio');
    }

    // Check if user has sufficient quantity
    if (portfolio.quantity < quantity) {
      throw new Error('Insufficient shares');
    }

    // Calculate total proceeds
    const totalProceeds = quantity * price;

    // Add money to wallet
    await tx.wallet.update({
      where: { userId },
      data: {
        balance: {
          increment: totalProceeds
        }
      }
    });

    // Update or delete portfolio entry
    const remainingQuantity = portfolio.quantity - quantity;
    let updatedPortfolio;

    if (remainingQuantity === 0) {
      // Delete portfolio entry if no shares remaining
      await tx.portfolio.delete({
        where: {
          userId_stockId: {
            userId,
            stockId
          }
        }
      });
      updatedPortfolio = null;
    } else {
      // Update portfolio entry with remaining quantity
      updatedPortfolio = await tx.portfolio.update({
        where: {
          userId_stockId: {
            userId,
            stockId
          }
        },
        data: {
          quantity: remainingQuantity
          // avgBuyPrice remains the same when selling
        }
      });
    }

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId,
        stockId,
        type: 'SELL',
        quantity,
        price
      }
    });

    return {
      portfolio: updatedPortfolio,
      transaction
    };
  });
};

module.exports = {
  buyStock,
  sellStock
};

