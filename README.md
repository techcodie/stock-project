# StockTrader — Virtual Trading + AI Research Platform

A full-stack application for practicing stock trading with ₹10,00,000 of virtual capital, extended with an **AI Research** feature — upload financial PDFs and ask grounded questions about them (RAG).

---

## ✨ Features

### Core trading platform

- Live simulated stock prices that update every 3–5 seconds
- Buy/sell with a wallet (₹10,00,000 starting balance)
- Real-time portfolio P&L tracking
- Full transaction history with filters
- Dashboard watchlist with auto-refreshing prices
- JWT authentication with bcrypt password hashing

### AI Research (RAG)

- Upload a 10-K, annual report, or earnings PDF
- Ask natural-language questions about it
- Answers cite the exact source passages used
- Download the original source PDF to verify LLM answers against the source
- Backed by Gemini embeddings + pgvector similarity search

### AI/ML price prediction

- A **machine-learning model** predicts whether a stock closes up or down the next day
- Trained in Python (scikit-learn) on technical-indicator features, with a documented
  Jupyter notebook (EDA → train/test → evaluation → feature importance)
- Served by a **FastAPI microservice**; shown in the UI with probability, confidence, and the
  top contributing signals
- See [ml-service/README.md](ml-service/README.md) for the model card and interview notes

---

## 🛠 Tech Stack

| Layer      | Technology                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------- |
| Frontend   | React 19 + Vite, Tailwind CSS, React Router, Recharts, Three.js, Lucide icons               |
| Backend    | Node.js + Express.js, JWT auth, bcryptjs                                                    |
| Database   | PostgreSQL with Prisma ORM + pgvector extension                                             |
| AI         | Google Gemini (`gemini-2.5-flash` + `gemini-embedding-001`), `pdf-parse`, vanilla-JS RAG    |
| ML         | Python · FastAPI · scikit-learn · pandas (price-prediction microservice + Jupyter notebook) |
| Deployment | Frontend on Vercel, backend on Render, database on Neon                                     |

---

## 📁 Project Structure

```text
stock-project/
├── backend/                 Express API (trading, portfolio, AI)
│   ├── ai/                  RAG pipeline (PDF → chunks → embeddings → answers)
│   ├── controllers/         HTTP handlers
│   ├── middleware/          JWT, error handler, multer upload
│   ├── prisma/              Schema + migrations (includes pgvector)
│   ├── routes/
│   ├── scripts/             Seed scripts (AI samples + test user portfolio)
│   └── services/
├── frontend/                React SPA
│   └── src/{pages,components,services}
├── ml-service/              Python ML microservice (FastAPI + scikit-learn)
│   ├── train.py             training + evaluation pipeline
│   ├── app.py               FastAPI serving layer
│   └── notebooks/           Jupyter notebook (full ML walk-through)
├── RAG.md                   In-depth architecture doc for the AI feature
├── render.yaml              Backend + Postgres deploy config (Render)
├── vercel.json              Frontend deploy config (Vercel)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- A **PostgreSQL** database with the `pgvector` extension. The easiest option is a free **Neon** project — pgvector is available on free tier.

### 1. Clone and configure

```bash
git clone <repository-url>
cd stock-project
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env          # then fill in DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
npx prisma generate
npx prisma migrate deploy     # runs both migrations, enables pgvector
npm run dev                   # starts on http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # starts on http://localhost:5173
```

### 4. ML prediction service (Python)

```bash
cd ml-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --port 8000   # serves price-direction predictions
```

The trained model is committed, so it runs immediately. See
[ml-service/README.md](ml-service/README.md) to retrain or use real market data.

### 5. (Optional) Seed sample AI documents

```bash
cd backend
npm run seed:ai               # seeds 3 sample financial reports for every user
```

### 6. (Optional) Seed a realistic test user portfolio

```bash
cd backend
node scripts/seedTestUserPortfolio.js
```

Resets `testuser@gmail.com` to a 60-day trading history (13 trades, 9 holdings).

---

## 🔑 Test Credentials

The fastest way in: click **"🚀 View Live Demo"** on the landing page (or
**"Try Demo Account"** on the login page) to log straight into a pre-populated
account — no typing needed.

| Account | Email                | Password  |
| ------- | -------------------- | --------- |
| Demo    | `demo@demo.com`      | `demo123` |
| Test    | `testuser@gmail.com` | `test123` |

To (re)create the demo account's data:

```bash
cd backend
npm run seed:demo                       # holdings, transactions, wallet
node scripts/seedSamples.js demo@demo.com   # 3 sample AI Research documents
```

---

## 🧭 What runs where

| Service              | Port   | Purpose                                           |
| -------------------- | ------ | ------------------------------------------------- |
| Frontend (Vite)      | `5173` | React app                                         |
| Backend (Express)    | `3000` | API + JWT auth + AI orchestration                 |
| ML service (FastAPI) | `8000` | Stock price-direction predictions (scikit-learn)  |
| Database (Postgres)  | `5432` | Trading data + AI document chunks + vectors       |

In dev, the React app uses Vite's proxy to talk to `localhost:3000`.

---

## 🧪 Useful commands

```bash
# Run frontend + backend together (from root)
npm run dev

# Stop everything
pkill -f "nodemon server.js"
pkill -f "vite"

# Reseed AI samples for one user
cd backend && npm run seed:ai user@example.com
```

---

## 🚀 Deployment Summary

- **Frontend** — Vercel (SPA rewrite via `vercel.json`)
- **Backend** — Render (config in `render.yaml`)
- **Database** — Neon (PostgreSQL with pgvector)

For deployment, set the same env vars from `.env.example` in your hosting platform. Run `prisma migrate deploy` against the production database once.

---

## 📚 Further reading

- [RAG.md](RAG.md) — full architecture and interview prep notes for the AI feature

---

*Created with ❤️ for Advanced Agentic Coding by Ansh Baheti.*
