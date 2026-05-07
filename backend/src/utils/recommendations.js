function generateRecommendations(summary, emailExposure) {
  const recommendations = []

  if (summary.digitalExposureScore >= 80) {
    recommendations.push({
      severity: 'high',
      title: 'Critical Exposure Alert',
      description: 'Change exposed passwords immediately and review security settings across all major accounts.'
    })
  }

  const exposedFields = emailExposure?.exposedFields?.map(f => f.toLowerCase()) || []

  if (exposedFields.includes('password')) {
    recommendations.push({
      severity: 'high',
      title: 'Password Leak Detected',
      description: 'Your password was found in a public breach. Reset your passwords immediately and consider using a password manager.'
    })
  }

  if (exposedFields.includes('ip') || exposedFields.includes('dob') || exposedFields.includes('address')) {
    recommendations.push({
      severity: 'medium',
      title: 'Personal Data Exposure',
      description: 'Sensitive personal data like your address, DOB, or IP has been exposed. Be highly vigilant against targeted phishing attempts.'
    })
  }

  if (summary.verifiedMatchCount > 0) {
    recommendations.push({
      severity: 'medium',
      title: 'Username Reuse Risk',
      description: 'You are reusing your username across platforms. Consider using distinct usernames to reduce the ability for attackers to correlate your accounts.'
    })
  }

  if (summary.simulatedMatchCount > 10) {
    recommendations.push({
      severity: 'low',
      title: 'Public Platform Visibility',
      description: 'Your footprint spans many potential platforms. Review the public visibility settings of your active accounts.'
    })
  }

  recommendations.push({
    severity: 'low',
    title: 'Enable Two-Factor Authentication',
    description: 'Ensure 2FA is enabled on all important accounts, regardless of current exposure levels.'
  })

  return recommendations
}

module.exports = { generateRecommendations }
