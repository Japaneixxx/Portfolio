import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'
import { parseLinkedInExport, parseLinkedInPdf } from '../../lib/linkedinImport.js'

const DEFAULT_CARD_POSITION = { x: 1400, y: 890 }

function normalizeTitle(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

const emptyForm = {
  id: null,
  title: '',
  subtitle: '',
  category_id: '',
  image_url: '',
  content: '',
  skills: '',
  external_url: '',
}

export default function CardsManager({ cards, categories, onChange }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [importPreview, setImportPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState(null)

  function startEdit(card) {
    setForm({
      id: card.id,
      title: card.title || '',
      subtitle: card.subtitle || '',
      category_id: card.category_id || '',
      image_url: card.image_url || '',
      content: card.content || '',
      skills: (card.skills || []).join(', '),
      external_url: card.external_url || '',
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      content: form.content || null,
      external_url: form.external_url || null,
      skills: form.skills
        ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    }

    const result = form.id
      ? await supabase.from('cards').update(payload).eq('id', form.id)
      : await supabase.from('cards').insert({
          ...payload,
          position_x: DEFAULT_CARD_POSITION.x,
          position_y: DEFAULT_CARD_POSITION.y,
        })

    if (result.error) {
      setError(result.error.message)
      return
    }
    setForm(emptyForm)
    onChange()
  }

  async function removeCard(id) {
    if (!confirm('Apagar este card? As conexões ligadas a ele também serão removidas.')) return
    await supabase.from('cards').delete().eq('id', id)
    onChange()
  }

  async function handleLinkedInFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setImportSummary(null)
    try {
      const records = file.name.toLowerCase().endsWith('.pdf')
        ? await parseLinkedInPdf(file)
        : await parseLinkedInExport(file)
      const uniqueRecords = [...new Map(records.map((record) => [normalizeTitle(record.title), record])).values()]
      setImportPreview(uniqueRecords)
    } catch (importError) {
      setImportPreview([])
      setError(importError.message)
    }
  }

  async function importLinkedInCards() {
    setImporting(true)
    setError(null)
    const categoryByName = {}
    categories.forEach((category) => {
      categoryByName[category.name.trim().toLowerCase()] = category.id
    })

    const imported = { created: 0, updated: 0, skipped: 0 }
    const usedPositions = cards.length

    for (const [index, card] of importPreview.entries()) {
      const categoryId = categoryByName[card.categoryName.trim().toLowerCase()] || null
      const existing = cards.find((currentCard) => normalizeTitle(currentCard.title) === normalizeTitle(card.title))
      const payload = { title: card.title }
      if (card.subtitle) payload.subtitle = card.subtitle
      if (card.content) payload.content = card.content
      if (card.external_url) payload.external_url = card.external_url
      if (categoryId) payload.category_id = categoryId

      if (existing) {
        const hasChanges = Object.keys(payload).some(
          (field) => (existing[field] || '') !== (payload[field] || '')
        ) || (categoryId && existing.category_id !== categoryId)
        if (!hasChanges) {
          imported.skipped += 1
          continue
        }
        const result = await supabase.from('cards').update(payload).eq('id', existing.id)
        if (result.error) {
          setError(result.error.message)
          setImporting(false)
          return
        }
        imported.updated += 1
        continue
      }

      const result = await supabase.from('cards').insert({
        ...payload,
        skills: [],
        category_id: categoryId,
        position_x: 1400 + ((usedPositions + index) % 4) * 260,
        position_y: 890 + Math.floor((usedPositions + index) / 4) * 280,
      })
      if (result.error) {
        setError(result.error.message)
        setImporting(false)
        return
      }
      imported.created += 1
    }

    setImporting(false)
    setImportPreview([])
    setImportSummary(imported)
    onChange()
  }

  return (
    <div className="admin-section">
      <h2>Cards</h2>
      <div className="linkedin-import">
        <h3>Importar do LinkedIn</h3>
        <p className="admin-hint">
          Selecione o CSV/ZIP exportado em &quot;Baixar seus dados&quot; ou o PDF do perfil. CSV/ZIP têm melhor precisão;
          sempre revise a prévia antes de confirmar.
        </p>
        <input type="file" accept=".csv,.zip,.pdf,text/csv,application/zip,application/pdf" onChange={handleLinkedInFile} />
        {importSummary && (
          <p className="linkedin-import-summary">
            {importSummary.created} criado(s), {importSummary.updated} atualizado(s), {importSummary.skipped}{' '}
            sem alteração.
          </p>
        )}
        {importPreview.length > 0 && (
          <div className="linkedin-preview">
            <p>{importPreview.length} card(s) encontrado(s).</p>
            <ul className="admin-list">
              {importPreview.slice(0, 8).map((card, index) => (
                <li key={`${card.title}-${index}`}>
                  {card.title} <span className="admin-hint">{card.categoryName}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={importLinkedInCards} disabled={importing}>
              {importing ? 'Importando…' : 'Confirmar importação'}
            </button>
            <button type="button" className="link-button" onClick={() => setImportPreview([])} disabled={importing}>
              cancelar
            </button>
          </div>
        )}
      </div>
      <ul className="admin-list">
        {cards.map((card) => (
          <li key={card.id}>
            {card.title}
            <button className="link-button" onClick={() => startEdit(card)}>
              editar
            </button>
            <button className="link-button" onClick={() => removeCard(card.id)}>
              apagar
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="stacked-form">
        <h3>{form.id ? 'Editar card' : 'Novo card'}</h3>
        <label>
          Título
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <label>
          Subtítulo
          <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
        </label>
        <label>
          Categoria
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">Sem categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          URL da imagem
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        </label>
        <label>
          Conteúdo / descrição
          <textarea
            rows={5}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </label>
        <label>
          Habilidades (separadas por vírgula)
          <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
        </label>
        <label>
          Link externo (opcional)
          <input value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="submit">{form.id ? 'Salvar alterações' : 'Criar card'}</button>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm)}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
