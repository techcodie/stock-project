const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class StockValidationService {
  /**
   * Validates stock symbol according to requirements
   * @param {string} symbol - Stock symbol to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static validateSymbol(symbol) {
    if (!symbol || typeof symbol !== 'string') {
      return false;
    }

    // Must contain ONLY uppercase English letters (A–Z)
    const uppercaseSymbol = symbol.toUpperCase();
    const isValidFormat = /^[A-Z]+$/.test(uppercaseSymbol);
    
    // Length must be between 2 and 10 characters
    const isValidLength = uppercaseSymbol.length >= 2 && uppercaseSymbol.length <= 10;
    
    return isValidFormat && isValidLength;
  }

  /**
   * Generates a random base price between ₹100 and ₹999
   * @returns {number} - Random integer price
   */
  static generateRandomBasePrice() {
    return Math.floor(Math.random() * (999 - 100 + 1)) + 100;
  }

  /**
   * Generates a company name from stock symbol
   * @param {string} symbol - Stock symbol
   * @returns {string} - Generated company name
   */
  static generateCompanyName(symbol) {
    return `${symbol} Corporation Limited`;
  }

  /**
   * Checks if stock price should be updated based on last update time
   * @param {Date} lastUpdated - Last update timestamp
   * @returns {boolean} - True if price should be updated
   */
  static shouldUpdatePrice(lastUpdated) {
    if (!lastUpdated) return true;
    
    const now = new Date();
    const timeDiff = now - new Date(lastUpdated);
    const secondsSinceUpdate = timeDiff / 1000;
    
    // Update price only if more than 5 seconds have passed
    return secondsSinceUpdate >= 3;
  }
  static simulatePriceChange(currentPrice) {
    // Generate random change percentage between -1% and +1%
    const changePercent = (Math.random() - 0.5) * 2; // -1 to +1
    
    // Apply percentage change: newPrice = oldPrice + (oldPrice * changePercent / 100)
    const newPrice = currentPrice + (currentPrice * changePercent / 100);
    
    // Ensure price doesn't go below ₹50
    const finalPrice = Math.max(50, newPrice);
    
    // Round to 2 decimal places
    return Math.round(finalPrice * 100) / 100;
  }

  /**
   * Applies price simulation and returns change data
   * @param {number} currentPrice - Current stock price
   * @returns {Object} - New price and change percentage
   */
  static simulatePriceChangeWithData(currentPrice) {
    // More realistic market simulation with weighted probabilities
    const random = Math.random();
    let changePercent;
    
    if (random < 0.6) {
      // 60% chance of small change (-0.5% to +0.5%)
      changePercent = (Math.random() - 0.5) * 1; // -0.5 to +0.5
    } else if (random < 0.85) {
      // 25% chance of medium change (-1% to +1%)
      changePercent = (Math.random() - 0.5) * 2; // -1 to +1
    } else {
      // 15% chance of larger change (-2% to +2%)
      changePercent = (Math.random() - 0.5) * 4; // -2 to +2
    }
    
    // Apply percentage change: newPrice = oldPrice + (oldPrice * changePercent / 100)
    const newPrice = currentPrice + (currentPrice * changePercent / 100);
    
    // Ensure price doesn't go below ₹50
    const finalPrice = Math.max(50, newPrice);
    
    // Round to 2 decimal places
    return {
      price: Math.round(finalPrice * 100) / 100,
      changePercent: parseFloat(changePercent.toFixed(2))
    };
  }

  /**
   * Lazy stock creation with validation
   * @param {string} symbol - Stock symbol to create/fetch
   * @returns {Object} - Stock object or error
   */
  static async getOrCreateStock(symbol) {
    try {
      // Validate symbol first
      if (!this.validateSymbol(symbol)) {
        return {
          success: false,
          error: 'Invalid stock symbol'
        };
      }

      const normalizedSymbol = symbol.toUpperCase();

      // Check if stock exists
      let stock = await prisma.stock.findUnique({
        where: { symbol: normalizedSymbol }
      });

      if (stock) {
        // Stock exists - check if price should be updated
        if (this.shouldUpdatePrice(stock.updatedAt)) {
          const newPrice = this.simulatePriceChange(stock.currentPrice);
          
          // Update price in database
          stock = await prisma.stock.update({
            where: { id: stock.id },
            data: { 
              currentPrice: newPrice,
              updatedAt: new Date()
            }
          });
        }

        return {
          success: true,
          data: stock,
          isNew: false
        };
      } else {
        // Stock doesn't exist - create new one
        const basePrice = this.generateRandomBasePrice();
        const companyName = this.generateCompanyName(normalizedSymbol);

        stock = await prisma.stock.create({
          data: {
            symbol: normalizedSymbol,
            name: companyName,
            currentPrice: basePrice,
            volume: Math.floor(Math.random() * 10000000 + 1000000) // Random volume
          }
        });

        return {
          success: true,
          data: stock,
          isNew: true
        };
      }
    } catch (error) {
      console.error('Stock creation/fetch error:', error);
      return {
        success: false,
        error: 'Database error occurred'
      };
    }
  }

  /**
   * Batch process multiple stocks with validation
   * @param {string[]} symbols - Array of stock symbols
   * @returns {Object} - Results with valid and invalid stocks
   */
  static async processMultipleStocks(symbols) {
    const results = {
      validStocks: [],
      invalidSymbols: [],
      errors: []
    };

    for (const symbol of symbols) {
      const result = await this.getOrCreateStock(symbol);
      
      if (result.success) {
        results.validStocks.push(result.data);
      } else if (result.error === 'Invalid stock symbol') {
        results.invalidSymbols.push(symbol);
      } else {
        results.errors.push({ symbol, error: result.error });
      }
    }

    return results;
  }
}

module.exports = StockValidationService;