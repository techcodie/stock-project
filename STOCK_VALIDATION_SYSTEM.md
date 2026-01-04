# Stock Validation and Pricing System

## Overview

This Virtual Stock Trading platform implements a validated lazy stock creation system with simulated pricing. The system ensures only meaningful stock symbols are created while providing realistic price movements.

## Stock Symbol Validation

### Validation Rules
- **Format**: Must contain ONLY uppercase English letters (A–Z)
- **Length**: Must be between 2 and 10 characters
- **Examples**:
  - ✅ Valid: `AAPL`, `GOOGL`, `TCS`, `RELIANCE`, `MICROSOFT`
  - ❌ Invalid: `A` (too short), `ABCDEFGHIJK` (too long), `123`, `A1B`, `apple`, `TCS@`

### Error Handling
- Invalid symbols return error: `"Invalid stock symbol"`
- No stock entry is created for invalid symbols
- Validation occurs before any database operations

## Lazy Stock Creation

### How It Works
1. **Symbol Validation**: First validates the stock symbol
2. **Existence Check**: Checks if stock already exists in database
3. **Creation Process**: If stock doesn't exist:
   - Creates new stock entry
   - Assigns random base price between ₹100 and ₹999
   - Generates company name: `{SYMBOL} Corporation Limited`
   - Sets initial volume randomly
4. **Existing Stock**: If stock exists, uses stored data

### Base Price Generation
- **Range**: ₹100 to ₹999 (random integer)
- **Frequency**: Generated ONLY once when stock is first created
- **Persistence**: Base price is stored and reused

## Price Simulation System

### Simulation Logic
- **Change Range**: -1% to +1% of current price
- **Frequency**: Applied on every stock data fetch
- **Precision**: Rounded to 2 decimal places
- **Minimum Price**: Ensures price never goes below ₹1

### Price Updates
- Prices are updated in database on each fetch
- Provides realistic market-like price movements
- No external API dependencies

## API Endpoints

### Get Stock Price
```
GET /api/stocks/:stockId/price
```
- Validates symbol if stockId is not a UUID
- Creates stock if valid and doesn't exist
- Returns simulated current price

### Get All Stocks
```
GET /api/stocks
```
- Returns all stocks with simulated prices
- Updates all stock prices with small variations

### Add Stock
```
POST /api/stocks/add
```
- Validates symbol before creation
- Uses lazy creation with validation
- Returns error for invalid symbols

## Database Schema

```sql
CREATE TABLE stocks (
  id VARCHAR(36) PRIMARY KEY,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  currentPrice DECIMAL(10,2) DEFAULT 0,
  volume INT DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Implementation Benefits

1. **Data Quality**: Only meaningful stock symbols in database
2. **Performance**: No external API calls or web scraping
3. **Reliability**: Consistent pricing without network dependencies
4. **Scalability**: Efficient lazy creation reduces database bloat
5. **Realism**: Price simulation provides market-like behavior

## Usage Examples

### Valid Stock Creation
```javascript
// Valid symbols - will create stocks
await StockValidationService.getOrCreateStock('AAPL');    // ✅
await StockValidationService.getOrCreateStock('GOOGL');   // ✅
await StockValidationService.getOrCreateStock('TCS');     // ✅
```

### Invalid Symbol Rejection
```javascript
// Invalid symbols - will return errors
await StockValidationService.getOrCreateStock('A');       // ❌ Too short
await StockValidationService.getOrCreateStock('123');     // ❌ Contains numbers
await StockValidationService.getOrCreateStock('A@B');     // ❌ Special characters
```

### Price Simulation
```javascript
// First fetch - creates stock with base price ₹456
const result1 = await getStockPrice('NEWSTOCK');
console.log(result1.currentPrice); // ₹456.00

// Second fetch - applies simulation (-1% to +1%)
const result2 = await getStockPrice('NEWSTOCK');
console.log(result2.currentPrice); // ₹458.23 (example)
```

## Configuration

### Validation Settings
- Minimum symbol length: 2 characters
- Maximum symbol length: 10 characters
- Allowed characters: A-Z (uppercase only)

### Price Settings
- Base price range: ₹100 - ₹999
- Simulation range: -1% to +1%
- Minimum price floor: ₹50.00
- Update interval: 5 minutes minimum
- Decimal precision: 2 places

## Error Messages

- `"Invalid stock symbol"` - Symbol validation failed
- `"Database error occurred"` - Database operation failed
- `"Stock not found"` - Stock doesn't exist and symbol is invalid

This system ensures a clean, validated, and realistic stock trading experience without external dependencies.