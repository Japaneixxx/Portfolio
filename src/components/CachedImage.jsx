import { useEffect, useState } from 'react'

const IMAGE_CACHE = 'portfolio-images-v1'

async function getCachedImage(url) {
  if (!('caches' in window)) return null
  const cache = await caches.open(IMAGE_CACHE)
  const response = await cache.match(url)
  if (!response) return null
  return URL.createObjectURL(await response.blob())
}

async function cacheImage(url) {
  if (!('caches' in window)) return
  const cache = await caches.open(IMAGE_CACHE)
  if (await cache.match(url)) return
  const response = await fetch(url, { mode: 'no-cors', cache: 'no-cache' })
  await cache.put(url, response)
}

export default function CachedImage({ src, alt }) {
  const [imageSrc, setImageSrc] = useState(src)

  useEffect(() => {
    setImageSrc(src)
    return () => {
      if (imageSrc?.startsWith('blob:')) URL.revokeObjectURL(imageSrc)
    }
  }, [src])

  async function handleLoad() {
    try {
      await cacheImage(src)
    } catch {
      // Some remote servers do not allow browser-side caching.
    }
  }

  async function handleError() {
    try {
      const cachedSrc = await getCachedImage(src)
      if (cachedSrc) setImageSrc(cachedSrc)
    } catch {
      // Keep the normal broken-image fallback when no cached copy exists.
    }
  }

  return <img src={imageSrc} alt={alt} onLoad={handleLoad} onError={handleError} />
}