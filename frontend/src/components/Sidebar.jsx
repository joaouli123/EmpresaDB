import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Users,
  Key,
  FileText,
  RefreshCw,
  LogOut,
  Database,
  Activity,
  CreditCard,
  DollarSign,
  Mail,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const userMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Perfil' },
    { path: '/api-keys', icon: Key, label: 'API Keys' },
    { path: '/subscription', icon: CreditCard, label: 'Minha Assinatura' },
    { path: '/docs', icon: FileText, label: 'Documentação' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: Activity, label: 'Visão Geral' },
    { path: '/admin/users', icon: Users, label: 'Usuários' },
    { path: '/admin/plans', icon: CreditCard, label: 'Planos' },
    { path: '/admin/finance', icon: DollarSign, label: 'Financeiro' },
    { path: '/admin/etl', icon: RefreshCw, label: 'Atualização ETL' },
    { path: '/admin/database', icon: Database, label: 'Banco de Dados' },
    { path: '/admin/email-logs', icon: Mail, label: 'Logs de Email' },
  ];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileOpen]);

  const closeMobileMenu = () => {
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isMobile && mobileOpen && <div className="sidebar-backdrop" onClick={closeMobileMenu} />}
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {!isMobile && (
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}

        <div className="sidebar-header">
          <div className="logo">
            <Database size={28} className="logo-icon" />
            {!collapsed && <h1>DB Empresas</h1>}
          </div>
          {isMobile && (
            <button className="sidebar-close" onClick={closeMobileMenu} aria-label="Fechar menu">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!collapsed && <h3 className="nav-section-title">Menu Principal</h3>}
            {userMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={closeMobileMenu}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>

          {isAdmin() && (
            <div className="nav-section">
              {!collapsed && <h3 className="nav-section-title">Administração</h3>}
              {adminMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <item.icon size={20} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item logout-btn"
            onClick={handleLogout}
            title={collapsed ? 'Sair' : ''}
          >
            <LogOut size={20} />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
