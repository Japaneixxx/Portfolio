import { useEffect, useState } from 'react'
import { embeddedImageUrlFor, imageUrlFor } from '../lib/cardImage.js'
import CachedImage from './CachedImage.jsx'

export default function CardImage({ card }) {
  const directImageUrl = imageUrlFor(card)
  const [imageUrl, setImageUrl] = useState(directImageUrl)

  useEffect(() => {
    let active = true
    setImageUrl(directImageUrl)
    if (directImageUrl || !card.external_url) return () => {
      active = false
    }

    embeddedImageUrlFor(card.external_url).then((resolvedImageUrl) => {
      if (active) setImageUrl(resolvedImageUrl)
    })

    return () => {
      active = false
    }
  }, [card.external_url, directImageUrl])

  if (!imageUrl) return <div className="card-node-image-placeholder" />
  return <CachedImage src={imageUrl} alt={card.title} />
}