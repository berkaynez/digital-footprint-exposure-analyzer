async function checkTelegramUsername(username) {
  // 1. Validate Telegram username format
  // Usually 5-32 characters, allowed characters: letters, numbers, underscore
  if (
    !username ||
    username.length < 5 ||
    username.length > 32 ||
    !/^[a-zA-Z0-9_]+$/.test(username) ||
    /^[0-9]/.test(username)
  ) {
    return { name: "Telegram", found: false, verified: false, signalType: "public_signal", configured: true, skipped: true, reason: "invalid_format" };
  }

  const url = `https://t.me/${encodeURIComponent(username)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9'
      }
    });

    if (res.status === 200) {
      const html = await res.text();
      
      const hasTgmeTitle = html.includes('tgme_page_title');
      const hasTgmeExtra = html.includes('tgme_page_extra');
      
      const genericTerms = [
        'you can contact <a class="tgme_username_link"',
        'Username not found'
      ];
      
      const matchedGeneric = genericTerms.filter(term => html.includes(term));

      // Strong positive indicators
      const isProfile = hasTgmeTitle && hasTgmeExtra && matchedGeneric.length === 0;

      if (isProfile) {
        return { name: "Telegram", found: true, verified: false, signalType: "public_signal", configured: true };
      } else {
        return { name: "Telegram", found: false, verified: false, signalType: "public_signal", configured: true, reason: "generic_placeholder" };
      }
    } else if (res.status === 404) {
      return { name: "Telegram", found: false, verified: false, signalType: "public_signal", configured: true, reason: "not_found" };
    } else if (res.status === 429) {
      return { name: "Telegram", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "rate_limited" };
    } else {
      return { name: "Telegram", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "request_failed" };
    }
  } catch (error) {
    if (process.env.DEBUG_PROVIDERS === "true") {
      console.error(`Telegram provider error:`, error.message);
    }
    return { name: "Telegram", found: false, verified: false, signalType: "public_signal", configured: true, error: true, reason: "request_failed" };
  }
}

module.exports = { checkTelegramUsername };
