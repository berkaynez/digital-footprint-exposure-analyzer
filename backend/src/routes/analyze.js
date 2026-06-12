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
const { checkSnapchat } = require('../utils/platformProviders/snapchat')
const { checkInstagram } = require('../utils/platformProviders/instagram')
const { checkX } = require('../utils/platformProviders/x')
const { checkSteam } = require('../utils/platformProviders/steam')
const { checkEmailExposure } = require('../utils/breachProviders')
const { generateRecommendations } = require('../utils/recommendations')

const router = express.Router()

function riskFromScore(score) {
  if (score >= 0.8) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

function getProviderWeight(platform) {
  if (platform.verified === true) return 1.0;
  if (platform.signalType === 'public_signal') return 0.4;
  if (platform.signalType === 'restricted_public_signal') return 0.25;
  return 0;
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

// mockPlatformsForUsername removed; simulated indicators removed for final reliability and academic clarity

router.post('/', async (req, res) => {
  const { email, username, mode = 'full' } = req.body || {}

  let trimmedEmail = ''
  let trimmedUsername = ''

  if (mode === 'full' || mode === 'email') {
    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'email must be a string' })
    }
    trimmedEmail = email.trim()
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return res.status(400).json({ error: 'A valid email containing @ is required' })
    }
  }

  if (mode === 'full' || mode === 'username') {
    if (typeof username !== 'string') {
      return res.status(400).json({ error: 'username must be a string' })
    }
    trimmedUsername = username.trim()
    if (!trimmedUsername || trimmedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' })
    }
  }

  let originalPlatforms = []
  let results = []
  let variations = []
  let originalUsernameAnalysis = null

  let originalVerifiedMatchCount = 0
  let originalSimulatedMatchCount = 0
  let originalPublicSignalMatchCount = 0
  let originalRestrictedSignalMatchCount = 0

  if (mode === 'full' || mode === 'username') {
    variations = generateUsernameVariations(trimmedUsername)
    variations = variations.filter(v => v.toLowerCase() !== trimmedUsername.toLowerCase())

    const originalGithub = await checkGitHubUsername(trimmedUsername)
    const originalGitlab = await checkGitLabUsername(trimmedUsername)
    const originalReddit = await checkRedditUsername(trimmedUsername)
    const originalYouTube = await checkYouTubeHandle(trimmedUsername)
    const originalSnapchat = await checkSnapchat(trimmedUsername)
    const originalInstagram = await checkInstagram(trimmedUsername)
    const originalTelegram = await checkTelegramUsername(trimmedUsername)
    const originalX = await checkX(trimmedUsername)
    const originalSteam = await checkSteam(trimmedUsername)
    
    originalPlatforms = [
      { name: 'GitHub', ...originalGithub },
      originalGitlab,
      originalReddit,
      originalYouTube,
      originalSnapchat,
      originalInstagram,
      originalTelegram,
      originalX,
      originalSteam,
    ]

    originalPlatforms.forEach(p => {
      if (p.found) {
        if (p.verified === true) originalVerifiedMatchCount++
        else if (p.signalType === 'public_signal') originalPublicSignalMatchCount++
        else if (p.signalType === 'restricted_public_signal') originalRestrictedSignalMatchCount++
      }
    })

    originalUsernameAnalysis = {
      username: trimmedUsername,
      platforms: originalPlatforms,
      verifiedMatchCount: originalVerifiedMatchCount,
      publicSignalMatchCount: originalPublicSignalMatchCount,
      simulatedMatchCount: originalSimulatedMatchCount,
      confidenceWeight: 1.0
    }

    results = await Promise.all(
      variations.map(async (variation) => {
        const score = similarityScore(trimmedUsername, variation)

        const github = await checkGitHubUsername(variation)
        const gitlab = await checkGitLabUsername(variation)
        const reddit = await checkRedditUsername(variation)
        const youtube = await checkYouTubeHandle(variation)
        const snapchat = await checkSnapchat(variation)
        const instagram = await checkInstagram(variation)
        const telegram = await checkTelegramUsername(variation)
        const xProvider = await checkX(variation)
        const steam = await checkSteam(variation)
        
        const platforms = [
          { name: 'GitHub', ...github },
          gitlab,
          reddit,
          youtube,
          snapchat,
          instagram,
          telegram,
          xProvider,
          steam,
        ]

        const confidenceWeight = getConfidenceWeight(trimmedUsername, variation)

        return {
          username: variation,
          similarity: score,
          risk: riskFromScore(score),
          confidenceWeight,
          platforms,
        }
      })
    )
  }

  let highRiskCount = 0
  let mediumRiskCount = 0
  let lowRiskCount = 0
  let verifiedMatchCount = originalVerifiedMatchCount
  let simulatedMatchCount = originalSimulatedMatchCount
  let publicSignalMatchCount = originalPublicSignalMatchCount
  let restrictedSignalMatchCount = originalRestrictedSignalMatchCount

  let weightedUsernameRisk = 0
  const ORIGINAL_BASE = 18
  const VARIATION_BASE = 6

  if (mode === 'full' || mode === 'username') {
    originalPlatforms.forEach(p => {
      if (p.found) {
        weightedUsernameRisk += (getProviderWeight(p) * 1.0 * ORIGINAL_BASE)
      }
    })

    results.forEach(r => {
      let effectiveVariationWeight = r.confidenceWeight;

      if (r.username.length < trimmedUsername.length && effectiveVariationWeight > 0.25) {
        effectiveVariationWeight = 0.25;
      }
      if (r.username.length <= 5 && r.username.length < trimmedUsername.length) {
        effectiveVariationWeight *= 0.2;
      }

      if (r.risk === 'high') {
        highRiskCount++
      } else if (r.risk === 'medium') {
        mediumRiskCount++
      } else if (r.risk === 'low') {
        lowRiskCount++
      }

      r.platforms.forEach(p => {
        if (p.found) {
          if (p.verified === true) {
            verifiedMatchCount++
          } else if (p.signalType === 'public_signal') {
            publicSignalMatchCount++
          } else if (p.signalType === 'restricted_public_signal') {
            restrictedSignalMatchCount++
          }
          weightedUsernameRisk += (getProviderWeight(p) * effectiveVariationWeight * VARIATION_BASE)
        }
      })
    })
  }

  let usernameExposureScore = Math.min(100, Math.round(weightedUsernameRisk))
  let usernameReuseRiskScore = usernameExposureScore

  let emailExposure = null
  let breachCountContribution = 0
  let sensitiveFieldContribution = 0

  if (mode === 'full' || mode === 'email') {
    emailExposure = await checkEmailExposure(trimmedEmail)

    if (emailExposure && emailExposure.breachCount) {
      const count = emailExposure.breachCount
      if (count === 1) breachCountContribution = 15
      else if (count >= 2 && count <= 5) breachCountContribution = 30
      else if (count >= 6 && count <= 15) breachCountContribution = 45
      else if (count >= 16) breachCountContribution = 60
    }

    if (emailExposure && emailExposure.exposedFields) {
      const fields = emailExposure.exposedFields.map(f => f.toLowerCase())
      
      const hasPassword = fields.some(f => f.includes('password') || f.includes('credential'))
      const hasPII = fields.some(f => 
        f.includes('name') || f.includes('phone') || f.includes('address') || 
        f.includes('dob') || f.includes('ip') || f.includes('location')
      )
      const hasBasic = fields.some(f => f.includes('email') || f.includes('username'))

      if (hasPassword) sensitiveFieldContribution += 25
      if (hasPII) sensitiveFieldContribution += 15
      if (sensitiveFieldContribution === 0 && hasBasic) sensitiveFieldContribution += 5

      sensitiveFieldContribution = Math.min(sensitiveFieldContribution, 40)
    }
  }

  let emailExposureScore = Math.min(100, breachCountContribution + sensitiveFieldContribution)

  let digitalExposureScore = 0
  if (mode === 'email') {
    digitalExposureScore = emailExposureScore
  } else if (mode === 'username') {
    digitalExposureScore = usernameExposureScore
  } else {
    digitalExposureScore = Math.round((0.55 * emailExposureScore) + (0.45 * usernameExposureScore))
  }

  const summary = {
    mode,
    totalVariations: results.length,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    verifiedMatchCount,
    publicSignalMatchCount: publicSignalMatchCount + restrictedSignalMatchCount,
    restrictedSignalMatchCount,
    simulatedMatchCount: 0,
    usernameReuseRiskScore,
    emailExposureScore,
    usernameExposureScore,
    digitalExposureScore
  }

  const recommendations = generateRecommendations(summary, emailExposure)

  // Filter recommendations strictly based on mode, to avoid showing email recommendations if username-only and vice versa
  let filteredRecommendations = recommendations
  if (mode === 'username') {
    filteredRecommendations = recommendations.filter(r => !r.title.toLowerCase().includes('password') && !r.title.toLowerCase().includes('email') && !r.title.toLowerCase().includes('breach'))
  } else if (mode === 'email') {
    filteredRecommendations = recommendations.filter(r => r.title.toLowerCase().includes('password') || r.title.toLowerCase().includes('email') || r.title.toLowerCase().includes('breach') || r.title.toLowerCase().includes('authenticator'))
  }

  return res.json({
    mode,
    email: trimmedEmail,
    username: trimmedUsername,
    summary,
    emailExposure,
    recommendations: filteredRecommendations,
    originalUsernameAnalysis,
    results,
  })
})

module.exports = router

