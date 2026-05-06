function isValidGitHubUsername(username) {
  const u = String(username || '')
  if (u.length < 1 || u.length > 39) return false
  if (u.startsWith('-') || u.endsWith('-')) return false
  return /^[A-Za-z0-9-]+$/.test(u)
}

async function checkGitHubUsername(username) {
  const u = String(username || '').trim()
  if (!u) return { found: false, verified: false, error: true }

  // If it can't be a GitHub username, don't call the API.
  if (!isValidGitHubUsername(u)) {
    return { found: false, verified: true, skipped: true }
  }

  try {
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'digital-footprint-exposure-analyzer',
    }

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    }

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}`, {
      headers,
    })

    const remaining = res.headers.get('x-ratelimit-remaining')
    // eslint-disable-next-line no-console
    console.log(`GitHub API status: ${res.status}, x-ratelimit-remaining: ${remaining}`)

    if (res.status === 200) return { found: true, verified: true }
    if (res.status === 404) return { found: false, verified: true }
    if (res.status === 403) return { found: false, verified: false, error: true, reason: 'rate_limited_or_forbidden' }

    // eslint-disable-next-line no-console
    console.log('GitHub check failed', u, res.status)
    return { found: false, verified: false, error: true }
  } catch (_err) {
    return { found: false, verified: false, error: true }
  }
}

module.exports = { checkGitHubUsername }

