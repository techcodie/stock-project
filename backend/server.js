require('dotenv').config();
const app = require('./app');
const { initializePriceEngine } = require('./services/priceService');
const { initializeStocks } = require('./controllers/stockController');

// Get port from environment variables or use default
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  // Initialize stocks database with popular stocks
  console.log('Initializing stocks...');
  await initializeStocks();

  // Start price update engine
  console.log('Starting price update engine...');
  initializePriceEngine();
});
