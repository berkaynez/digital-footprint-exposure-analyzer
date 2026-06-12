const { fetchWithTimeout } = require('../fetchWithTimeout');
function logAndReturn(result) {
  if (process.env.DEBUG_PROVIDERS === "true") {
    console.log(`[DEBUG_PROVIDERS] Instagram Result:`, {
      name: result.name,
      found: result.found,
      verified: result.verified,
      signalType: result.signalType,
      error: result.error,
      reason: result.reason,
      status: result.status
    });
  }
  const { status, ...finalResult } = result;
  return finalResult;
}

async function checkInstagram(username) {
  // Instagram was evaluated but disabled by default because unauthenticated requests
  // may be rate-limited or blocked, making it unsuitable for reliable academic evaluation.
  if (process.env.INSTAGRAM_PROVIDER_ENABLED !== "true") {
    return logAndReturn({
      name: "Instagram",
      found: false,
      verified: false,
      signalType: "restricted_public_signal",
      configured: false,
      skipped: true,
      reason: "disabled_by_default"
    });
  }
  // 1. Validate username format
  // Instagram username limits: 1-30 chars, letters, numbers, periods, underscores
  if (
    !username ||
    username.length < 1 ||
    username.length > 30 ||
    !/^[a-zA-Z0-9_\.]+$/.test(username)
  ) {
    return logAndReturn({ name: "Instagram", found: false, verified: false, signalType: "restricted_public_signal", configured: true, skipped: true, reason: "invalid_format" });
  }

  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-IG-App-ID': '936619743392459',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const status = res.status;

    if (status === 200) {
      try {
        const json = await res.json();
        const hasDataUser = json && json.data && json.data.user !== null && json.data.user !== undefined;
        
        if (hasDataUser) {
          return logAndReturn({ name: "Instagram", found: true, verified: false, signalType: "restricted_public_signal", configured: true, status });
        } else {
          return logAndReturn({ name: "Instagram", found: false, verified: false, signalType: "restricted_public_signal", configured: true, reason: "no_user_data", status });
        }
      } catch (e) {
        return logAndReturn({ name: "Instagram", found: false, verified: false, signalType: "restricted_public_signal", configured: true, error: true, reason: "invalid_json", status });
      }
    } else if (status === 404) {
      return logAndReturn({ name: "Instagram", found: false, verified: false, signalType: "restricted_public_signal", configured: true, reason: "not_found", status });
    } else if (status === 400 || status === 401 || status === 403 || status === 429) {
      return logAndReturn({ name: "Instagram", found: false, verified: false, signalType: "restricted_public_signal", configured: true, error: true, reason: "blocked_or_rate_limited", status });
    } else if (status >= 500) {
      return logAndReturn({ name: "Instagram", found: false, verified: false, signalType: "restricted_public_signal", configured: true, error: true, reason: "server_error", status });
    } else {
      return logAndReturn({ name: "Instagram", found: false, verified: false, signalType: "restricted_public_signal", configured: true, error: true, reason: "request_failed", status });
    }
  } catch (error) {
    if (process.env.DEBUG_PROVIDERS === "true") {
      console.error(`Instagram provider error:`, error.message);
    }
    return logAndReturn({ name: "Instagram", found: false, verified: false, signalType: "restricted_public_signal", configured: true, error: true, reason: "request_failed" });
  }
}

module.exports = { checkInstagram };
