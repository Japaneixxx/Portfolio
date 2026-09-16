import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'

export default function ConnectionsManager({ cards, connections, onChange }) {
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [directed, setDirected] = useState(false)
  const [error, setError] = useState(null)

  const cardTitle = (id) => cards.find((c) => c.id === id)?.title || '(card removido)'

  async function addConnection(e) {
    e.preventDefault()
    setError(null)
    if (sourceId === targetId) {
      setError('Escolha dois cards diferentes.')
      return
    }
    const { error: insertError } = await supabase
      .from('connections')
      .insert({ source_id: sourceId, target_id: targetId, directed })
    if (insertError) {
      setError(insertError.message)
      return
    }
    setSourceId('')
    setTargetId('')
    setDirected(false)
    onChange()
  }

  async function removeConnection(id) {
    await supabase.from('connections').delete().eq('id', id)
    onChange()
  }

  return (
    <div className="admin-section">
      <h2>Conexões</h2>
      <p className="admin-hint">
        Um card sem nenhuma conexão fica sozinho no diário de bordo — não é obrigatório ligar tudo.
      </p>
      <ul className="admin-list">
        {connections.map((conn) => (
          <li key={conn.id}>
            {cardTitle(conn.source_id)} {conn.directed ? '→' : '—'} {cardTitle(conn.target_id)}
            <button className="link-button" onClick={() => removeConnection(conn.id)}>
              remover
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={addConnection} className="inline-form">
        <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} required>
          <option value="">De…</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
          <option value="">Para…</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <label className="checkbox-label">
          <input type="checkbox" checked={directed} onChange={(e) => setDirected(e.target.checked)} />
          com seta
        </label>
        <button type="submit">Conectar</button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
