import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Calendar, Save } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(user);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await userAPI.updateProfile(profile);
      setMessage('Perfil atualizado com sucesso!');
    } catch (error) {
      setMessage('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Meu Perfil</h1>
        <p>Gerencie suas informações pessoais</p>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2>{profile?.username}</h2>
              <span className={`role-badge ${profile?.role}`}>
                {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="profile-form">
            {message && (
              <div className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <div className="form-group">
              <label>
                <User size={18} />
                Nome de Usuário
              </label>
              <input
                type="text"
                name="username"
                value={profile?.username || ''}
                onChange={handleChange}
                disabled
              />
              <small>O nome de usuário não pode ser alterado</small>
            </div>

            <div className="form-group">
              <label>
                <Mail size={18} />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile?.email || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>
                <Shield size={18} />
                Tipo de Conta
              </label>
              <input
                type="text"
                value={profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
                disabled
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={18} />
                Membro desde
              </label>
              <input
                type="text"
                value={new Date(profile?.created_at || Date.now()).toLocaleDateString('pt-BR')}
                disabled
              />
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={20} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        <div className="profile-stats">
          <h3>Estatísticas de Uso</h3>
          <div className="stats-list">
            <div className="stat-item">
              <p className="stat-label">Total de Requisições</p>
              <p className="stat-value">{(profile?.total_requests || 0).toLocaleString('pt-BR')}</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">API Keys Ativas</p>
              <p className="stat-value">{profile?.active_api_keys || 0}</p>
            </div>
            <div className="stat-item">
              <p className="stat-label">Última Atividade</p>
              <p className="stat-value">{profile?.last_activity || 'Hoje'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
