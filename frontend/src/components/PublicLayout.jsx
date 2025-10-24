import { Link } from 'react-router-dom';
import { Database, Home, LogIn } from 'lucide-react';
import './PublicLayout.css';

const PublicLayout = ({ children }) => {
  return (
    <div className="public-layout">
      <header className="public-header">
        <div className="header-content">
          <Link to="/home" className="logo">
            <Database size={32} />
            <span>Sistema CNPJ</span>
          </Link>
          <nav className="public-nav">
            <Link to="/home" className="nav-link">
              <Home size={18} />
              Início
            </Link>
            <Link to="/pricing" className="nav-link">
              Preços
            </Link>
            <Link to="/login" className="nav-link nav-login">
              <LogIn size={18} />
              Entrar
            </Link>
          </nav>
        </div>
      </header>
      <main className="public-main">
        {children}
      </main>
      <footer className="public-footer">
        <p>&copy; 2025 Sistema CNPJ. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default PublicLayout;
