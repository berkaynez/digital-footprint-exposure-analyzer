const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const healthRouter = require('./routes/health')
const usernameVariationsRouter = require('./routes/usernameVariations')
const analyzeRouter = require('./routes/analyze')

function createApp() {
  const app = express()

  app.use(express.json())

  const frontendOrigin = process.env.FRONTEND_ORIGIN
  app.use(
    cors({
      origin: frontendOrigin ? [frontendOrigin] : true,
      credentials: true,
    }),
  )

  app.get('/', (_req, res) => {
    res.type('text').send('Digital Footprint Exposure Analyzer API')
  })

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  })

  app.use('/api', apiLimiter)

  app.use('/api/health', healthRouter)
  app.use('/api/username-variations', usernameVariationsRouter)
  app.use('/api/analyze', analyzeRouter)

  return app
}

module.exports = { createApp }

