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
    const fetchSubscription = async () => {
      try {
        const data = await subscriptionAPI.getMySubscription();
        setSubscription(data);
      } catch (error) {
        console.error('Erro ao buscar assinatura:', error);
      }
    };
    
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const percentageUsed = subscription 
    ? Math.min((subscription.queries_used / subscription.total_limit) * 100, 100)
    : 0;

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button 
        className="sidebar-toggle" 
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <div className="sidebar-header">
        <div className="logo">
          <Database size={32} className="logo-icon" />
          {!collapsed && <h1>CNPJ System</h1>}
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="user-details">
                <p className="user-name">{user?.username}</p>
                <span className={`user-role ${user?.role}`}>
                  {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                </span>
              </div>
              {subscription && (
                <div className="user-subscription">
                  <div className="plan-info">
                    <span className="plan-name">{subscription.plan_name}</span>
                    <span className="plan-usage">
                      {subscription.queries_used} / {subscription.total_limit} consultas
                    </span>
                  </div>
                  <div className="usage-bar">
                    <div 
                      className="usage-fill" 
                      style={{ width: `${percentageUsed}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <h3 className="nav-section-title">Menu Principal</h3>}
          {userMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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
            onClick={logout} 
            className="nav-item logout-btn"
            title={collapsed ? 'Sair' : ''}
          >
            <LogOut size={20} />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;