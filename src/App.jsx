import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import ShipLog from './pages/ShipLog.jsx'
import CardDetail from './pages/CardDetail.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Contact from './pages/Contact.jsx'
import About from './pages/About.jsx'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="page-loading">Carregando…</div>
  if (!session) return <AdminLogin />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<ShipLog />} />
        <Route path="/card/:id" element={<CardDetail />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/contato" element={<Contact />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  )
}
