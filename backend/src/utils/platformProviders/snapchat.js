const { fetchWithTimeout } = require('../fetchWithTimeout');
async function checkSnapchat(username) {
  // 1. Validate username format: allowed characters (letters, numbers, _, -, .) length 3-30
  if (
    !username ||
    username.length < 3 ||
    username.length > 30 ||
    !/^[a-zA-Z0-9_\-\.]+$/.test(username)
  ) {
    return { name: "Snapchat", found: false, verified: false, signalType: "public_signal", configured: true, skipped: true };
  }

  const url = `https://www.snapchat.com/add/${encodeURIComponent(username)}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9'
      }
    });

    if (res.status === 200) {
      const html = await res.text();
      
      const notFoundTerms = [
        "Üzgünüz",
        "Bu içerik bulunamadı",
        "This content was not found",
        "couldn't find",
        "not found",
        '"pageType":"NOT_FOUND"'
      ];
      
      const matchedNotFound = notFoundTerms.filter(term => html.includes(term));
      const hasUserProfile = html.includes('"userProfile"') || html.includes('"userInfo"');
      const hasUsernameString = html.includes(`"username":"${username.toLowerCase()}"`);

      // Public URL visibility only. We don't claim absolute account existence.
      const found = matchedNotFound.length === 0 && (hasUserProfile || hasUsernameString);
      
      return { name: "Snapchat", found, verified: false, signalType: "public_signal", configured: true };
    } else if (res.status === 404) {
      return { name: "Snapchat", found: false, verified: false, signalType: "public_signal", configured: true };
    } else if (res.status === 429) {
      return { name: "Snapchat", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "rate_limited" };
    } else {
      return { name: "Snapchat", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "request_failed" };
    }
  } catch (error) {
    if (process.env.DEBUG_PROVIDERS === "true") {
      console.error(`Snapchat provider error:`, error.message);
    }
    return { name: "Snapchat", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "request_failed" };
  }
}

module.exports = { checkSnapchat };
