import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import { colorFor } from '../lib/palette.js'
import { getPublicDataCache, loadBundledPublicData, savePublicDataCache } from '../lib/publicDataCache.js'
import CachedImage from '../components/CachedImage.jsx'

export default function CardDetail() {
  const { id } = useParams()
  const [card, setCard] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: cardData, error: cardError } = await supabase.from('cards').select('*').eq('id', id).single()
      let resolvedCard = cardData
      let categoryData = null
      if (!cardError && cardData?.category_id) {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('id', cardData.category_id)
          .single()
        categoryData = data
      }
      if (cardError) {
        const cached = getPublicDataCache() || (await loadBundledPublicData())
        resolvedCard = cached?.cards.find((cachedCard) => String(cachedCard.id) === String(id)) || null
        categoryData = cached?.categories.find((category) => category.id === resolvedCard?.category_id) || null
        if (resolvedCard) setOffline(true)
      } else {
        const cached = getPublicDataCache() || { cards: [], categories: [], connections: [] }
        savePublicDataCache({
          cards: [...cached.cards.filter((cachedCard) => String(cachedCard.id) !== String(cardData.id)), cardData],
          categories: categoryData
            ? [...cached.categories.filter((category) => category.id !== categoryData.id), categoryData]
            : cached.categories,
          connections: cached.connections,
        })
      }
      setCard(resolvedCard)
      setCategory(categoryData)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="page-loading">Carregando…</div>
  if (!card) return <div className="page-loading">Registro não encontrado.</div>

  const colors = colorFor(category?.color_key)

  return (
    <div className="card-detail-page">
      {offline && <div className="offline-banner">Exibindo a última versão salva. O banco de dados está temporariamente indisponível.</div>}
      <Link to="/" className="back-link">
        ← Voltar ao Portifolio
      </Link>
      <div className="card-detail-title" style={{ borderColor: colors.border }}>
        <h1>{card.title}</h1>
        {card.subtitle && <p>{card.subtitle}</p>}
      </div>
      <div className="card-detail-grid">
        <div className="card-detail-content" style={{ borderColor: colors.border }}>
          <p>{card.content}</p>
          {card.external_url && (
            <a href={card.external_url} target="_blank" rel="noreferrer" className="card-detail-link">
              Ver mais →
            </a>
          )}
        </div>
        <div className="card-detail-side">
          <div className="card-detail-image" style={{ borderColor: colors.border }}>
            {card.image_url ? (
              <CachedImage src={card.image_url} alt={card.title} />
            ) : (
              <div className="card-node-image-placeholder" />
            )}
          </div>
          {card.skills?.length > 0 && (
            <div className="card-detail-skills" style={{ borderColor: colors.border }}>
              <h3>Habilidades</h3>
              <div className="skills-tags">
                {card.skills.map((skill) => (
                  <span key={skill} className="skill-tag" style={{ borderColor: colors.border }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
