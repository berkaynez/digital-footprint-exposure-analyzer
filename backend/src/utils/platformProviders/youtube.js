// YouTube is a verified provider only when API key is configured.
// If not configured, it is skipped safely.
async function checkYouTubeHandle(username) {
  if (!username) return { name: "YouTube", found: false, verified: false, skipped: true };

  // Remove leading @ if provided
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;

  if (
    cleanUsername.length < 3 ||
    !/^[a-zA-Z0-9_\-\.]+$/.test(cleanUsername)
  ) {
    return { name: "YouTube", found: false, verified: true, skipped: true };
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return { name: "YouTube", found: false, verified: false, configured: false, skipped: true };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=@${encodeURIComponent(cleanUsername)}&key=${process.env.YOUTUBE_API_KEY}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return { name: "YouTube", found: true, verified: true };
      } else {
        return { name: "YouTube", found: false, verified: true };
      }
    } else if (response.status === 403) {
      return { name: "YouTube", found: false, verified: false, error: true, reason: "quota_or_forbidden" };
    } else {
      return { name: "YouTube", found: false, verified: false, error: true, reason: "request_failed" };
    }
  } catch (error) {
    if (process.env.DEBUG_PROVIDERS === "true") {
      console.error(`YouTube API error:`, error.message);
    }
    return { name: "YouTube", found: false, verified: false, error: true, reason: "request_failed" };
  }
}

module.exports = { checkYouTubeHandle };
