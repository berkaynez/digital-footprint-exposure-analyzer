const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const healthRouter = require('./routes/health')
const usernameVariationsRouter = require('./routes/usernameVariations')
const analyzeRouter = require('./routes/analyze')

function createApp() {
  const app = express()

  app.use(express.json())

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_ORIGIN,
  ].filter(Boolean)

  app.use(
    cors({
      origin: (origin, callback) => {
        const isVercel = origin && origin.endsWith('.vercel.app')
        if (!origin || allowedOrigins.includes(origin) || isVercel) {
          callback(null, true)
        } else {
          // Do not block hard, just log the unknown origin
          console.warn(`CORS Warning: Allowing unlisted origin: ${origin}`)
          callback(null, true)
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
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  })

  app.use('/api/health', healthRouter)
  app.use('/api/username-variations', apiLimiter, usernameVariationsRouter)
  app.use('/api/analyze', apiLimiter, analyzeRouter)

  return app
}

module.exports = { createApp }

