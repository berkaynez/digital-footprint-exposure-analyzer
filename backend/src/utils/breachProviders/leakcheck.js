async function checkLeakCheck(identifier) {
  try {
    const res = await fetch(`https://leakcheck.io/api/public?check=${encodeURIComponent(identifier)}`)
    
    // Sometimes APIs return 404 for "not found", we shouldn't fail the whole check if it's just a normal not found.
    // However, LeakCheck public API returns success: false for not found. We'll handle it below.
    if (!res.ok) {
        throw new Error(`LeakCheck API fetch failed: ${res.status}`)
    }
    
    const data = await res.json()
    
    if (data.success === true) {
      return {
        provider: "LeakCheck Public API",
        checked: true,
        configured: true,
        found: data.found > 0,
        breachCount: data.found,
        sources: data.sources ? data.sources.map(s => ({ name: s.name, date: s.date })) : [],
        exposedFields: data.fields || [],
        confidence: "external_public_provider",
        error: false
      }
    } else {
      // Per instructions, if success is false, we return error: true
      return {
        provider: "LeakCheck Public API",
        checked: true,
        configured: true,
        found: false,
        breachCount: 0,
        sources: [],
        exposedFields: [],
        confidence: "external_public_provider",
        error: true
      }
    }
  } catch (error) {
    return {
      provider: "LeakCheck Public API",
      checked: false,
      configured: true,
      found: false,
      breachCount: 0,
      sources: [],
      exposedFields: [],
      confidence: "external_public_provider",
      error: true
    }
  }
}

module.exports = { checkLeakCheck }
