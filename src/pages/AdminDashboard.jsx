import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import CategoriesManager from './admin/CategoriesManager.jsx'
import CardsManager from './admin/CardsManager.jsx'
import ConnectionsManager from './admin/ConnectionsManager.jsx'
import LayoutEditor from './admin/LayoutEditor.jsx'
import { downloadFallbackBackup } from '../lib/exportFallback.js'

const TABS = ['Layout', 'Cards', 'Categorias', 'Conexões']

export default function AdminDashboard() {
  const [tab, setTab] = useState('Layout')
  const [cards, setCards] = useState([])
  const [categories, setCategories] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState(null)

  const load = useCallback(async () => {
    const [cardsRes, categoriesRes, connectionsRes] = await Promise.all([
      supabase.from('cards').select('*').order('created_at'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('connections').select('*'),
    ])
    setCards(cardsRes.data || [])
    setCategories(categoriesRes.data || [])
    setConnections(connectionsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function exportFallback() {
    setExporting(true)
    setExportMessage(null)
    try {
      const result = await downloadFallbackBackup({ cards, categories, connections })
      setExportMessage(
        result.failedImages
          ? `Backup baixado. ${result.failedImages} imagem(ns) nao puderam ser incorporadas.`
          : 'Backup baixado com dados e imagens.',
      )
    } catch (exportError) {
      setExportMessage(`Falha ao exportar: ${exportError.message}`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="page-loading">Carregando painel…</div>

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin</h1>
        <div className="admin-header-actions">
          <button type="button" onClick={exportFallback} disabled={exporting}>
            {exporting ? 'Preparando backup…' : 'Exportar fallback'}
          </button>
          <button className="link-button" onClick={() => supabase.auth.signOut()}>
            Sair
          </button>
        </div>
      </div>
      {exportMessage && <p className="admin-export-message">{exportMessage}</p>}
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Layout' && (
        <LayoutEditor cards={cards} categories={categories} connections={connections} onChange={load} />
      )}
      {tab === 'Cards' && <CardsManager cards={cards} categories={categories} onChange={load} />}
      {tab === 'Categorias' && <CategoriesManager categories={categories} onChange={load} />}
      {tab === 'Conexões' && <ConnectionsManager cards={cards} connections={connections} onChange={load} />}
    </div>
  )
}
