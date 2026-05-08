# Digital Footprint Exposure Analyzer

A web application that assesses a user's digital exposure risk based on their email and username. It aggregates public data signals, breach history, and username reuse patterns to generate an overall exposure score and actionable security recommendations.

## Links

- Live Demo: https://digital-footprint-exposure-analyzer.vercel.app/
- Backend API: https://digital-footprint-api-mkl5.onrender.com/

## Tech Stack

- React (Vite)
- Node.js (Express)
- Deployment: Vercel + Render

## Features

- Digital exposure scoring
- Username reuse detection
- Email breach analysis
- Risk-based recommendations

## Local Development

1. Install dependencies for both the frontend and backend:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

3. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
