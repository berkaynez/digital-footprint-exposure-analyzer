const MAX_USERNAME_LENGTH = 255
const MAX_VARIATIONS = 48

function addVariation(variations, value, base) {
  const variation = String(value || '').trim()
  if (!variation || variation === base || variations.includes(variation)) return
  variations.push(variation)
}

function selectEvenlySpacedVariations(variations, limit) {
  if (variations.length <= limit) return variations
  if (limit === 1) return [variations[Math.floor(variations.length / 2)]]

  return Array.from({ length: limit }, (_, sampleIndex) => {
    const position = Math.round((sampleIndex * (variations.length - 1)) / (limit - 1))
    return variations[position]
  })
}

function generateUsernameVariationsWithMetadata(username) {
  const base = String(username || '').trim()
  if (!base || base.length > MAX_USERNAME_LENGTH) {
    return { variations: [], capped: false }
  }

  const substitutions = {
    a: '4',
    e: '3',
    i: '1',
    o: '0',
    s: '5',
  }
  const lower = base.toLowerCase()
  const prefixVariations = []
  const replacementVariations = []
  const suffixVariations = []

  for (const suffix of ['1', '12', '123', '0']) {
    addVariation(prefixVariations, `${base}${suffix}`, base)
  }

  let substituted = ''
  for (let index = 0; index < base.length; index++) {
    const character = base[index]
    const replacement = substitutions[lower[index]]
    substituted += replacement || character
  }
  addVariation(prefixVariations, substituted, base)

  for (let index = 0; index < base.length; index++) {
    const replacement = substitutions[lower[index]]
    if (!replacement) continue
    addVariation(replacementVariations, base.slice(0, index) + replacement + base.slice(index + 1), base)
  }

  addVariation(suffixVariations, `${base}_`, base)
  addVariation(suffixVariations, `_${base}`, base)
  if (base.length >= 2) {
    const middle = Math.floor(base.length / 2)
    addVariation(suffixVariations, `${base.slice(0, middle)}_${base.slice(middle)}`, base)
  }
  for (const index of [1, 2, base.length - 2, base.length - 1]) {
    if (index <= 0 || index >= base.length) continue
    addVariation(suffixVariations, `${base.slice(0, index)}_${base.slice(index)}`, base)
  }

  addVariation(suffixVariations, base.slice(0, Math.max(1, base.length - 1)), base)
  addVariation(suffixVariations, base.slice(0, Math.max(1, base.length - 2)), base)
  if (base.length >= 6) addVariation(suffixVariations, base.slice(0, 4), base)
  if (base.length >= 8) addVariation(suffixVariations, base.slice(0, 6), base)

  const originalOrder = []
  for (const variation of [...prefixVariations, ...replacementVariations, ...suffixVariations]) {
    addVariation(originalOrder, variation, base)
  }
  if (originalOrder.length <= MAX_VARIATIONS) {
    return { variations: originalOrder, capped: false }
  }

  const cappedVariations = []
  for (const variation of [...prefixVariations, ...suffixVariations]) {
    addVariation(cappedVariations, variation, base)
  }
  const remainingSlots = Math.max(0, MAX_VARIATIONS - cappedVariations.length)
  const eligibleReplacements = replacementVariations.filter((variation) => !cappedVariations.includes(variation))
  for (const variation of selectEvenlySpacedVariations(eligibleReplacements, remainingSlots)) {
    addVariation(cappedVariations, variation, base)
  }

  return { variations: cappedVariations, capped: true }
}

function generateUsernameVariations(username) {
  return generateUsernameVariationsWithMetadata(username).variations
}

module.exports = {
  MAX_USERNAME_LENGTH,
  MAX_VARIATIONS,
  generateUsernameVariations,
  generateUsernameVariationsWithMetadata,
}
