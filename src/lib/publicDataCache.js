const CACHE_KEY = 'portfolio-public-data-v1'

function readCache() {
  try {
    const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) || 'null')
    if (!cached || !Array.isArray(cached.cards) || !Array.isArray(cached.categories) || !Array.isArray(cached.connections)) {
      return null
    }
    return cached
  } catch {
    return null
  }
}

export function getPublicDataCache() {
  return readCache()
}

export function savePublicDataCache(data) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...data,
      savedAt: new Date().toISOString(),
    }))
  } catch {
    // Storage can be unavailable or full; the network response is still usable.
  }
}

export async function loadBundledPublicData() {
  try {
    const response = await fetch('/fallback-data.json', { cache: 'no-store' })
    if (!response.ok) return null
    const data = await response.json()
    if (!Array.isArray(data.cards) || !Array.isArray(data.categories) || !Array.isArray(data.connections)) {
      return null
    }
    savePublicDataCache(data)
    return data
  } catch {
    return null
  }
}