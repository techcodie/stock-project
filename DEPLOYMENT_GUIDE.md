# Stock Trading Platform - Deployment Guide

## 🚀 Vercel Deployment (Frontend + Backend)

### Option 1: Frontend on Vercel + Backend on Render (Recommended)

This is the **easiest and most reliable** approach for your full-stack app.

---

## Part A: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

Create `vercel.json` in the **root** directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/assets/(.*)",
      "dest": "/frontend/dist/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/dist/$1"
    }
  ]
}
```

### Step 2: Update Frontend API URL

Update `frontend/src/services/api.js`:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

### Step 3: Add Build Command to Root

Create `package.json` in **root** (if deleted):

```json
{
  "name": "stock-project",
  "version": "1.0.0",
  "scripts": {
    "build": "cd frontend && npm install && npm run build"
  }
}
```

### Step 4: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# For production
vercel --prod
```

**Vercel Settings:**
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install`

---

## Part B: Deploy Backend to Render

### Step 1: Create `render.yaml`

Create `render.yaml` in **root**:

```yaml
services:
  - type: web
    name: stock-trading-backend
    env: node
    buildCommand: cd backend && npm install && npx prisma generate
    startCommand: cd backend && npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: PORT
        value: 10000

databases:
  - name: stock-trading-db
    databaseName: stocktrading
    user: stockuser
```

### Step 2: Update Backend for Production

Update `backend/server.js`:

```javascript
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your `stock-project` repository
5. Configure:
   - **Name**: stock-trading-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`

6. Add Environment Variables:
   - `DATABASE_URL`: (Render will provide this)
   - `JWT_SECRET`: (generate a strong secret)
   - `PORT`: 10000

### Step 4: Database Setup on Render

1. Create PostgreSQL database on Render
2. Copy the **Internal Database URL**
3. Add to your backend environment as `DATABASE_URL`
4. Run migrations: `npx prisma migrate deploy`

---

## Part C: Connect Frontend to Backend

### Step 1: Add Environment Variable to Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`

### Step 2: Redeploy Frontend

```bash
vercel --prod
```

---

## Option 2: Monorepo Deployment (Advanced)

If you want both on Vercel, you'll need to:

1. **Frontend**: Deploy normally
2. **Backend**: Convert to Vercel Serverless Functions

This requires significant refactoring and PostgreSQL hosting elsewhere (like Supabase or Neon).

---

## 🔧 Quick Fix for Current Errors

### Common Vercel Errors:

**Error: "No Output Directory"**
```bash
# Add to vercel.json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist"
}
```

**Error: "Build Failed"**
```bash
# Make sure package.json exists in root
# Ensure all dependencies are in package.json
cd frontend && npm install
```

**Error: "API Calls Failing"**
```bash
# Add CORS in backend/app.js
app.use(cors({
  origin: ['https://your-frontend.vercel.app'],
  credentials: true
}));
```

---

## 📝 Environment Variables Needed

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@host:5432/database"
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
PORT=3000
```

### Frontend (.env)
```
VITE_API_URL="https://your-backend.onrender.com/api"
```

---

## ✅ Deployment Checklist

- [ ] Frontend builds successfully locally (`npm run build`)
- [ ] Backend runs with production database
- [ ] Environment variables configured
- [ ] CORS enabled for your frontend domain
- [ ] Database migrations executed
- [ ] API URL updated in frontend
- [ ] Both deployments tested

---

## 🎯 Recommended Approach

**For Your Project**, I recommend:

1. **Frontend** → Vercel (Free tier)
2. **Backend** → Render (Free tier)
3. **Database** → Render PostgreSQL (Free tier)

This gives you:
- ✅ Free hosting
- ✅ Automatic HTTPS
- ✅ Easy deployments
- ✅ Good performance
- ✅ Separate scaling

---

## 🆘 Troubleshooting

### Build Fails on Vercel
```bash
# Check build locally first
cd frontend
npm run build

# If it works, issue is with Vercel config
```

### Backend Connection Issues
- Check CORS settings
- Verify DATABASE_URL format
- Ensure Prisma migrations ran
- Check environment variables

### Database Connection
```bash
# Test connection locally
cd backend
npx prisma db push
npx prisma studio
```

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Prisma Deploy Guide](https://www.prisma.io/docs/guides/deployment)

---

Need help with deployment? Let me know what error you're seeing!
