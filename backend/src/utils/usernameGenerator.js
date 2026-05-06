function generateUsernameVariations(username) {
  const base = String(username || '').trim()
  if (!base) return []

  const variations = new Set()

  const add = (value) => {
    const v = String(value || '').trim()
    if (!v) return
    if (v === base) return
    variations.add(v)
  }

  // Adding numbers
  for (const n of ['1', '12', '123', '0']) {
    add(`${base}${n}`)
  }

  // Common substitutions (leetspeak-ish)
  const subs = {
    a: '4',
    e: '3',
    i: '1',
    o: '0',
    s: '5',
  }

  const lower = base.toLowerCase()
  let substituted = ''
  for (let i = 0; i < base.length; i++) {
    const ch = base[i]
    const lowerCh = lower[i]
    substituted += subs[lowerCh] ? subs[lowerCh] : ch
  }
  add(substituted)

  // Also generate a few single-letter replacement variants
  for (let i = 0; i < base.length; i++) {
    const lowerCh = lower[i]
    const repl = subs[lowerCh]
    if (!repl) continue
    add(base.slice(0, i) + repl + base.slice(i + 1))
  }

  // Adding underscores
  add(`${base}_`)
  add(`_${base}`)
  if (base.length >= 2) {
    const mid = Math.floor(base.length / 2)
    add(`${base.slice(0, mid)}_${base.slice(mid)}`)
  }
  // A couple more underscore insertion positions (kept small on purpose)
  for (const idx of [1, 2, base.length - 2, base.length - 1]) {
    if (idx <= 0 || idx >= base.length) continue
    add(`${base.slice(0, idx)}_${base.slice(idx)}`)
  }

  // Simple truncation
  add(base.slice(0, Math.max(1, base.length - 1)))
  add(base.slice(0, Math.max(1, base.length - 2)))
  if (base.length >= 6) add(base.slice(0, 4))
  if (base.length >= 8) add(base.slice(0, 6))

  return Array.from(variations)
}

module.exports = { generateUsernameVariations }

