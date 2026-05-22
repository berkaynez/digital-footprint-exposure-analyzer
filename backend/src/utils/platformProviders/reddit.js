async function checkRedditUsername(username) {
  // Validate username locally first
  if (
    !username ||
    username.length <= 2 ||
    !/^[a-zA-Z0-9_\-]+$/.test(username)
  ) {
    return { name: "Reddit", found: false, verified: true, skipped: true };
  }

  try {
    const response = await fetch(`https://www.reddit.com/user/${encodeURIComponent(username)}/about.json`, {
      method: 'GET',
      headers: {
        'User-Agent': 'FootprintGuard/1.0',
        'Accept': 'application/json',
      }
    });

    if (response.status === 200) {
      return { name: "Reddit", found: true, verified: true };
    } else if (response.status === 404) {
      return { name: "Reddit", found: false, verified: true };
    } else {
      // 429 / errors -> fail silently
      return { name: "Reddit", found: false, verified: false, error: true, reason: "request_failed" };
    }
  } catch (error) {
    if (process.env.DEBUG_PROVIDERS === "true") {
      console.error(`Reddit API error:`, error.message);
    }
    return { name: "Reddit", found: false, verified: false, error: true, reason: "request_failed" };
  }
}

module.exports = { checkRedditUsername };
