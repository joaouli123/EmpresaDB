import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { Key, Plus, Trash2, Copy, Check } from 'lucide-react';

const APIKeys = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadError, setLoadError] = useState('');

  useEffect(() => { loadAPIKeys(); }, []);

  const loadAPIKeys = async () => {
    try {
      setLoadError('');
      const response = await userAPI.getAPIKeys();
      setApiKeys(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      setLoadError(error?.response?.data?.detail || 'Não foi possível carregar suas chaves no momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (creating) return;
    const trimmedName = (newKeyName || '').trim();
    if (!trimmedName) {
      setMessage({ type: 'error', text: 'Informe um nome válido para a chave.' });
      return;
    }
    setCreating(true);
    setMessage({ type: '', text: '' });
    try {
      await userAPI.createAPIKey({ name: trimmedName });
      setNewKeyName('');
      setShowCreateForm(false);
      setMessage({ type: 'success', text: 'Chave de API criada com sucesso.' });
      await loadAPIKeys();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error?.response?.data?.detail || 'Erro ao criar chave. Tente novamente.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta chave de API?')) return;
    setDeleting(id);
    try {
      await userAPI.deleteAPIKey(id);
      setMessage({ type: 'success', text: 'Chave de API excluída com sucesso.' });
      await loadAPIKeys();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao excluir chave de API.' });
    } finally {
      setDeleting(null);
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando chaves de API...</p>
      </div>
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <h1>Chaves de API</h1>
          <p>Gerencie suas chaves de acesso à API</p>
        </div>
        <button className="btn-flat primary" onClick={() => setShowCreateForm(true)} disabled={creating}>
          <Plus size={16} /> Nova chave
        </button>
      </div>

      {message.text && <div className={`pmsg ${message.type}`}>{message.text}</div>}
      {loadError && <div className="pmsg error">{loadError}</div>}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 16px' }}>Criar nova chave</h2>
            <form onSubmit={handleCreateKey}>
              <div className="field">
                <label>Nome da chave</label>
                <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Ex: Minha aplicação web" required />
                <span className="hint">Um nome descritivo para identificar esta chave</span>
              </div>
              <div className="modal-actions" style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-flat ghost" onClick={() => setShowCreateForm(false)} disabled={creating}>Cancelar</button>
                <button type="submit" className="btn-flat primary" disabled={creating}>{creating ? 'Criando...' : 'Criar chave'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {apiKeys.length === 0 ? (
        <div className="pcard">
          <div className="pempty">
            <div className="key-icon-sq" style={{ width: '48px', height: '48px' }}><Key size={22} /></div>
            <h3>Nenhuma chave criada</h3>
            <p>Crie sua primeira chave para começar a usar a API.</p>
            <button className="btn-flat primary" onClick={() => setShowCreateForm(true)}><Plus size={16} /> Criar chave</button>
          </div>
        </div>
      ) : (
        apiKeys.map((key) => (
          <div className="pcard" key={key.id}>
            <div className="pcard-head">
              <div className="pcard-head-id">
                <div className="key-icon-sq"><Key size={18} /></div>
                <div>
                  <h2>{key.name}</h2>
                  <p className="sub">Criada em {new Date(key.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <button className="btn-icon del" onClick={() => handleDeleteKey(key.id)} disabled={deleting === key.id} aria-label="Excluir chave">
                <Trash2 size={17} />
              </button>
            </div>
            <div className="pcard-body">
              <div className="keycode">
                <code>{key.key}</code>
                <button className="btn-icon" onClick={() => handleCopyKey(key.key)} aria-label="Copiar chave">
                  {copiedKey === key.key ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="keystats">
                <div>
                  <span className="k">Total de requisições</span>
                  <span className="v">{(key.total_requests || 0).toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span className="k">Última utilização</span>
                  <span className="v">{key.last_used || 'Nunca'}</span>
                </div>
                <div>
                  <span className="k">Status</span>
                  <span className="pbadge green" style={{ width: 'fit-content' }}>Ativa</span>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      <div className="pcard">
        <div className="pcard-body">
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>Precisa de ajuda?</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Veja a <a href="/docs" className="plink">documentação completa</a> com exemplos de código, endpoints disponíveis e guias de integração.
          </p>
        </div>
      </div>
    </div>
  );
};

export default APIKeys;
