const express = require('express')

const {
  generateUsernameVariations,
} = require('../utils/usernameGenerator')
const { similarityScore } = require('../utils/similarity')
const { checkGitHubUsername } = require('../utils/github')

const router = express.Router()

function riskFromScore(score) {
  if (score >= 0.8) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

function mockPlatformsForUsername(username, similarity) {
  const possibleInstagram = username.includes('_')
  const possibleMedium = username.length > 10

  return [
    { name: 'Reddit', found: similarity >= 0.8 },
    { name: 'Medium', found: possibleMedium },
    { name: 'Pinterest', found: false },
    { name: 'Instagram', found: possibleInstagram },
  ]
}

router.post('/', async (req, res) => {
  const { email, username } = req.body || {}

  if (typeof email !== 'string' || typeof username !== 'string') {
    return res.status(400).json({
      error: 'email and username must be strings',
    })
  }

  const trimmedEmail = email.trim()
  const trimmedUsername = username.trim()

  const variations = generateUsernameVariations(trimmedUsername)

  const results = await Promise.all(
    variations.map(async (variation) => {
      const score = similarityScore(trimmedUsername, variation)

      const github = await checkGitHubUsername(variation)
      const platforms = [
        { name: 'GitHub', ...github },
        ...mockPlatformsForUsername(variation, score),
      ]

      return {
        username: variation,
        similarity: score,
        risk: riskFromScore(score),
        platforms,
      }
    }),
  )

  return res.json({
    email: trimmedEmail,
    username: trimmedUsername,
    results,
  })
})

module.exports = router

