const express = require('express')
const cors = require('cors')

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

  app.use('/api/health', healthRouter)
  app.use('/api/username-variations', usernameVariationsRouter)
  app.use('/api/analyze', analyzeRouter)

  return app
}

module.exports = { createApp }

