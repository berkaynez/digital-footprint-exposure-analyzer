const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const healthRouter = require('./routes/health')
const usernameVariationsRouter = require('./routes/usernameVariations')
const analyzeRouter = require('./routes/analyze')

function createApp() {
  const app = express()

  app.use(express.json({ limit: '100kb' }))

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://digital-footprint-exposure-analyzer.vercel.app',
    process.env.FRONTEND_ORIGIN,
    process.env.FRONTEND_URL,
  ].filter(Boolean)

  app.use(
    cors({
      origin: (origin, callback) => {
        const isVercel = origin && origin.endsWith('.vercel.app')
        if (!origin || allowedOrigins.includes(origin) || isVercel) {
          callback(null, true)
        } else {
          console.warn(`CORS Blocked: ${origin}`)
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true,
    }),
  )

  app.get('/', (_req, res) => {
    res.json({ ok: true, service: "digital-footprint-api", message: "API is running" })
  })

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per window
    standardHeaders: true,
    legacyHeaders: false,
  })

  app.use('/api/health', healthRouter)
  app.use('/api/username-variations', apiLimiter, usernameVariationsRouter)
  app.use('/api/analyze', apiLimiter, analyzeRouter)

  return app
}

module.exports = { createApp }

