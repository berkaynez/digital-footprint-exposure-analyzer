const express = require('express')

const {
  MAX_USERNAME_LENGTH,
  generateUsernameVariationsWithMetadata,
} = require('../utils/usernameGenerator')

const router = express.Router()

router.post('/', (req, res) => {
  const { username } = req.body || {}

  if (typeof username !== 'string') {
    return res.status(400).json({
      error: 'username must be a string',
    })
  }

  if (username.trim().length > MAX_USERNAME_LENGTH) {
    return res.status(400).json({
      error: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer`,
    })
  }

  const { variations, capped } = generateUsernameVariationsWithMetadata(username)
  return res.json({ username, variations, variationsCapped: capped })
})

module.exports = router
