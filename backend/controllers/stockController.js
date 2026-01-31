const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateHistoricalData } = require('../services/stockHistoryService');

// Popular stocks for autocomplete
const POPULAR_STOCKS = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Limited' },
    { symbol: 'TCS', name: 'Tata Consultancy Services Limited' },
    { symbol: 'INFY', name: 'Infosys Limited' },
    { symbol: 'HDFC', name: 'HDFC Bank Limited' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Limited' },
    { symbol: 'SBIN', name: 'State Bank of India' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited' },
    { symbol: 'ITC', name: 'ITC Limited' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited' },
    { symbol: 'LT', name: 'Larsen & Toubro Limited' },
    { symbol: 'WIPRO', name: 'Wipro Limited' },
    { symbol: 'ASIANPAINT', name: 'Asian Paints Limited' }
];

/**
 * Search/List Stocks
 */
const searchStocks = async (req, res, next) => {
    try {
        const query = (req.query.q || req.query.query || '').trim().toUpperCase();

        let stocks;
        if (query) {
            // Search by symbol or name (case-insensitive via uppercase comparison)
            stocks = await prisma.stock.findMany({
                where: {
                    OR: [
                        { symbol: { contains: query } },
                        { name: { contains: query } }
                    ]
                },
                orderBy: { symbol: 'asc' },
                take: 20
            });
        } else {
            // Return all stocks
            stocks = await prisma.stock.findMany({
                orderBy: { symbol: 'asc' }
            });
        }

        res.status(200).json({
            success: true,
            data: stocks
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get stock by ID with current price
 */
const getStockById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const stock = await prisma.stock.findUnique({
            where: { id }
        });

        if (!stock) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found'
            });
        }

        res.status(200).json({
            success: true,
            data: stock
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current price for a stock
 */
const getStockPrice = async (req, res, next) => {
    try {
        const { id } = req.params;

        const stock = await prisma.stock.findUnique({
            where: { id },
            select: {
                id: true,
                symbol: true,
                name: true,
                currentPrice: true,
                updatedAt: true
            }
        });

        if (!stock) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: stock.id,
                symbol: stock.symbol,
                name: stock.name,
                currentPrice: stock.currentPrice,
                lastUpdated: stock.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get historical price data for a stock
 */
const getStockHistory = async (req, res, next) => {
    try {
        const { symbol } = req.params;
        const { timeframe = '1M' } = req.query;

        const stock = await prisma.stock.findUnique({
            where: { symbol: symbol.toUpperCase() }
        });

        if (!stock) {
            return res.status(404).json({
                success: false,
                message: 'Stock not found'
            });
        }

        const history = generateHistoricalData(stock.symbol, timeframe, stock.currentPrice);

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Initialize stocks with realistic starting prices
 */
const initializeStocks = async () => {
    try {
        for (const stockData of POPULAR_STOCKS) {
            const existing = await prisma.stock.findUnique({
                where: { symbol: stockData.symbol }
            });

            if (!existing) {
                // Create with realistic Indian stock prices (₹100-₹3000)
                const basePrice = Math.floor(Math.random() * 2900) + 100;

                await prisma.stock.create({
                    data: {
                        symbol: stockData.symbol,
                        name: stockData.name,
                        currentPrice: basePrice,
                        volume: Math.floor(Math.random() * 10000000 + 1000000)
                    }
                });
                console.log(`[Stock Init] Created ${stockData.symbol} at ₹${basePrice}`);
            }
        }
        console.log('[Stock Init] Stock initialization complete');
    } catch (error) {
        console.error('[Stock Init] Error initializing stocks:', error.message);
    }
};

module.exports = {
    searchStocks,
    getStockById,
    getStockPrice,
    getStockHistory,
    initializeStocks
};
