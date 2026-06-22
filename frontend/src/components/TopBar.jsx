import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionAPI } from '../services/api';
import { ChevronDown, User as UserIcon, LogOut, CreditCard, Zap } from 'lucide-react';
import './TopBar.css';

const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchSub = async () => {
      try {
        const r = await subscriptionAPI.getMySubscription();
        if (active) setSub(r.data);
      } catch (e) {
        /* silencioso */
      }
    };
    if (user) {
      fetchSub();
      const i = setInterval(fetchSub, 60000);
      return () => { active = false; clearInterval(i); };
    }
  }, [user]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const plan = sub?.plan_name || 'Free';
  const used = sub?.queries_used ?? 0;
  const total = sub?.total_limit ?? 200;
  const remaining = Math.max(total - used, 0);
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const initial = (user?.username || 'U').charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-right">
        <div className="topbar-usage" title={`${used.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} consultas usadas este mês`}>
          <Zap size={15} />
          <div className="topbar-usage-text">
            <span className="topbar-usage-count">{remaining.toLocaleString('pt-BR')}</span>
            <span className="topbar-usage-label">consultas restantes</span>
          </div>
          <div className="topbar-usage-bar"><div style={{ width: `${pct}%` }} /></div>
        </div>

        <span className="topbar-plan">{plan}</span>

        <div className="topbar-user" ref={ref}>
          <button className="topbar-avatar-btn" onClick={() => setMenuOpen((o) => !o)}>
            <span className="topbar-avatar">{initial}</span>
            <span className="topbar-username">{user?.username}</span>
            <ChevronDown size={15} />
          </button>
          {menuOpen && (
            <div className="topbar-menu">
              <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                <UserIcon size={15} /> Perfil
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/subscription'); }}>
                <CreditCard size={15} /> Minha Assinatura
              </button>
              <button className="danger" onClick={() => { logout(); navigate('/login'); }}>
                <LogOut size={15} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
