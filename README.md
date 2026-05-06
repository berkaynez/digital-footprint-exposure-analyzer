# digital-footprint-exposure-analyzer
A web-based platform for analyzing digital footprint exposure, account matching, and breach-related risk.

## Project structure

```
backend/   # Node.js + Express API (MongoDB wiring next)
frontend/  # React (Vite) web app
```

## Local development

### Prerequisites

- Node.js: **20.19+** or **22.12+** (Vite requires this)

1) Install dependencies (root workspace install):

```bash
npm install
```

2) Start both servers:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5053` (change via `backend/.env`)

## Basic API connection

- The backend exposes `GET /api/health`
- The frontend calls `/api/health` on load
- Vite proxies `/api/*` → the backend in `frontend/vite.config.js`
