function normalizeUsername(username) {
  const raw = String(username || '').toLowerCase()

  const substitutions = {
    '4': 'a',
    '3': 'e',
    '1': 'i',
    '0': 'o',
    '5': 's',
  }

  let out = ''
  for (const ch of raw) {
    if (ch === ' ' || ch === '_' || ch === '.' || ch === '-' || ch === '\t') {
      continue
    }
    out += substitutions[ch] ? substitutions[ch] : ch
  }

  return out
}

function levenshteinDistance(a, b) {
  const s = String(a || '')
  const t = String(b || '')

  if (s === t) return 0
  if (s.length === 0) return t.length
  if (t.length === 0) return s.length

  // DP with two rows to keep memory small.
  const prev = new Array(t.length + 1)
  const curr = new Array(t.length + 1)

  for (let j = 0; j <= t.length; j++) prev[j] = j

  for (let i = 1; i <= s.length; i++) {
    curr[0] = i
    const sChar = s[i - 1]

    for (let j = 1; j <= t.length; j++) {
      const cost = sChar === t[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution
      )
    }

    for (let j = 0; j <= t.length; j++) prev[j] = curr[j]
  }

  return prev[t.length]
}

function similarityScore(a, b) {
  const na = normalizeUsername(a)
  const nb = normalizeUsername(b)

  if (!na && !nb) return 1
  if (!na || !nb) return 0

  const dist = levenshteinDistance(na, nb)
  const maxLen = Math.max(na.length, nb.length)
  const score = 1 - dist / maxLen

  // Clamp just in case
  return Math.max(0, Math.min(1, score))
}

/*
Simple examples:

- "berkaynergiz" vs "b3rkaynergiz" should be high:
  similarityScore("berkaynergiz", "b3rkaynergiz")  // ~1.0 after normalization

- "john_doe" vs "doejohn" should be lower for now:
  similarityScore("john_doe", "doejohn") // lower, because no token reordering logic yet
*/

module.exports = {
  normalizeUsername,
  levenshteinDistance,
  similarityScore,
}

