# Interactive Portfolio - Deployment Guide

## Overview

This is a full-stack portfolio application with:
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js (Node.js) for local development
- **API**: Vercel Serverless Functions for production
- **Database**: Neon PostgreSQL (Free Tier)
- **Authentication**: Session-based admin auth

---

## Project Structure

```
├── api-routes/          # Vercel serverless API functions
│   ├── db.js           # Database connection
│   ├── posts.js        # Posts CRUD
│   ├── experiences.js  # Experiences CRUD
│   ├── projects.js     # Projects CRUD
│   ├── certifications.js # Certifications CRUD
│   └── health.js       # Health check
├── server/             # Express.js backend (development)
├── src/                # React frontend source
├── dist/               # Built frontend assets
├── public/             # Static assets
└── vercel.json        # Vercel configuration
```

---

## Environment Variables

### Required for Production

Create a `.env` file with these variables:

```env
# =============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# =============================================================================

# -----------------------------------------------------------------------------
# FRONTEND CONFIGURATION
# -----------------------------------------------------------------------------
VITE_API_URL=https://your-project.vercel.app/api

# -----------------------------------------------------------------------------
# DATABASE CONFIGURATION (NEON POSTGRES)
# -----------------------------------------------------------------------------
# Get this from your Neon dashboard:
# 1. Go to https://console.neon.tech
# 2. Select your project
# 3. Go to Connection Details
# 4. Copy the Connection String
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require

# -----------------------------------------------------------------------------
# SERVER CONFIGURATION
# -----------------------------------------------------------------------------
PORT=4000
NODE_ENV=production

# -----------------------------------------------------------------------------
# ADMIN CREDENTIALS (CHANGE THESE!)
# -----------------------------------------------------------------------------
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password-here

# -----------------------------------------------------------------------------
# OPENROUTE API (Optional - For AI features)
# -----------------------------------------------------------------------------
OPENROUTER_API_KEY=your-openrouter-api-key
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

#### Frontend + Serverless API

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Deploy to Vercel**:
```bash
vercel --prod
```

Or connect your GitHub repository to Vercel:
- Go to https://vercel.com
- Import your repository
- Add environment variables in Vercel dashboard
- Deploy

3. **Environment Variables in Vercel**:
Add these in Project Settings > Environment Variables:
- `DATABASE_URL` - Your Neon connection string
- `ADMIN_EMAIL` - Your admin email
- `ADMIN_PASSWORD` - Your admin password
- `OPENROUTER_API_KEY` - (Optional) For AI features
- `VITE_API_URL` - Set to `/api` for serverless

#### Update Frontend API URL

For Vercel serverless, update your `src/app/lib/db.ts`:

```typescript
const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:4000/api';
```

---

### Option 2: Separate Backend Deployment

If you need a persistent backend (for caching, websockets, etc.):

#### Backend on Render/Railway/Railway:

1. **Create a new service** (e.g., on Render.com)
2. **Connect your GitHub** repository
3. **Set environment variables**:
   - `DATABASE_URL` - Your Neon connection string
   - `PORT` - 4000
   - `NODE_ENV` - production

4. **Build command**: (not needed for Node.js)
5. **Start command**: `node server/index.js`

#### Frontend on Vercel:

1. Deploy frontend only (exclude `/server` folder)
2. Set `VITE_API_URL` to your backend URL (e.g., `https://your-backend.onrender.com/api`)

---

## Database Setup (Neon)

### 1. Create Neon Project

1. Go to https://neon.tech
2. Sign up/Login
3. Create a new project:
   - Name: `portfolio-db`
   - Region: Select closest to your users
   - Plan: Free (0.5GB)

### 2. Get Connection String

1. In Neon Dashboard, click "Connection Details"
2. Select "Pooled connection" (recommended)
3. Copy the connection string
4. Replace `<password>` with your actual password

### 3. Run Database Migrations

Create the required tables:

```sql
-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    cover_image_url TEXT,
    category VARCHAR(100) DEFAULT 'Jurnal & Catatan',
    status VARCHAR(20) DEFAULT 'draft',
    reading_time INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiences table
CREATE TABLE IF NOT EXISTS experiences (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    period VARCHAR(100),
    description TEXT,
    type VARCHAR(50) DEFAULT 'work',
    image TEXT,
    images TEXT[],
    start_date DATE,
    tags TEXT[]
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,
    tags TEXT[],
    link VARCHAR(500),
    category VARCHAR(100) DEFAULT 'Web Development'
);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(255),
    credential_url VARCHAR(500),
    image TEXT,
    skills TEXT[]
);
```

### 4. Database Storage Monitoring

Track your storage usage at:
- Neon Dashboard > Your Project > Storage
- Or use the `/api/db-storage` endpoint (if implemented)

**Neon Free Tier Limits**:
- Storage: 0.5 GB
- Compute: 100 CU-hours/month
- Projects: 1

**Storage Recommendations**:
- Average image: ~500KB
- Average PDF: ~2MB
- With 0.5GB, you can store ~1000 images or ~250 PDFs

---

## Vercel Configuration

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ]
}
```

### For API Routes

The `api-routes/` folder is automatically treated as Vercel Serverless Functions.

---

## Build & Deploy Commands

### Development
```bash
# Install dependencies
npm install

# Run frontend
npm run dev

# Run backend (separate terminal)
npm run server

# Run both
npm run dev:all
```

### Production Build
```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

### Deploy to Vercel
```bash
# Deploy to Vercel (interactive)
vercel

# Deploy to production
vercel --prod
```

---

## Troubleshooting

### Common Issues

#### 1. "Database connection failed"
- Check your `DATABASE_URL` is correct
- Ensure Neon project is active (not paused)
- Check SSL settings in connection

#### 2. "API returns 404"
- For Vercel: Check `api-routes` folder exists
- Check vercel.json rewrites configuration

#### 3. "Build failed"
- Run `npm install` locally first
- Check Node.js version (use v18+)
- Clear `.vercel` folder and try again

#### 4. "CORS errors"
- Update CORS settings in backend
- For Vercel: Add your domain to allowed origins

#### 5. "Images not loading"
- Check image URLs are absolute (https://...)
- Verify image hosting (Neon is not for images!)

---

## Security Notes

1. **Change admin credentials** before deploying!
2. **Never commit** `.env` file to Git
3. **Use environment variables** for all secrets
4. **Enable SSL** in production (already configured)

---

## Performance Tips

1. **Use caching**: The server has in-memory caching enabled
2. **Optimize images**: Use WebP format, compress before upload
3. **Limit database queries**: Use pagination for large lists
4. **Monitor storage**: Check `/api/db-storage` endpoint regularly

---

## Support

- **Neon Docs**: https://neon.tech/docs
- **Vercel Docs**: https://vercel.com/docs
- **React Router**: https://reactrouter.com
- **Tailwind CSS**: https://tailwindcss.com

---

## License

MIT License - Feel free to use for your own portfolio!
