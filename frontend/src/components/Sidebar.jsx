import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Key, 
  FileText, 
  RefreshCw, 
  LogOut,
  Database,
  Activity,
  CreditCard,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionAPI } from '../services/api';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const userMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Perfil' },
    { path: '/api-keys', icon: Key, label: 'API Keys' },
    { path: '/subscription', icon: CreditCard, label: 'Minha Assinatura' },
    { path: '/docs', icon: FileText, label: 'Documentação' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: Activity, label: 'Admin Dashboard' },
    { path: '/admin/etl', icon: RefreshCw, label: 'Atualização ETL' },
    { path: '/admin/database', icon: Database, label: 'Banco de Dados' },
    { path: '/admin/email-logs', icon: Mail, label: 'Logs de Email' },
  ];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await subscriptionAPI.getMySubscription();
        setSubscription(response.data);
      } catch (error) {
        console.error('Erro ao buscar assinatura:', error);
      }
    };
    
    if (user) {
      fetchSubscription();
      
      const interval = setInterval(fetchSubscription, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const currentPlan = subscription?.plan_name || 'Free';

  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
      return;
    }
    setCollapsed((prev) => !prev);
  };

  const closeMobileMenu = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {isMobile && mobileOpen && <div className="sidebar-backdrop" onClick={closeMobileMenu} />}
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <button 
        className="sidebar-toggle" 
        onClick={handleToggle}
        title={isMobile ? (mobileOpen ? 'Fechar menu' : 'Abrir menu') : (collapsed ? 'Expandir menu' : 'Recolher menu')}
      >
        {isMobile
          ? (mobileOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />)
          : (collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />)}
      </button>

      <div className="sidebar-header">
        <div className="logo">
          <Database size={32} className="logo-icon" />
          {!collapsed && <h1>DB Empresas</h1>}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <h3 className="nav-section-title">Menu Principal</h3>}
          {userMenuItems.map((item) => (
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

        <div className="nav-section">
          <button 
            onClick={() => {
              closeMobileMenu();
              logout();
            }}
            className="nav-item logout-btn"
            title={collapsed ? 'Sair' : ''}
          >
            <LogOut size={20} />
            {!collapsed && <span>Sair</span>}
          </button>

          <div className="sidebar-user-bottom" title={collapsed ? (user?.company_name || user?.username || 'Usuário') : ''}>
            <div className="user-avatar sidebar-user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="sidebar-user-details">
                <p className="sidebar-user-name">{user?.company_name || user?.username}</p>
                <p className="sidebar-user-plan">Plano atual: {currentPlan}</p>
              </div>
            )}
          </div>
        </div>
      </nav>
      </div>
    </>
  );
};

export default Sidebar;