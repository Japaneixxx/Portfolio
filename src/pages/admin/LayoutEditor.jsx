import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'
import { usePanZoom } from '../../lib/usePanZoom.js'
import CardNode from '../../components/CardNode.jsx'
import ConnectionsLayer from '../../components/ConnectionsLayer.jsx'
import ZoomControls from '../../components/ZoomControls.jsx'

const CANVAS_SIZE = { width: 3000, height: 2000 }

export default function LayoutEditor({ cards, categories, connections, onChange }) {
  const [positions, setPositions] = useState(() => {
    const map = {}
    cards.forEach((c) => {
      map[c.id] = { x: c.position_x, y: c.position_y }
    })
    return map
  })
  const cardDragRef = useRef(null)

  const { viewportRef, scale, offset, canvasStyle, handlers: panHandlers, zoomIn, zoomOut, reset } = usePanZoom()

  const gridStyle = {
    backgroundPosition: `calc(50% - 1500px + ${offset.x}px) calc(50% - 1000px + ${offset.y}px)`,
    backgroundSize: `${80 * scale}px ${80 * scale}px`,
    '--axis-x': `${offset.x + 1500 * (scale - 1)}px`,
    '--axis-y': `${offset.y + 1000 * (scale - 1)}px`,
  }

  const cardsWithLivePosition = cards.map((c) => ({
    ...c,
    position_x: positions[c.id]?.x ?? c.position_x,
    position_y: positions[c.id]?.y ?? c.position_y,
  }))

  const cardsById = {}
  cardsWithLivePosition.forEach((c) => {
    cardsById[c.id] = c
  })

  function startCardDrag(card, e) {
    e.stopPropagation()
    cardDragRef.current = {
      cardId: card.id,
      startX: e.clientX,
      startY: e.clientY,
      origin: positions[card.id] || { x: card.position_x, y: card.position_y },
    }
  }

  function onMouseMove(e) {
    if (cardDragRef.current) {
      const { cardId, startX, startY, origin } = cardDragRef.current
      const dx = (e.clientX - startX) / scale
      const dy = (e.clientY - startY) / scale
      setPositions((prev) => ({ ...prev, [cardId]: { x: origin.x + dx, y: origin.y + dy } }))
      return
    }
    panHandlers.onMouseMove(e)
  }

  function onTouchMove(e) {
    if (cardDragRef.current) {
      const touch = e.touches[0]
      if (!touch) return
      const { cardId, startX, startY, origin } = cardDragRef.current
      const dx = (touch.clientX - startX) / scale
      const dy = (touch.clientY - startY) / scale
      setPositions((prev) => ({ ...prev, [cardId]: { x: origin.x + dx, y: origin.y + dy } }))
      e.preventDefault()
      return
    }
    panHandlers.onTouchMove(e)
  }

  async function onMouseUp() {
    if (cardDragRef.current) {
      const { cardId } = cardDragRef.current
      cardDragRef.current = null
      const pos = positions[cardId]
      await supabase.from('cards').update({ position_x: pos.x, position_y: pos.y }).eq('id', cardId)
      onChange()
      return
    }
    panHandlers.onMouseUp()
  }

  return (
    <div className="admin-section">
      <h2>Layout</h2>
      <p className="admin-hint">
        Arraste os cards para reorganizar (a posição é salva assim que você solta). Arraste o fundo pra
        navegar e use a roda do mouse ou os botões pra dar zoom.
      </p>
      <div
        className="layout-editor-viewport"
        ref={viewportRef}
        style={gridStyle}
        onMouseDown={panHandlers.onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={panHandlers.onWheel}
        onTouchStart={panHandlers.onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={panHandlers.onTouchEnd}
        onTouchCancel={panHandlers.onTouchCancel}
      >
        <div className="shiplog-canvas" style={{ width: CANVAS_SIZE.width, height: CANVAS_SIZE.height, ...canvasStyle }}>
          <ConnectionsLayer
            connections={connections}
            cardsById={cardsById}
            width={CANVAS_SIZE.width}
            height={CANVAS_SIZE.height}
          />
          {cardsWithLivePosition.map((card) => (
            <CardNode
              key={card.id}
              card={card}
              categoryColorKey={categories.find((c) => c.id === card.category_id)?.color_key}
              style={{ position: 'absolute', left: card.position_x, top: card.position_y, cursor: 'grab' }}
              onDragStart={(e) => startCardDrag(card, e)}
            />
          ))}
        </div>
        <ZoomControls zoomIn={zoomIn} zoomOut={zoomOut} reset={reset} />
      </div>
    </div>
  )
}
