# Virtual Stock Trading & Portfolio Management System

A full-stack virtual stock trading and portfolio management application built with Node.js, Express, React, and MySQL.

## Tech Stack

### Backend
- Node.js + Express.js
- MySQL (Prisma ORM)
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React (Vite)
- React Router DOM
- Axios
- Plain CSS

## Quick Start Guide

### Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** (comes with Node.js)

### Step 1: Clone and Setup

```bash
# Navigate to project directory
cd "STOCK PROJECT"
```

### Step 2: Start MySQL (macOS)

```bash
# Start MySQL service
brew services start mysql

# Or manually
mysql.server start

# Create database
mysql -u root -p
# In MySQL console:
CREATE DATABASE stock_db;
exit;
```

### Step 3: Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and update:
# - DATABASE_URL with your MySQL credentials
# - JWT_SECRET with a secure random string

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Start backend server
npm run dev
```

Backend runs on: `http://localhost:3000`

### Step 4: Setup Frontend (in a new terminal)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend server
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Step 5: Access Application

Open your browser and navigate to: `http://localhost:5173`

## Project Structure

```
STOCK PROJECT/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   └── README.md
└── README.md (this file)
```

## Features

- ✅ User Authentication (Signup/Login)
- ✅ JWT Token Management
- ✅ Stock Trading (Buy/Sell)
- ✅ Portfolio Management
- ✅ Transaction History
- ✅ Protected Routes

## Documentation

- **Backend API**: See [backend/README.md](./backend/README.md)
- **Frontend**: See [frontend/README.md](./frontend/README.md)

## Common Issues

### MySQL Connection Issues

```bash
# Check MySQL status
brew services list | grep mysql

# Start MySQL
brew services start mysql

# Test connection
mysql -u root -p
```

### Port Already in Use

```bash
# Find process on port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or change PORT in backend/.env
```

### CORS Errors

- Ensure backend is running on port 3000
- Ensure frontend is running on port 5173
- Check backend CORS configuration in `backend/src/app.js`

## Development

### Backend Development

```bash
cd backend
npm run dev  # Auto-restart on file changes
```

### Frontend Development

```bash
cd frontend
npm run dev  # Hot module replacement
```

## License

ISC

