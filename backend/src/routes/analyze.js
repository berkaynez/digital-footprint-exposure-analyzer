const express = require('express')

const {
  generateUsernameVariations,
} = require('../utils/usernameGenerator')
const { similarityScore } = require('../utils/similarity')
const { checkGitHubUsername } = require('../utils/github')
const { checkEmailExposure } = require('../utils/breachProviders')
const { generateRecommendations } = require('../utils/recommendations')

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

  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return res.status(400).json({
      error: 'A valid email containing @ is required',
    })
  }

  if (!trimmedUsername || trimmedUsername.length < 3) {
    return res.status(400).json({
      error: 'Username must be at least 3 characters long',
    })
  }

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

  let highRiskCount = 0
  let mediumRiskCount = 0
  let lowRiskCount = 0
  let verifiedMatchCount = 0
  let simulatedMatchCount = 0

  results.forEach(r => {
    if (r.risk === 'high') highRiskCount++
    else if (r.risk === 'medium') mediumRiskCount++
    else if (r.risk === 'low') lowRiskCount++

    r.platforms.forEach(p => {
      if (p.found) {
        if (p.name === 'GitHub') verifiedMatchCount++
        else simulatedMatchCount++
      }
    })
  })

  let usernameReuseRiskScore = (highRiskCount * 1) + (mediumRiskCount * 0.5) + (lowRiskCount * 0) + (verifiedMatchCount * 20) + (simulatedMatchCount * 0.25)
  usernameReuseRiskScore = Math.min(Math.round(usernameReuseRiskScore), 100)

  const emailExposure = await checkEmailExposure(trimmedEmail)

  let dataSensitivityScore = 0
  if (emailExposure && emailExposure.exposedFields) {
    const fields = emailExposure.exposedFields.map(f => f.toLowerCase())
    if (fields.includes('password')) dataSensitivityScore += 25
    if (fields.includes('email')) dataSensitivityScore += 10
    if (fields.includes('ip')) dataSensitivityScore += 5
    if (fields.includes('dob')) dataSensitivityScore += 10
    if (fields.includes('address')) dataSensitivityScore += 10
    if (fields.includes('first_name') || fields.includes('last_name')) dataSensitivityScore += 5
  }
  dataSensitivityScore = Math.min(dataSensitivityScore, 40)

  let breachFrequencyScore = 0
  if (emailExposure && emailExposure.breachCount) {
    breachFrequencyScore = emailExposure.breachCount * 3
  }
  breachFrequencyScore = Math.min(breachFrequencyScore, 30)

  let usernameReuseContribution = usernameReuseRiskScore * 0.3
  
  let digitalExposureScore = dataSensitivityScore + breachFrequencyScore + usernameReuseContribution
  digitalExposureScore = Math.min(Math.round(digitalExposureScore), 100)

  const summary = {
    totalVariations: results.length,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    verifiedMatchCount,
    simulatedMatchCount,
    usernameReuseRiskScore,
    dataSensitivityScore,
    breachFrequencyScore,
    usernameReuseContribution,
    digitalExposureScore
  }

  const recommendations = generateRecommendations(summary, emailExposure)

  return res.json({
    email: trimmedEmail,
    username: trimmedUsername,
    summary,
    emailExposure,
    recommendations,
    results,
  })
})

module.exports = router

