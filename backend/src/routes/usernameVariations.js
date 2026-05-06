const express = require('express')

const {
  generateUsernameVariations,
} = require('../utils/usernameGenerator')

const router = express.Router()

router.post('/', (req, res) => {
  const { username } = req.body || {}

  if (typeof username !== 'string') {
    return res.status(400).json({
      error: 'username must be a string',
    })
  }

  const variations = generateUsernameVariations(username)
  return res.json({ username, variations })
})

module.exports = router

