# Snip — URL Shortener

A minimal URL shortener with click analytics. Built with React, Node.js, Express, and MongoDB.

## Features
- Shorten any URL instantly
- Custom alias support
- Click tracking
- Recent links history

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas

---

## Local Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your MongoDB URI
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
npm run dev
```

---

## Deploy

### Backend → Render
1. Push to GitHub
2. New Web Service on [render.com](https://render.com)
3. Root directory: `backend`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add env vars: `MONGODB_URI`, `BASE_URL` (your Render URL), `FRONTEND_URL`

### Frontend → Vercel
1. New project on [vercel.com](https://vercel.com)
2. Root directory: `frontend`
3. Add env var: `VITE_API_URL` = your Render backend URL + `/api`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shorten` | Shorten a URL |
| GET | `/api/all` | Get recent 20 URLs |
| GET | `/api/stats/:code` | Get stats for a short code |
| GET | `/:code` | Redirect to original URL |
