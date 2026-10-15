import JSZip from 'jszip'

const IMAGE_EXTENSIONS = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
}

function extensionFromUrl(url) {
  const extension = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase()
  return extension && /^[a-z0-9]{2,5}$/.test(extension) ? extension : 'bin'
}

async function fetchImage(url) {
  try {
    const response = await fetch(url)
    if (response.ok) return response
  } catch {
    // Try a browser-cached copy below.
  }

  if ('caches' in window) {
    const cachedResponse = await caches.match(url)
    if (cachedResponse) return cachedResponse
  }

  throw new Error(`Não foi possível baixar a imagem: ${url}`)
}

export async function downloadFallbackBackup({ cards, categories, connections }) {
  const zip = new JSZip()
  const failedImages = []
  const exportedCards = []

  for (const card of cards) {
    const exportedCard = { ...card }
    if (card.image_url) {
      try {
        const response = await fetchImage(card.image_url)
        const blob = await response.blob()
        const extension = IMAGE_EXTENSIONS[response.headers.get('content-type')] || extensionFromUrl(card.image_url)
        const imagePath = `images/${card.id}.${extension}`
        zip.file(imagePath, blob)
        exportedCard.image_url = `/${imagePath}`
        exportedCard.source_image_url = card.image_url
      } catch {
        failedImages.push({ id: card.id, title: card.title, url: card.image_url })
      }
    }
    exportedCards.push(exportedCard)
  }

  zip.file('fallback-data.json', JSON.stringify({
    version: 1,
    exported_at: new Date().toISOString(),
    cards: exportedCards,
    categories,
    connections,
    failed_images: failedImages,
  }, null, 2))
  zip.file('README.txt', [
    'FALLBACK DO PORTFOLIO',
    '',
    'Copie fallback-data.json para a pasta public/ do projeto.',
    'Copie a pasta images/ para public/images/.',
    'Depois, publique o projeto novamente.',
    '',
    failedImages.length
      ? `Imagens que nao foram incorporadas: ${failedImages.length}. Consulte failed_images no JSON.`
      : 'Todas as imagens foram incorporadas ao pacote.',
  ].join('\n'))

  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `portfolio-fallback-${new Date().toISOString().slice(0, 10)}.zip`
  anchor.click()
  URL.revokeObjectURL(url)

  return { totalImages: cards.filter((card) => card.image_url).length, failedImages: failedImages.length }
}