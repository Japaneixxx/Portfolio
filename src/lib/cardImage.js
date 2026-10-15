const IMAGE_URL_PATTERN = /\.(avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i

function youtubeThumbnailUrl(url) {
  try {
    const parsedUrl = new URL(url)
    let videoId = null

    if (parsedUrl.hostname === 'youtu.be') {
      videoId = parsedUrl.pathname.slice(1).split('/')[0]
    } else if (parsedUrl.hostname.endsWith('youtube.com')) {
      videoId = parsedUrl.searchParams.get('v')
      if (!videoId && /^\/(shorts|embed|live)\//.test(parsedUrl.pathname)) {
        videoId = parsedUrl.pathname.split('/')[2]
      }
    }

    if (!videoId || !/^[\w-]{11}$/.test(videoId)) return null
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  } catch {
    return null
  }
}

export function imageUrlFor(card) {
  if (card.image_url) return card.image_url
  if (card.external_url) {
    const youtubeImageUrl = youtubeThumbnailUrl(card.external_url)
    if (youtubeImageUrl) return youtubeImageUrl
  }
  if (card.external_url && IMAGE_URL_PATTERN.test(card.external_url)) return card.external_url
  return null
}

export async function embeddedImageUrlFor(url) {
  if (!url) return null

  const cacheKey = `portfolio-embed-image:${url}`
  try {
    const cached = window.localStorage.getItem(cacheKey)
    if (cached) return cached === 'none' ? null : cached
  } catch {
    // Continue with the metadata request when localStorage is unavailable.
  }

  try {
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=true`)
    if (!response.ok) throw new Error('Metadata request failed')
    const result = await response.json()
    const imageUrl = result.data?.image?.url || null
    try {
      window.localStorage.setItem(cacheKey, imageUrl || 'none')
    } catch {
      // The image can still be used for this visit.
    }
    return imageUrl
  } catch {
    return null
  }
}

export async function resolveCardImageUrl(card) {
  const directImageUrl = imageUrlFor(card)
  if (directImageUrl) return directImageUrl
  return embeddedImageUrlFor(card.external_url)
}