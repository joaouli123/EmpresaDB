import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [initialProfile, setInitialProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data);
      setInitialProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(user);
      setInitialProfile(user);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    const payload = {
      email: (profile?.email || '').trim(),
      phone: profile?.phone || '',
      cpf: profile?.cpf || '',
    };
    if (!payload.email) {
      setMessage({ type: 'error', text: 'Informe um e-mail válido para salvar.' });
      setSaving(false);
      return;
    }
    try {
      await userAPI.updateProfile(payload);
      setProfile((prev) => ({ ...prev, ...payload }));
      setInitialProfile((prev) => ({ ...prev, ...payload }));
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso.' });
    } catch (error) {
      const backendMessage = error?.response?.data?.detail;
      setMessage({ type: 'error', text: backendMessage || 'Erro ao atualizar perfil.' });
    } finally {
      setSaving(false);
    }
  };

  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  };

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'phone') value = formatPhone(value);
    else if (e.target.name === 'cpf') value = formatCPF(value);
    setProfile({ ...profile, [e.target.name]: value });
  };

  const hasChanges = Boolean(
    profile && initialProfile && (
      (profile.email || '') !== (initialProfile.email || '') ||
      (profile.phone || '') !== (initialProfile.phone || '') ||
      (profile.cpf || '') !== (initialProfile.cpf || '')
    )
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando perfil...</p>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <h1>Meu perfil</h1>
          <p>Gerencie suas informações pessoais e da conta</p>
        </div>
      </div>

      <div className="pgrid-sidebar">
        <div className="pcard">
          <div className="pcard-body">
            <div className="pident">
              <div className="pident-avatar">{(profile?.username || 'U').charAt(0).toUpperCase()}</div>
              <div>
                <h2>{profile?.username}</h2>
                <span className={`pbadge ${isAdmin ? 'blue' : 'gray'}`}>{isAdmin ? 'Administrador' : 'Usuário'}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="pcard-body" style={{ borderTop: '1px solid var(--border)' }}>
              {message.text && <div className={`pmsg ${message.type}`}>{message.text}</div>}
              <div className="field-grid">
                <div className="field">
                  <label>Nome de usuário</label>
                  <input type="text" name="username" value={profile?.username || ''} disabled />
                  <span className="hint">Não pode ser alterado</span>
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" name="email" value={profile?.email || ''} onChange={handleChange} />
                  <span className="hint">Usado para notificações</span>
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <input type="tel" name="phone" value={profile?.phone || ''} onChange={handleChange} placeholder="(00) 00000-0000" />
                </div>
                <div className="field">
                  <label>CPF</label>
                  <input type="text" name="cpf" value={profile?.cpf || ''} onChange={handleChange} placeholder="000.000.000-00" />
                </div>
                <div className="field">
                  <label>Tipo de conta</label>
                  <input type="text" value={isAdmin ? 'Administrador' : 'Usuário'} disabled />
                </div>
                <div className="field">
                  <label>Membro desde</label>
                  <input type="text" value={new Date(profile?.created_at || Date.now()).toLocaleDateString('pt-BR')} disabled />
                </div>
              </div>
            </div>
            <div className="pcard-foot">
              <button type="submit" className="btn-flat primary" disabled={saving || !hasChanges}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        </div>

        <div className="pcard">
          <div className="pcard-head"><h2>Estatísticas de uso</h2></div>
          <div className="pcard-body">
            <div className="dlist">
              <div className="dlist-row">
                <span className="k">Total de requisições</span>
                <span className="v">{(profile?.total_requests || 0).toLocaleString('pt-BR')}</span>
              </div>
              <div className="dlist-row">
                <span className="k">API keys ativas</span>
                <span className="v">{profile?.active_api_keys || 0}</span>
              </div>
              <div className="dlist-row">
                <span className="k">Última atividade</span>
                <span className="v">{profile?.last_activity || 'Hoje'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
