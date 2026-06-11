async function checkSteam(username) {
  // 1. Validate username format
  // Steam custom URLs are generally 2-64 chars, alphanumeric, underscore, hyphen
  if (
    !username ||
    username.length < 2 ||
    username.length > 64 ||
    !/^[a-zA-Z0-9_\-\.]+$/.test(username)
  ) {
    return { name: "Steam", found: false, verified: false, signalType: "public_signal", configured: true, skipped: true, reason: "invalid_format" };
  }

  const url = `https://steamcommunity.com/id/${encodeURIComponent(username)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      },
      redirect: 'follow'
    });

    if (res.status === 200) {
      const text = await res.text();
      const titleMatch = text.match(/<title[^>]*>(.*?)<\/title>/i);
      
      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1];
        if (title.includes("Steam Community :: Error")) {
          return { name: "Steam", found: false, verified: false, signalType: "public_signal", configured: true, reason: "not_found" };
        } else if (title.includes("Steam Community ::")) {
          return { name: "Steam", found: true, verified: false, signalType: "public_signal", configured: true };
        }
      }
      return { name: "Steam", found: false, verified: false, signalType: "public_signal", configured: true, reason: "not_found" };
    } else if (res.status === 404) {
      return { name: "Steam", found: false, verified: false, signalType: "public_signal", configured: true, reason: "not_found" };
    } else if (res.status === 403 || res.status === 429) {
      return { name: "Steam", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "blocked_or_rate_limited" };
    } else if (res.status >= 500) {
      return { name: "Steam", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "server_error" };
    } else {
      return { name: "Steam", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "request_failed" };
    }
  } catch (error) {
    if (process.env.DEBUG_PROVIDERS === "true") {
      console.error(`Steam provider error:`, error.message);
    }
    return { name: "Steam", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "request_failed" };
  }
}

module.exports = { checkSteam };
