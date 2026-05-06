const express = require('express')

const {
  generateUsernameVariations,
} = require('../utils/usernameGenerator')
const { similarityScore } = require('../utils/similarity')

const router = express.Router()

function riskFromScore(score) {
  if (score >= 0.8) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

function mockPlatformScan(username, similarity) {
  const platforms = ['GitHub', 'Reddit', 'Medium', 'Pinterest', 'Instagram']

  const possibleGithubAndReddit = similarity >= 0.8
  const possibleInstagram = username.includes('_')
  const possibleMedium = username.length > 10

  return platforms.map((name) => {
    let found = false

    if (possibleGithubAndReddit && (name === 'GitHub' || name === 'Reddit')) {
      found = true
    } else if (possibleInstagram && name === 'Instagram') {
      found = true
    } else if (possibleMedium && name === 'Medium') {
      found = true
    }

    return { name, found }
  })
}

router.post('/', (req, res) => {
  const { email, username } = req.body || {}

  if (typeof email !== 'string' || typeof username !== 'string') {
    return res.status(400).json({
      error: 'email and username must be strings',
    })
  }

  const trimmedEmail = email.trim()
  const trimmedUsername = username.trim()

  const variations = generateUsernameVariations(trimmedUsername)

  const results = variations.map((variation) => {
    const score = similarityScore(trimmedUsername, variation)
    return {
      username: variation,
      similarity: score,
      risk: riskFromScore(score),
      platforms: mockPlatformScan(variation, score),
    }
  })

  return res.json({
    email: trimmedEmail,
    username: trimmedUsername,
    results,
  })
})

module.exports = router

