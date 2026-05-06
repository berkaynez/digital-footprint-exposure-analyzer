async function checkGitHubUsername(username) {
  const u = String(username || '').trim()
  if (!u) return { found: false, error: true }

  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(u)}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'digital-footprint-exposure-analyzer',
      },
    })

    if (res.status === 200) return { found: true }
    if (res.status === 404) return { found: false }

    return { found: false, error: true }
  } catch (_err) {
    return { found: false, error: true }
  }
}

module.exports = { checkGitHubUsername }

