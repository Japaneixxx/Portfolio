import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { usePanZoom } from '../lib/usePanZoom.js'
import CardNode from '../components/CardNode.jsx'
import ConnectionsLayer from '../components/ConnectionsLayer.jsx'
import ZoomControls from '../components/ZoomControls.jsx'

const CANVAS_SIZE = { width: 6000, height: 4000 }
const CANVAS_PADDING = { x: 1500, y: 1000 }

export default function ShipLog() {
  const [cards, setCards] = useState([])
  const [categories, setCategories] = useState({})
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { viewportRef, scale, offset, canvasStyle, handlers, zoomIn, zoomOut, reset } = usePanZoom(
    { x: 0, y: 0 },
    CANVAS_SIZE,
  )

  const gridStyle = {
    backgroundPosition: `calc(50% - 3000px + ${offset.x}px) calc(50% - 2000px + ${offset.y}px)`,
    backgroundSize: `${80 * scale}px ${80 * scale}px`,
    '--axis-x': `${offset.x + 3000 * (scale - 1)}px`,
    '--axis-y': `${offset.y + 2000 * (scale - 1)}px`,
  }

  useEffect(() => {
    async function load() {
      const [cardsRes, categoriesRes, connectionsRes] = await Promise.all([
        supabase.from('cards').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('connections').select('*'),
      ])

      if (cardsRes.error || categoriesRes.error || connectionsRes.error) {
        setError(cardsRes.error || categoriesRes.error || connectionsRes.error)
        setLoading(false)
        return
      }

      const categoriesById = {}
      categoriesRes.data.forEach((c) => {
        categoriesById[c.id] = c
      })

      setCategories(categoriesById)
      setCards(cardsRes.data)
      setConnections(connectionsRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const cardsById = {}
  cards.forEach((c) => {
    cardsById[c.id] = {
      ...c,
      position_x: c.position_x + CANVAS_PADDING.x,
      position_y: c.position_y + CANVAS_PADDING.y,
    }
  })

  if (loading) return <div className="page-loading">Carregando diário de bordo…</div>
  if (error)
    return (
      <div className="page-loading">Não foi possível carregar os dados. Verifique a configuração do Supabase.</div>
    )

  if (cards.length === 0) {
    return (
      <div className="empty-shiplog">
        <p>Nenhum registro ainda. Entre em /admin para começar a preencher o diário de bordo.</p>
      </div>
    )
  }

  return (
    <div className="shiplog-viewport" ref={viewportRef} style={gridStyle} {...handlers}>
      <div className="shiplog-canvas" style={{ width: CANVAS_SIZE.width, height: CANVAS_SIZE.height, ...canvasStyle }}>
        <ConnectionsLayer
          connections={connections}
          cardsById={cardsById}
          width={CANVAS_SIZE.width}
          height={CANVAS_SIZE.height}
        />
        {cards.map((card) => (
          <CardNode
            key={card.id}
            card={card}
            categoryColorKey={categories[card.category_id]?.color_key}
            style={{
              position: 'absolute',
              left: card.position_x + CANVAS_PADDING.x,
              top: card.position_y + CANVAS_PADDING.y,
            }}
          />
        ))}
      </div>
      <ZoomControls zoomIn={zoomIn} zoomOut={zoomOut} reset={reset} />
    </div>
  )
}
