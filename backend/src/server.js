require('dotenv').config()

const { createApp } = require('./app')

const PORT = Number(process.env.PORT) || 5053

const app = createApp()

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`)
})

server.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Server failed to start:', err)
  process.exitCode = 1
})

// Ensure the process stays alive even if something unrefs the server handle.
server.ref()

