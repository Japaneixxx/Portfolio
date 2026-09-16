import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'
import { PALETTE } from '../../lib/palette.js'

export default function CategoriesManager({ categories, onChange }) {
  const [name, setName] = useState('')
  const [colorKey, setColorKey] = useState('cyan')
  const [error, setError] = useState(null)

  async function addCategory(e) {
    e.preventDefault()
    setError(null)
    const { error: insertError } = await supabase.from('categories').insert({ name, color_key: colorKey })
    if (insertError) {
      setError(insertError.message)
      return
    }
    setName('')
    onChange()
  }

  async function removeCategory(id) {
    if (!confirm('Apagar esta categoria? Cards que a usam ficam sem categoria.')) return
    await supabase.from('categories').delete().eq('id', id)
    onChange()
  }

  return (
    <div className="admin-section">
      <h2>Categorias</h2>
      <ul className="admin-list">
        {categories.map((cat) => (
          <li key={cat.id}>
            <span className="color-dot" style={{ background: PALETTE[cat.color_key]?.band }} />
            {cat.name}
            <button className="link-button" onClick={() => removeCategory(cat.id)}>
              apagar
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={addCategory} className="inline-form">
        <input placeholder="Nome da categoria" value={name} onChange={(e) => setName(e.target.value)} required />
        <select value={colorKey} onChange={(e) => setColorKey(e.target.value)}>
          {Object.keys(PALETTE).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
        <button type="submit">Adicionar</button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
