async function checkGitLabUsername(username) {
  // 1. Validate GitLab username format simply
  if (
    !username ||
    username.length > 255 ||
    !/^[a-zA-Z0-9_\-\.]+$/.test(username)
  ) {
    return { name: "GitLab", found: false, verified: true, skipped: true };
  }

  // 2. Call GitLab API
  try {
    const response = await fetch(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      
      // The API returns an array of users matching the search.
      // We check if any returned user matches the input username exactly (case-insensitive).
      const found = Array.isArray(data) && data.some(
        user => user.username && user.username.toLowerCase() === username.toLowerCase()
      );
      
      return { name: "GitLab", found, verified: true };
    } else if (response.status === 429) {
      return { name: "GitLab", found: false, verified: false, error: true, reason: "rate_limited" };
    } else {
      return { name: "GitLab", found: false, verified: false, error: true, reason: "request_failed" };
    }
  } catch (error) {
    if (process.env.DEBUG_PROVIDERS === "true") {
      console.error(`GitLab API error:`, error.message);
    }
    return { name: "GitLab", found: false, verified: false, error: true, reason: "request_failed" };
  }
}

module.exports = { checkGitLabUsername };
