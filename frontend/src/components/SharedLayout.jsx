
import { Link } from 'react-router-dom';
import { Database, Menu, X, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import './SharedLayout.css';

const SharedLayout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="shared-layout">
      {/* Header */}
      <nav className="floating-navbar">
        <div className="navbar-content">
          <div className="navbar-logo">
            <Database size={28} />
            <span>DB Empresas</span>
          </div>

          <div className="navbar-links">
            <Link to="/">Início</Link>
            <Link to="/sobre">Sobre</Link>
            <Link to="/servicos">Serviços</Link>
            <Link to="/api">API</Link>
            <Link to="/casos-de-uso">Casos de Uso</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contato">Contato</Link>
          </div>

          <div className="navbar-actions">
            <Link to="/login">
              <button className="btn-navbar-secondary">Entrar</button>
            </Link>
            <Link to="/#pricing">
              <button className="btn-navbar-primary">Começar Grátis</button>
            </Link>
          </div>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-links">
            <Link to="/" onClick={() => setMenuOpen(false)}>Início</Link>
            <Link to="/sobre" onClick={() => setMenuOpen(false)}>Sobre</Link>
            <Link to="/servicos" onClick={() => setMenuOpen(false)}>Serviços</Link>
            <Link to="/api" onClick={() => setMenuOpen(false)}>API</Link>
            <Link to="/casos-de-uso" onClick={() => setMenuOpen(false)}>Casos de Uso</Link>
            <Link to="/blog" onClick={() => setMenuOpen(false)}>Blog</Link>
            <Link to="/contato" onClick={() => setMenuOpen(false)}>Contato</Link>
          </div>

          <div className="mobile-menu-actions">
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <button className="btn-navbar-secondary">Entrar</button>
            </Link>
            <Link to="/#pricing" onClick={() => setMenuOpen(false)}>
              <button className="btn-navbar-primary">Começar Grátis</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Conteúdo da página */}
      <main className="page-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <Database size={32} />
              <h3>DB Empresas</h3>
            </div>
            <p>Acesso completo aos dados empresariais da Receita Federal. Consultas rápidas, precisas e atualizadas.</p>
            <p style={{ marginTop: '16px', fontSize: '14px' }}>
              <strong>CNPJ:</strong> 47.394.596/0001-15
            </p>
          </div>

          <div className="footer-section">
            <h4>Produto</h4>
            <ul>
              <li><Link to="/servicos">Serviços</Link></li>
              <li><Link to="/#pricing">Planos e Preços</Link></li>
              <li><Link to="/api">Documentação API</Link></li>
              <li><Link to="/casos-de-uso">Casos de Uso</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Empresa</h4>
            <ul>
              <li><Link to="/sobre">Sobre Nós</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/privacidade">Política de Privacidade</Link></li>
              <li><Link to="/termos">Termos de Uso</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Suporte</h4>
            <ul>
              <li><Link to="/contato">Fale Conosco</Link></li>
              <li><Link to="/#faq">FAQ</Link></li>
              <li><a href="https://wa.me/5541987857413" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contato</h4>
            <ul>
              <li>
                <Phone size={16} style={{ display: 'inline', marginRight: '8px' }} />
                <a href="tel:+5541987857413">(41) 98785-7413</a>
              </li>
              <li>
                <Mail size={16} style={{ display: 'inline', marginRight: '8px' }} />
                <a href="mailto:contato@dbempresas.com.br">contato@dbempresas.com.br</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 DB Empresas - CNPJ: 47.394.596/0001-15. Todos os direitos reservados.</p>
          <p>Dados oficiais da Receita Federal do Brasil</p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/5541987857413?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20DB%20Empresas" 
        className="whatsapp-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contato via WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
};

export default SharedLayout;
