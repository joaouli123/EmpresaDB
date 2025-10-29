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
        const response = await subscriptionAPI.getMySubscription();
        setSubscription(response.data);
      } catch (error) {
        console.error('Erro ao buscar assinatura:', error);
      }
    };
    
    if (user) {
      fetchSubscription();
      
      // Atualizar em tempo real a cada 10 segundos
      const interval = setInterval(fetchSubscription, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Valores padrão se subscription ainda não carregou
  const queries_used = subscription?.queries_used || 0;
  const total_limit = subscription?.total_limit || 200;
  const plan_name = subscription?.plan_name || 'Free';
  
  const percentageUsed = Math.min((queries_used / total_limit) * 100, 100);
  const isExhausted = queries_used >= total_limit;

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
          {!collapsed && <h1>DB Empresas</h1>}
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="user-details">
                <p className="user-name">{user?.company_name || user?.username}</p>
                <span className={`user-role ${subscription?.plan_name?.toLowerCase() || 'free'}`} style={{
                  background: subscription?.plan_name === 'Free' ? '#3b82f6' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}>
                  {subscription?.plan_name || 'Plano free'}
                </span>
              </div>
              {subscription && (
                <div className="user-subscription">
                  <div className="plan-info">
                    <span className="plan-usage" style={{ 
                      fontSize: '11px',
                      color: '#9ca3af',
                      display: 'block',
                      marginTop: '8px'
                    }}>
                      {subscription.queries_used?.toLocaleString('pt-BR') || 0}/{subscription.total_limit?.toLocaleString('pt-BR') || 0} consultas
                    </span>
                  </div>
                  <div className="usage-bar" style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '6px'
                  }}>
                    <div 
                      className="usage-fill" 
                      style={{ 
                        width: `${100 - percentageUsed}%`,
                        height: '100%',
                        backgroundColor: '#e0f2fe',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                        marginLeft: 'auto'
                      }}
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