import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import CategoriesManager from './admin/CategoriesManager.jsx'
import CardsManager from './admin/CardsManager.jsx'
import ConnectionsManager from './admin/ConnectionsManager.jsx'
import LayoutEditor from './admin/LayoutEditor.jsx'

const TABS = ['Layout', 'Cards', 'Categorias', 'Conexões']

export default function AdminDashboard() {
  const [tab, setTab] = useState('Layout')
  const [cards, setCards] = useState([])
  const [categories, setCategories] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="page-loading">Carregando painel…</div>

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin</h1>
        <button className="link-button" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </div>
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
