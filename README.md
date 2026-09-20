# INE Product Price Tracker (Web Scraping Assignment)

Full-stack web application built for the **INE Software Engineer Intern Assignment**. It lets users pick products from INE's hosted mock store (`https://demo.inelabteamdev.com/`), track their price and stock on a scheduled basis, view historical price trends as an interactive chart, inspect honest per-product scrape logs, and execute observable (headed) scraping runs for screen recording.

---

## 🌟 Tech Stack

- **Frontend**: React (Vite), Recharts, Lucide Icons, Glassmorphism Vanilla CSS Design System (Deployable to Vercel).
- **Backend**: Node.js, Express, Playwright (Deployable to Render.com).
- **Database**: Supabase (PostgreSQL) for products, tracked items, price history, and audit scrape logs.
- **Scheduling**: External Cron (`cron-job.org` / Render Cron) calling `/api/cron/scrape-all`.

---

## 🚀 How to Run the Code Locally

### Prerequisites
- Node.js (v18 or higher)
- Supabase account & project

### 1. Database Setup (Supabase)
1. Open your Supabase SQL Editor.
2. Execute the schema script located at [`database/schema.sql`](./database/schema.sql).
3. This creates the required tables (`products`, `tracked_products`, `price_history`, `scrape_logs`) and indexes.

### 2. Backend Setup
```bash
cd backend
npm install
```

Configure your environment variables in `backend/.env`:
```env
PORT=5000
STORE_BASE_URL=https://demo.inelabteamdev.com
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CRON_SECRET=your-cron-secret-key
```

Start the backend server:
```bash
npm run dev
```
The Express backend server will run on `http://localhost:5000`.

### 3. Observable (Headed) Scraper Run (For Video Recording)
To watch the Playwright scraper interact with the store in headed mode (with mouse movements, dwell time, and trusted click):
```bash
cd backend
npm run scrape:headed
```
Or test a specific product URL:
```bash
node src/scripts/runHeadedScrape.js https://demo.inelabteamdev.com/product/854
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

Configure environment variable in `frontend/.env` (optional, defaults to `http://localhost:5000`):
```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```
The React dashboard will run at `http://localhost:5173`.

---

## ⚙️ Scheduled Scraping (Every 2 Hours)

Because free-tier backends (Render) go to sleep after inactivity, scheduled scraping is triggered via an external cron service (**cron-job.org**):
- **URL**: `https://your-backend-render-url.onrender.com/api/cron/scrape-all`
- **Schedule**: Every 2 Hours (`0 */2 * * *`)
- **Method**: `POST` (or `GET`)
- **Headers**: `Authorization: Bearer <CRON_SECRET>`

---

## 📊 Deployment Guide

- **Frontend (Vercel)**: Connect your GitHub repo, set root directory to `frontend`, and environment variable `VITE_API_BASE_URL`.
- **Backend (Render)**: Create a Web Service from the repo, root directory `backend`, build command `npm install`, start command `npm start`, and configure `.env` secrets.
- **Database (Supabase)**: Managed PostgreSQL instance.
