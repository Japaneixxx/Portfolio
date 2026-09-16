import { useNavigate } from 'react-router-dom'
import { colorFor } from '../lib/palette.js'

export default function CardNode({ card, categoryColorKey, style, onDragStart, onClick }) {
  const navigate = useNavigate()
  const colors = colorFor(categoryColorKey)

  return (
    <div
      className="card-node"
      style={{ ...style, borderColor: colors.border }}
      onMouseDown={onDragStart}
      onClick={() => onClick?.() || (!onDragStart && navigate(`/card/${card.id}`))}
    >
      <div className="card-node-band" style={{ background: colors.band, color: colors.text }}>
        {card.title}
      </div>
      <div className="card-node-subtitle">{card.subtitle || ''}</div>
      <div className="card-node-image">
        {card.image_url ? (
          <img src={card.image_url} alt={card.title} />
        ) : (
          <div className="card-node-image-placeholder" />
        )}
      </div>
    </div>
  )
}
