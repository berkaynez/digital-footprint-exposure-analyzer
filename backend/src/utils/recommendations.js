function generateRecommendations(summary, emailExposure) {
  const recommendations = []

  const exposedFields = emailExposure?.exposedFields?.map(f => f.toLowerCase()) || []
  
  // 1. Password/Credential exposure
  if (exposedFields.some(f => f.includes('password') || f.includes('credential'))) {
    recommendations.push({
      severity: 'critical', // Using critical, though frontend renders it like high
      title: 'Password Leak Detected',
      description: 'Your password or credentials were found in a public breach. Change exposed passwords immediately and consider using a password manager.'
    })
  }

  // 2. High username reuse
  if (summary.usernameExposureScore > 70 || summary.verifiedMatchCount > 3) {
    recommendations.push({
      severity: 'high',
      title: 'High Username Reuse Detected',
      description: 'Extensive username reuse discovered across platforms. Review username reuse across platforms to reduce the ability for attackers to correlate your accounts.'
    })
  }

  // 3. High email exposure score
  if (summary.emailExposureScore > 70) {
    recommendations.push({
      severity: 'high',
      title: 'Severe Email Exposure',
      description: 'Your email address is heavily exposed across multiple breaches. Consider migrating critical services to a fresh, uncompromised email alias.'
    })
  }

  // 4. Multiple breach participation
  if (emailExposure?.breachCount > 0) {
    recommendations.push({
      severity: 'medium',
      title: 'Breach Participation',
      description: `Your email appeared in ${emailExposure.breachCount} data breaches. Enable MFA on important accounts immediately.`
    })
  }

  // 5. Sensitive personal data exposure
  if (exposedFields.some(f => f.includes('ip') || f.includes('dob') || f.includes('address') || f.includes('phone') || f.includes('location'))) {
    recommendations.push({
      severity: 'medium',
      title: 'Personal Data Exposure',
      description: 'Sensitive personal data like your address, DOB, phone, or IP has been exposed. Be highly vigilant against targeted phishing and social engineering attempts.'
    })
  }

  // 6. General security hygiene (Low)
  if (summary.digitalExposureScore < 25) {
    recommendations.push({
      severity: 'low',
      title: 'Good Digital Hygiene',
      description: 'No urgent actions required. Continue practicing good digital hygiene by using distinct passwords and monitoring your footprint.'
    })
  } else {
    // If they have some exposure but no urgent ones catch-all
    const hasHighOrCritical = recommendations.some(r => r.severity === 'high' || r.severity === 'critical');
    if (!hasHighOrCritical) {
      recommendations.push({
        severity: 'low',
        title: 'Enable Two-Factor Authentication',
        description: 'Ensure 2FA is enabled on all important accounts to protect against future breaches.'
      })
    }
  }

  return recommendations
}

module.exports = { generateRecommendations }
