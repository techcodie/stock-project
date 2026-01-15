const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Price update interval: randomized between 3-5 seconds
const UPDATE_INTERVAL_MIN = 3000;
const UPDATE_INTERVAL_MAX = 5000;

// Fluctuation range: ±0.1% to ±0.5%
const MIN_FLUCTUATION = 0.001; // 0.1%
const MAX_FLUCTUATION = 0.005; // 0.5%

// Minimum price floor
const MIN_PRICE = 1;

let priceUpdateInterval = null;

/**
 * Update all stock prices with realistic fluctuations
 */
const updateAllStockPrices = async () => {
    try {
        const stocks = await prisma.stock.findMany();

        if (stocks.length === 0) {
            return;
        }

        const updates = stocks.map(stock => {
            // Generate random fluctuation between MIN and MAX
            const fluctuation = MIN_FLUCTUATION + Math.random() * (MAX_FLUCTUATION - MIN_FLUCTUATION);
            // Randomly decide if price goes up or down
            const direction = Math.random() > 0.5 ? 1 : -1;

            // Calculate new price
            let newPrice = stock.currentPrice * (1 + direction * fluctuation);

            // Ensure price never goes below minimum
            newPrice = Math.max(MIN_PRICE, newPrice);

            // Round to 2 decimal places
            newPrice = Math.round(newPrice * 100) / 100;

            return prisma.stock.update({
                where: { id: stock.id },
                data: {
                    currentPrice: newPrice,
                    updatedAt: new Date()
                }
            });
        });

        await Promise.all(updates);
        console.log(`[Price Engine] Updated ${stocks.length} stock prices at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
        console.error('[Price Engine] Error updating prices:', error.message);
    }
};

/**
 * Get current price for a specific stock
 */
const getStockPrice = async (stockId) => {
    try {
        const stock = await prisma.stock.findUnique({
            where: { id: stockId },
            select: { currentPrice: true, symbol: true }
        });

        if (!stock) {
            throw new Error('Stock not found');
        }

        return stock.currentPrice;
    } catch (error) {
        console.error('[Price Engine] Error fetching stock price:', error.message);
        throw error;
    }
};

/**
 * Get stock with current price by ID
 */
const getStockById = async (stockId) => {
    try {
        const stock = await prisma.stock.findUnique({
            where: { id: stockId }
        });

        if (!stock) {
            throw new Error('Stock not found');
        }

        return stock;
    } catch (error) {
        console.error('[Price Engine] Error fetching stock:', error.message);
        throw error;
    }
};

/**
 * Initialize the price update engine
 */
const initializePriceEngine = () => {
    // Clear any existing interval
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }

    console.log('[Price Engine] Starting price update service...');

    // Run initial update
    updateAllStockPrices();

    // Set up recurring updates with randomized interval
    const scheduleNextUpdate = () => {
        const randomInterval = UPDATE_INTERVAL_MIN +
            Math.random() * (UPDATE_INTERVAL_MAX - UPDATE_INTERVAL_MIN);

        priceUpdateInterval = setTimeout(() => {
            updateAllStockPrices();
            scheduleNextUpdate();
        }, randomInterval);
    };

    scheduleNextUpdate();

    console.log('[Price Engine] Price update service initialized (3-5 second intervals)');
};

/**
 * Stop the price update engine
 */
const stopPriceEngine = () => {
    if (priceUpdateInterval) {
        clearTimeout(priceUpdateInterval);
        priceUpdateInterval = null;
        console.log('[Price Engine] Price update service stopped');
    }
};

module.exports = {
    initializePriceEngine,
    stopPriceEngine,
    updateAllStockPrices,
    getStockPrice,
    getStockById
};
