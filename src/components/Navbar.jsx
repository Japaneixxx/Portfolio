import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        Japa
      </Link>
      <nav className="navbar-links">
        <Link to="/contato">Contato</Link>
        <Link to="/">Projetos</Link>
        <Link to="/sobre">Sobre mim</Link>
        <Link to="/admin">Admin</Link>
      </nav>
    </header>
  )
}
