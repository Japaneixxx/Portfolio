import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'
import { usePanZoom } from '../../lib/usePanZoom.js'
import CardNode from '../../components/CardNode.jsx'
import ConnectionsLayer from '../../components/ConnectionsLayer.jsx'
import ZoomControls from '../../components/ZoomControls.jsx'

const CANVAS_SIZE = { width: 6000, height: 4000 }
const CANVAS_PADDING = { x: 1500, y: 1000 }

export default function LayoutEditor({ cards, categories, connections, onChange }) {
  const [positions, setPositions] = useState(() => {
    const map = {}
    cards.forEach((c) => {
      map[c.id] = { x: c.position_x, y: c.position_y }
    })
    return map
  })
  const cardDragRef = useRef(null)
  const [linkMode, setLinkMode] = useState(false)
  const [linkSourceId, setLinkSourceId] = useState(null)
  const [directed, setDirected] = useState(false)
  const [linkError, setLinkError] = useState(null)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [savingCard, setSavingCard] = useState(false)
  const [editError, setEditError] = useState(null)

  const { viewportRef, scale, offset, canvasStyle, handlers: panHandlers, zoomIn, zoomOut, reset } = usePanZoom(
    { x: 0, y: 0 },
    CANVAS_SIZE,
  )

  const gridStyle = {
    backgroundPosition: `calc(50% - 3000px + ${offset.x}px) calc(50% - 2000px + ${offset.y}px)`,
    backgroundSize: `${80 * scale}px ${80 * scale}px`,
    '--axis-x': `${offset.x + 3000 * (scale - 1)}px`,
    '--axis-y': `${offset.y + 2000 * (scale - 1)}px`,
  }

  const cardsWithLivePosition = cards.map((c) => ({
    ...c,
    position_x: (positions[c.id]?.x ?? c.position_x) + CANVAS_PADDING.x,
    position_y: (positions[c.id]?.y ?? c.position_y) + CANVAS_PADDING.y,
  }))

  const cardsById = {}
  cardsWithLivePosition.forEach((c) => {
    cardsById[c.id] = c
  })

  function startCardDrag(card, e) {
    e.stopPropagation()
    if (linkMode) return
    cardDragRef.current = {
      cardId: card.id,
      startX: e.clientX,
      startY: e.clientY,
      origin: positions[card.id] || {
        x: card.position_x - CANVAS_PADDING.x,
        y: card.position_y - CANVAS_PADDING.y,
      },
    }
  }

  async function selectCardForLink(card) {
    if (!linkMode) return
    setLinkError(null)
    if (!linkSourceId) {
      setLinkSourceId(card.id)
      return
    }
    if (linkSourceId === card.id) {
      setLinkError('Escolha um segundo card diferente.')
      return
    }
    const alreadyConnected = connections.some(
      (connection) => connection.source_id === linkSourceId && connection.target_id === card.id
    )
    if (alreadyConnected) {
      setLinkError('Esses cards já estão conectados nessa direção.')
      return
    }
    const result = await supabase.from('connections').insert({
      source_id: linkSourceId,
      target_id: card.id,
      directed,
    })
    if (result.error) {
      setLinkError(result.error.message)
      return
    }
    setLinkSourceId(null)
    onChange()
  }

  function selectCardForEdit(card) {
    if (linkMode) return
    setSelectedCardId(card.id)
    setEditError(null)
    setEditForm({
      title: card.title || '',
      subtitle: card.subtitle || '',
      category_id: card.category_id || '',
      image_url: card.image_url || '',
      content: card.content || '',
      skills: (card.skills || []).join(', '),
      external_url: card.external_url || '',
    })
  }

  async function saveCard() {
    if (!selectedCardId || !editForm) return
    setSavingCard(true)
    setEditError(null)
    const result = await supabase
      .from('cards')
      .update({
        title: editForm.title,
        subtitle: editForm.subtitle || null,
        category_id: editForm.category_id || null,
        image_url: editForm.image_url || null,
        content: editForm.content || null,
        skills: editForm.skills
          ? editForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean)
          : [],
        external_url: editForm.external_url || null,
      })
      .eq('id', selectedCardId)
    setSavingCard(false)
    if (result.error) {
      setEditError(result.error.message)
      return
    }
    onChange()
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
    <div className="admin-section layout-editor-section">
      <h2>Layout</h2>
      <p className="admin-hint">
        Arraste os cards para reorganizar (a posição é salva assim que você solta). Arraste o fundo pra
        navegar e use a roda do mouse ou os botões pra dar zoom.
      </p>
      <div className="layout-link-toolbar">
        <button
          type="button"
          className={linkMode ? 'active' : ''}
          onClick={() => {
            setLinkMode((active) => !active)
            setLinkSourceId(null)
            setLinkError(null)
          }}
        >
          {linkMode ? 'Sair de linkar' : 'Linkar cards'}
        </button>
        {linkMode && (
          <>
            <label className="checkbox-label">
              <input type="checkbox" checked={directed} onChange={(e) => setDirected(e.target.checked)} />
              com seta
            </label>
            <span className="admin-hint">
              {linkSourceId ? 'Agora clique no card de destino.' : 'Clique no card de origem.'}
            </span>
          </>
        )}
        {linkError && <span className="form-error">{linkError}</span>}
      </div>
      <div className="layout-editor-workspace">
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
                onClick={() => (linkMode ? selectCardForLink(card) : selectCardForEdit(card))}
              />
            ))}
          </div>
          <ZoomControls zoomIn={zoomIn} zoomOut={zoomOut} reset={reset} />
        </div>
        {editForm && (
          <div className="layout-card-editor">
            <div className="layout-card-editor-header">
              <h3>Editar card</h3>
              <button type="button" className="link-button" onClick={() => setEditForm(null)}>
                fechar
              </button>
            </div>
            <div className="layout-card-editor-fields">
            <label>
              Título
              <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
            </label>
            <label>
              Subtítulo
              <input value={editForm.subtitle} onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })} />
            </label>
            <label>
              Categoria
              <select value={editForm.category_id} onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}>
                <option value="">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              URL da imagem
              <input value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} />
            </label>
            <label>
              Conteúdo / descrição
              <textarea rows={4} value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
            </label>
            <label>
              Habilidades
              <input value={editForm.skills} onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })} />
            </label>
            <label>
              Link externo
              <input value={editForm.external_url} onChange={(e) => setEditForm({ ...editForm, external_url: e.target.value })} />
            </label>
            </div>
            {editError && <p className="form-error">{editError}</p>}
            <button type="button" onClick={saveCard} disabled={savingCard}>
              {savingCard ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
