# Virtual Stock Trading & Portfolio Management - Frontend

React frontend for the Virtual Stock Trading & Portfolio Management System.

## Tech Stack

- **Framework**: React (Vite)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: Plain CSS

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Backend server running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install
```

### Run Development Server

```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Trade.jsx
│   │   ├── Portfolio.jsx
│   │   └── Transactions.jsx
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── services/
│   │   └── api.js (Axios instance)
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   └── index.css
└── package.json
```

## Configuration

### API Configuration

The API base URL is configured in `src/services/api.js`:

```javascript
baseURL: "http://localhost:3000/api";
```

JWT tokens are automatically attached to requests via Axios interceptor.

## Features

- User authentication (Signup/Login)
- JWT token management
- Stock trading (Buy/Sell)
- Portfolio management
- Transaction history
- Protected routes

## Environment

- **Development**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000/api`
- **JWT Storage**: localStorage (key: `token`)
