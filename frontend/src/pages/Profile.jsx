import { useState, useEffect, useRef } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Lock } from 'lucide-react';

const resizeImage = (file, size = 192) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [initialProfile, setInitialProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = useRef(null);

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

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

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Selecione um arquivo de imagem.' });
      return;
    }
    setAvatarBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const dataUri = await resizeImage(file, 192);
      const res = await userAPI.uploadAvatar(dataUri);
      const url = res.data.avatar_url;
      setProfile((p) => ({ ...p, avatar_url: url }));
      updateUser({ avatar_url: url });
      setMessage({ type: 'success', text: 'Foto de perfil atualizada.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.detail || 'Erro ao enviar a foto.' });
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true);
    setMessage({ type: '', text: '' });
    try {
      await userAPI.deleteAvatar();
      setProfile((p) => ({ ...p, avatar_url: null }));
      updateUser({ avatar_url: null });
      setMessage({ type: 'success', text: 'Foto removida.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao remover a foto.' });
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    if (!pwd.current) {
      setPwdMsg({ type: 'error', text: 'Informe a senha atual.' });
      return;
    }
    if (pwd.next.length < 6) {
      setPwdMsg({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdMsg({ type: 'error', text: 'A confirmação não confere com a nova senha.' });
      return;
    }
    setPwdSaving(true);
    try {
      await userAPI.changePassword({ current_password: pwd.current, new_password: pwd.next });
      setPwd({ current: '', next: '', confirm: '' });
      setPwdMsg({ type: 'success', text: 'Senha alterada com sucesso.' });
    } catch (err) {
      setPwdMsg({ type: 'error', text: err?.response?.data?.detail || 'Erro ao alterar a senha.' });
    } finally {
      setPwdSaving(false);
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
  const avatarSrc = profile?.avatar_url;

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <h1>Meu perfil</h1>
          <p>Gerencie suas informações pessoais e da conta</p>
        </div>
      </div>

      <div className="pgrid-sidebar">
        <div>
          <div className="pcard">
            <div className="pcard-body">
              <div className="pident">
                <div className="pident-avatar-wrap">
                  {avatarSrc ? (
                    <img className="pident-avatar-img" src={avatarSrc} alt={profile?.username || ''} />
                  ) : (
                    <div className="pident-avatar">{(profile?.username || 'U').charAt(0).toUpperCase()}</div>
                  )}
                  <button
                    type="button"
                    className="avatar-edit"
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarBusy}
                    title="Trocar foto"
                    aria-label="Trocar foto"
                  >
                    <Camera size={14} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
                </div>
                <div>
                  <h2>{profile?.username}</h2>
                  <span className={`pbadge ${isAdmin ? 'blue' : 'gray'}`}>{isAdmin ? 'Administrador' : 'Usuário'}</span>
                  {avatarSrc && (
                    <div>
                      <button type="button" className="plink-sm" onClick={handleRemoveAvatar} disabled={avatarBusy}>
                        Remover foto
                      </button>
                    </div>
                  )}
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
            <div className="pcard-head">
              <div className="pcard-head-id">
                <div className="key-icon-sq"><Lock size={17} /></div>
                <div>
                  <h2>Segurança</h2>
                  <p className="sub">Altere a senha de acesso à sua conta</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="pcard-body">
                {pwdMsg.text && <div className={`pmsg ${pwdMsg.type}`}>{pwdMsg.text}</div>}
                <div className="field-grid">
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label>Senha atual</label>
                    <input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} autoComplete="current-password" />
                  </div>
                  <div className="field">
                    <label>Nova senha</label>
                    <input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} autoComplete="new-password" />
                    <span className="hint">Mínimo de 6 caracteres</span>
                  </div>
                  <div className="field">
                    <label>Confirmar nova senha</label>
                    <input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} autoComplete="new-password" />
                  </div>
                </div>
              </div>
              <div className="pcard-foot">
                <button type="submit" className="btn-flat primary" disabled={pwdSaving}>
                  {pwdSaving ? 'Alterando...' : 'Alterar senha'}
                </button>
              </div>
            </form>
          </div>
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
