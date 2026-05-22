async function checkTelegramUsername(username) {
  // Telegram public web pages can return generic contact pages for arbitrary usernames, so Telegram is disabled as a match-producing provider until a reliable verification method is available.
  return {
    name: "Telegram",
    found: false,
    verified: false,
    signalType: "public_signal",
    skipped: true,
    confidence: "unreliable",
    reason: "unreliable_public_lookup"
  };
}

module.exports = { checkTelegramUsername };
