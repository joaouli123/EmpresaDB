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
  Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();

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

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Database size={32} className="logo-icon" />
          <h1>CNPJ System</h1>
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <p className="user-name">{user?.username}</p>
            <span className={`user-role ${user?.role}`}>
              {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
            </span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">Menu Principal</h3>
          {userMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {isAdmin() && (
          <div className="nav-section">
            <h3 className="nav-section-title">Administração</h3>
            {adminMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        <div className="nav-section">
          <button onClick={logout} className="nav-item logout-btn">
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;