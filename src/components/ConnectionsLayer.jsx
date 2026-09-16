const CARD_WIDTH = 200
const CARD_HEIGHT = 220

function center(card) {
  return { x: card.position_x + CARD_WIDTH / 2, y: card.position_y + CARD_HEIGHT / 2 }
}

function unitVector(from, to) {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length }
}

export default function ConnectionsLayer({ connections, cardsById, width, height }) {
  return (
    <svg className="connections-layer" width={width} height={height}>
      <defs>
        <marker
          id="conn-arrow"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="12"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M2 2L10 6L2 10" fill="none" stroke="#5b6b78" strokeWidth="2" />
        </marker>
      </defs>
      {connections.map((conn) => {
        const source = cardsById[conn.source_id]
        const target = cardsById[conn.target_id]
        if (!source || !target) return null
        const sourceCenter = center(source)
        const targetCenter = center(target)
        const from = sourceCenter
        const to = targetCenter
        const direction = unitVector(from, to)
        const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
        const afterArrow = { x: midpoint.x + direction.x * 10, y: midpoint.y + direction.y * 10 }
        return (
          <g key={conn.id}>
            {conn.directed ? (
              <>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={midpoint.x}
                  y2={midpoint.y}
                  className="connection-line"
                  markerEnd="url(#conn-arrow)"
                />
                <line x1={afterArrow.x} y1={afterArrow.y} x2={to.x} y2={to.y} className="connection-line" />
              </>
            ) : (
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="connection-line" />
            )}
          </g>
        )
      })}
    </svg>
  )
}

export { CARD_WIDTH, CARD_HEIGHT }
