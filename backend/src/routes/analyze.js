const express = require('express')

const {
  generateUsernameVariations,
} = require('../utils/usernameGenerator')
const { similarityScore } = require('../utils/similarity')
const { checkGitHubUsername } = require('../utils/github')
const { checkGitLabUsername } = require('../utils/platformProviders/gitlab')
const { checkRedditUsername } = require('../utils/platformProviders/reddit')
const { checkYouTubeHandle } = require('../utils/platformProviders/youtube')
const { checkTelegramUsername } = require('../utils/platformProviders/telegram')
const { checkEmailExposure } = require('../utils/breachProviders')
const { generateRecommendations } = require('../utils/recommendations')

const router = express.Router()

function riskFromScore(score) {
  if (score >= 0.8) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

// Similarity is raw string similarity.
// confidenceWeight controls how strongly a generated variation contributes to risk scoring.
function getConfidenceWeight(original, variation) {
  const origLower = original.toLowerCase()
  const varLower = variation.toLowerCase()
  
  if (varLower === origLower) return 1.0
  if (varLower.length < origLower.length) return 0.35 // shortened
  if (/[34105]/.test(varLower) && !/[34105]/.test(origLower)) return 0.8 // leetspeak
  if (varLower.includes('_') || varLower.includes('-') || varLower.includes('.')) return 0.75 // separator
  if (/\d+$/.test(varLower) && !/\d+$/.test(origLower)) return 0.65 // number suffix
  
  return 0.6 // fallback
}

function mockPlatformsForUsername(username, similarity) {
  const possibleInstagram = username.includes('_')
  const possibleMedium = username.length > 10

  return [
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

  let variations = generateUsernameVariations(trimmedUsername)
  variations = variations.filter(v => v.toLowerCase() !== trimmedUsername.toLowerCase())

  const originalGithub = await checkGitHubUsername(trimmedUsername)
  const originalGitlab = await checkGitLabUsername(trimmedUsername)
  const originalReddit = await checkRedditUsername(trimmedUsername)
  const originalYouTube = await checkYouTubeHandle(trimmedUsername)
  const originalTelegram = await checkTelegramUsername(trimmedUsername)
  const originalPlatforms = [
    { name: 'GitHub', ...originalGithub },
    originalGitlab,
    originalReddit,
    originalYouTube,
    originalTelegram,
    ...mockPlatformsForUsername(trimmedUsername, 1.0)
  ]

  let originalVerifiedMatchCount = 0
  let originalSimulatedMatchCount = 0
  let originalPublicSignalMatchCount = 0

  originalPlatforms.forEach(p => {
    if (p.found) {
      if (p.name === 'GitHub' || p.name === 'GitLab' || p.name === 'Reddit' || p.name === 'YouTube') originalVerifiedMatchCount++
      else if (p.signalType === 'public_signal') originalPublicSignalMatchCount++
      else originalSimulatedMatchCount++
    }
  })

  const originalUsernameAnalysis = {
    username: trimmedUsername,
    platforms: originalPlatforms,
    verifiedMatchCount: originalVerifiedMatchCount,
    publicSignalMatchCount: originalPublicSignalMatchCount,
    simulatedMatchCount: originalSimulatedMatchCount,
    confidenceWeight: 1.0
  }

  const results = await Promise.all(
    variations.map(async (variation) => {
      const score = similarityScore(trimmedUsername, variation)

      const github = await checkGitHubUsername(variation)
      const gitlab = await checkGitLabUsername(variation)
      const reddit = await checkRedditUsername(variation)
      const youtube = await checkYouTubeHandle(variation)
      const telegram = await checkTelegramUsername(variation)
      
      const platforms = [
        // Verified API-based checks
        { name: 'GitHub', ...github },
        gitlab,
        reddit,
        youtube,
        telegram,
        // Simulated prototype indicators
        ...mockPlatformsForUsername(variation, score),
      ]

      const confidenceWeight = getConfidenceWeight(trimmedUsername, variation)

      return {
        username: variation,
        similarity: score,
        risk: riskFromScore(score),
        confidenceWeight,
        platforms,
      }
    }),
  )

  let highRiskCount = 0
  let mediumRiskCount = 0
  let lowRiskCount = 0
  let verifiedMatchCount = originalVerifiedMatchCount
  let simulatedMatchCount = originalSimulatedMatchCount
  let publicSignalMatchCount = originalPublicSignalMatchCount

  // raw platform matches are displayed for transparency
  // weighted scoring reduces false confidence from weak/simulated signals
  let weightedRisk = (originalVerifiedMatchCount * 15 * 1.0) + 
                     (originalPublicSignalMatchCount * 15 * 0.4) + 
                     (originalSimulatedMatchCount * 15 * 0.15)

  results.forEach(r => {
    let effectiveVariationWeight = r.confidenceWeight;

    // shortened/truncated candidates: max contribution should be capped at 0.25 even if verified providers match
    if (r.username.length < trimmedUsername.length && effectiveVariationWeight > 0.25) {
      effectiveVariationWeight = 0.25;
    }

    // if candidate username length <= 5 and candidate is shorter than original username: cap its scoring contribution to 20% of normal
    if (r.username.length <= 5 && r.username.length < trimmedUsername.length) {
      effectiveVariationWeight *= 0.2;
    }

    if (r.risk === 'high') {
      highRiskCount++
      weightedRisk += (1 * effectiveVariationWeight)
    } else if (r.risk === 'medium') {
      mediumRiskCount++
      weightedRisk += (0.5 * effectiveVariationWeight)
    } else if (r.risk === 'low') {
      lowRiskCount++
    }

    r.platforms.forEach(p => {
      if (p.found) {
        if (p.name === 'GitHub' || p.name === 'GitLab' || p.name === 'Reddit' || p.name === 'YouTube') {
          verifiedMatchCount++
          weightedRisk += (5 * 1.0 * effectiveVariationWeight)
        } else if (p.signalType === 'public_signal') {
          publicSignalMatchCount++
          weightedRisk += (5 * 0.4 * effectiveVariationWeight)
        } else {
          simulatedMatchCount++
          weightedRisk += (5 * 0.15 * effectiveVariationWeight)
        }
      }
    })
  })

  // The displayed match counts are raw transparency metrics; the score uses weighted risk to avoid over-counting weak or generic matches.
  let usernameReuseRiskScore = Math.min(
    100,
    Math.round(weightedRisk * 1.2)
  )

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
    publicSignalMatchCount,
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
    originalUsernameAnalysis,
    results,
  })
})

module.exports = router

