# Virtual Stock Trading & Portfolio Management API

A REST API for virtual stock trading and portfolio management. Users can create accounts, buy/sell stocks, and track their portfolio and transaction history.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Project Structure

```
backend/
 ├── package.json
 ├── .env.example
 ├── prisma/
 │   └── schema.prisma
 └── src/
     ├── controllers/
     │   ├── authController.js
     │   ├── tradingController.js
     │   ├── portfolioController.js
     │   └── transactionController.js
     ├── services/
     │   └── tradingService.js
     ├── routes/
     │   ├── authRoutes.js
     │   ├── tradingRoutes.js
     │   ├── portfolioRoutes.js
     │   └── transactionRoutes.js
     ├── middlewares/
     │   ├── authMiddleware.js
     │   └── errorHandler.js
     ├── app.js
     └── server.js
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Create MySQL Database

First, create a MySQL database:

```sql
CREATE DATABASE stock_db;
```

#### Configure Environment Variables

Copy the example environment file and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` file with your MySQL connection details:

```
DATABASE_URL="mysql://username:password@localhost:3306/stock_db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3000
```

#### Generate Prisma Client

```bash
npx prisma generate
```

#### Run Database Migrations

This will create all tables in your MySQL database:

```bash
npx prisma migrate dev --name init
```

### 3. Run the Server

#### Development Mode (with auto-restart)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Authentication Endpoints

#### Signup

- **POST** `/api/auth/signup`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: User object (password excluded)
- **Note**: Automatically creates wallet with $1,000,000 initial balance

#### Login

- **POST** `/api/auth/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response**: JWT token and user object

### Trading Endpoints (Require Authentication)

All trading endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

#### Buy Stock

- **POST** `/api/trade/buy`
- **Body**:
  ```json
  {
    "stockId": "stock-uuid",
    "quantity": 10,
    "price": 150.5
  }
  ```
- **Response**: Portfolio entry and transaction record
- **Logic**: Deducts money from wallet, updates/creates portfolio entry, calculates average buy price

#### Sell Stock

- **POST** `/api/trade/sell`
- **Body**:
  ```json
  {
    "stockId": "stock-uuid",
    "quantity": 5,
    "price": 155.75
  }
  ```
- **Response**: Updated portfolio entry (or null if all shares sold) and transaction record
- **Logic**: Adds money to wallet, reduces/deletes portfolio entry

### Portfolio Endpoints (Require Authentication)

#### Get Portfolio

- **GET** `/api/portfolio`
- **Response**: Array of user's portfolio entries with stock details
- Returns all stocks owned by the user with quantity and average buy price

### Transaction Endpoints (Require Authentication)

#### Get Transactions

- **GET** `/api/transactions`
- **Response**: Array of user's transaction history (most recent first)
- Returns all BUY and SELL transactions with stock details

## Database Models

### User

- Stores user account information
- Automatically creates a wallet with $1,000,000 initial balance on signup

### Wallet

- Stores user's virtual cash balance
- One wallet per user
- Initial balance: $1,000,000

### Stock

- Stores available stocks in the market
- Contains symbol and company name

### Portfolio

- Stores user's stock portfolio (shares owned)
- Tracks quantity and average buy price
- One entry per user per stock

### Transaction

- Stores buy/sell transaction history
- Records type (BUY/SELL), quantity, price, and timestamp
- All trading activity is logged here

## Prisma Commands

- **Generate Prisma Client**: `npx prisma generate`
- **Create Migration**: `npx prisma migrate dev --name <migration-name>`
- **Open Prisma Studio** (Database GUI): `npx prisma studio`

## Testing the API

### Using cURL

#### Signup

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

#### Buy Stock (with token)

```bash
curl -X POST http://localhost:3000/api/trade/buy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"stockId":"stock-uuid","quantity":10,"price":150.50}'
```

#### Sell Stock (with token)

```bash
curl -X POST http://localhost:3000/api/trade/sell \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"stockId":"stock-uuid","quantity":5,"price":155.75}'
```

#### Get Portfolio (with token)

```bash
curl -X GET http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Get Transactions (with token)

```bash
curl -X GET http://localhost:3000/api/transactions \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Trading Logic

### Buy Stock

1. Validates user has sufficient balance
2. Deducts money from wallet (quantity × price)
3. Updates existing portfolio entry or creates new one
4. Recalculates average buy price when adding to existing position
5. Creates transaction record

### Sell Stock

1. Validates stock exists in user's portfolio
2. Validates user has sufficient quantity to sell
3. Adds money to wallet (quantity × price)
4. Reduces portfolio quantity or deletes entry if all shares sold
5. Creates transaction record

## Error Handling

The API uses a global error handler middleware that returns appropriate HTTP status codes:

- `400` - Bad Request (insufficient balance, invalid input)
- `401` - Unauthorized (invalid/missing JWT token)
- `404` - Not Found (stock/wallet not found)
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## How to Run Locally on macOS

### Prerequisites

1. **Node.js** (v16 or higher)

   - Check: `node --version`
   - Install: [Download from nodejs.org](https://nodejs.org/)

2. **MySQL** (v8.0 or higher)

   - Install via Homebrew: `brew install mysql`
   - Or download from [mysql.com](https://dev.mysql.com/downloads/mysql/)
   - Start MySQL service: `brew services start mysql`

3. **npm** (comes with Node.js)

### Step 1: Start MySQL

```bash
# Start MySQL service (if not already running)
brew services start mysql

# Or start MySQL manually
mysql.server start

# Verify MySQL is running
mysql -u root -p
# Enter your MySQL root password (default may be empty, just press Enter)
```

### Step 2: Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Run in MySQL console:
CREATE DATABASE stock_db;
exit;
```

### Step 3: Configure Environment Variables

```bash
# Navigate to backend directory
cd backend

# Copy example environment file
cp .env.example .env

# Edit .env file with your MySQL credentials
# Update DATABASE_URL with your MySQL username and password
```

**Important**: Update `.env` file:

- Replace `username:password` in `DATABASE_URL` with your MySQL credentials
- Change `JWT_SECRET` to a secure random string (generate one using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### Step 4: Install Dependencies

```bash
# In backend directory
npm install
```

### Step 5: Setup Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations (creates all tables)
npx prisma migrate dev --name init
```

### Step 6: Run Backend Server

```bash
# Development mode (auto-restart on file changes)
npm run dev

# Or production mode
npm start
```

**Backend runs on**: `http://localhost:3000`

**Health check**: Open `http://localhost:3000/health` in browser to verify

### Step 7: Run Frontend (in a new terminal)

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Frontend runs on**: `http://localhost:5173`

### Verify Setup

1. Open browser: `http://localhost:5173`
2. You should see the application homepage
3. Try signing up a new user
4. Backend should be accessible at `http://localhost:3000`

### Common Issues & Fixes

#### MySQL Connection Error

**Error**: `Can't connect to MySQL server` or `Access denied`

**Solutions**:

```bash
# Check if MySQL is running
brew services list | grep mysql

# Start MySQL if not running
brew services start mysql

# Reset MySQL root password if needed
mysql_secure_installation

# Update DATABASE_URL in .env with correct credentials
```

#### Port Already in Use

**Error**: `Port 3000 is already in use`

**Solutions**:

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or change PORT in .env to a different port (e.g., 3001)
```

#### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:

```bash
cd backend
npx prisma generate
```

#### CORS Error in Browser

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:

- Ensure backend CORS is configured for `http://localhost:5173`
- Verify backend is running on port 3000
- Check browser console for specific error details

#### Database Migration Errors

**Error**: `Migration failed` or `Table already exists`

**Solutions**:

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or check migration status
npx prisma migrate status

# Fix migration manually if needed
npx prisma migrate dev --name fix
```

#### Frontend Can't Connect to Backend

**Error**: `Network Error` or `Connection refused`

**Solutions**:

- Verify backend is running: `curl http://localhost:3000/health`
- Check frontend `src/services/api.js` has correct `baseURL: 'http://localhost:3000/api'`
- Ensure no firewall is blocking connections
- Check both terminals show no errors

### Troubleshooting Tips

1. **Check logs**: Both backend and frontend terminals show detailed error messages
2. **Clear cache**: Delete `node_modules` and reinstall if dependencies seem corrupted
3. **Database connection**: Test MySQL connection directly using `mysql -u root -p`
4. **Port conflicts**: Ensure ports 3000 (backend) and 5173 (frontend) are available

## Notes

- Passwords are hashed using bcryptjs before storing
- JWT tokens expire after 24 hours
- All trading, portfolio, and transaction endpoints require authentication
- Trading operations use database transactions to ensure data consistency
- Portfolio average buy price is recalculated when buying more shares of an existing position
- Backend CORS is configured to allow requests from `http://localhost:5173`
