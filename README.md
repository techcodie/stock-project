# StockTrader - Virtual Stock Trading Platform

A comprehensive full-stack application for practicing stock trading with virtual money. Build your portfolio, track live price movements, and master trading strategies without any real financial risk.

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher) - or a hosted database like Neon (PostgreSQL via Prisma)
- **npm** (comes with Node.js)

### Step 1: System Setup
```bash
# Clone the repository
git clone <repository-url>
cd "STOCK PROJECT"
```

### Step 2: Backend Configuration
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your database connection string
   - Set a secure `JWT_SECRET`
4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```
5. Start the backend: `npm run dev`

### Step 3: Frontend Configuration
1. Open a new terminal and navigate to the frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Start the frontend: `npm run dev`

---

## 🔑 Test Credentials
To explore the application without creating a new account, use the following test user:

| Role | Email | Password |
|------|-------|----------|
| **Test User** | `testuser@gmail.com` | `test123` |

---

## 🛠 Tech Stack
- **Frontend**: React (Vite), React Router, Axios, Plain CSS, Three.js (for backgrounds)
- **Backend**: Node.js, Express.js
- **Database**: Prisma ORM (supports MySQL/PostgreSQL)
- **Auth**: JWT (JSON Web Tokens) with bcryptjs hashing

---

## ✨ Features
- **Real-time Simulation**: Prices fluctuate every 3-5 seconds.
- **Virtual Wallet**: Start with ₹10,00,000 to practice trading.
- **Portfolio Management**: Real-time tracking of profit/loss.
- **Account Reset**: Ability to reset and start fresh if net worth falls below ₹50,000.
- **Comprehensive History**: Detailed transaction logs for all trades.
- **Beautiful UI**: Modern dark theme with glassmorphism and 3D background effects.

---

## 📁 Project Structure
```text
STOCK PROJECT/
├── backend/          # Express API, Prisma schema, and logic
├── frontend/         # React application and styles
├── prisma/           # Database migrations and schema
└── README.md         # Project documentation (this file)
```

---

## 🛠 Common Fixes
- **MySQL Connection**: Ensure MySQL service is running (`brew services start mysql` on macOS).
- **Port Conflict**: If port 3000 (Backend) or 5173 (Frontend) are busy, use `lsof -ti:PORT` and `kill -9 <PID>` to clear them.
- **Database Errors**: If the schema changes, run `npx prisma generate` and `npx prisma migrate dev`.

---

## 🚀 Deployment Summary
- **Frontend**: Best deployed to **Vercel**.
- **Backend**: Recommended to use **Render** or **Railway**.
- **Database**: Use a managed service like **Neon (PostgreSQL)** or **Railway MySQL**.

---
*Created with ❤️ for Advanced Agentic Coding by Ansh Baheti.*
