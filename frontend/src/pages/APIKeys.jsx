import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { Key, Plus, Trash2, Copy, CheckCircle2, Calendar, Eye, EyeOff } from 'lucide-react';

const APIKeys = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [visibleKeys, setVisibleKeys] = useState({});

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const response = await userAPI.getAPIKeys();
      const keys = Array.isArray(response.data) ? response.data : [];
      setApiKeys(keys);
    } catch (error) {
      console.error('Error loading API keys:', error);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (creating) return; // Previne múltiplos cliques

    setCreating(true);
    setMessage({ type: '', text: '' });

    try {
      await userAPI.createAPIKey({ name: newKeyName });
      setNewKeyName('');
      setShowCreateForm(false);
      setMessage({ type: 'success', text: 'Chave de API criada com sucesso!' });
      await loadAPIKeys();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error creating API key:', error);
      setMessage({ type: 'error', text: 'Erro ao criar chave de API. Tente novamente.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta chave de API?')) {
      return;
    }

    setDeleting(id);
    try {
      await userAPI.deleteAPIKey(id);
      setMessage({ type: 'success', text: 'Chave de API excluída com sucesso!' });
      await loadAPIKeys();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting API key:', error);
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

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const maskKey = (key) => {
    return '•'.repeat(key.length);
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando chaves de API...</p>
      </div>
    );
  }

  return (
    <div className="api-keys-page">
      <div className="page-header">
        <div>
          <h1>Chaves de API</h1>
          <p>Gerencie suas chaves de acesso à API</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateForm(true)}
          disabled={creating}
        >
          <Plus size={20} />
          Nova Chave
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Criar Nova Chave de API</h2>
            <form onSubmit={handleCreateKey}>
              <div className="form-group">
                <label>Nome da Chave</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Ex: Minha Aplicação Web"
                  required
                />
                <small>Escolha um nome descritivo para identificar esta chave</small>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Chave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="api-keys-container">
        {!Array.isArray(apiKeys) || apiKeys.length === 0 ? (
          <div className="empty-state">
            <Key size={48} />
            <h3>Nenhuma chave de API criada</h3>
            <p>Crie sua primeira chave para começar a usar a API</p>
            <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
              <Plus size={20} />
              Criar Primeira Chave
            </button>
          </div>
        ) : (
          <div className="api-keys-grid">
            {apiKeys.map((key) => (
              <div key={key.id} className="api-key-card-compact">
                <div className="api-key-header-compact">
                  <div className="api-key-icon-compact">
                    <Key size={20} />
                  </div>
                  <div className="api-key-info-compact">
                    <h3>{key.name}</h3>
                    <span className="api-key-date">
                      <Calendar size={12} />
                      {new Date(key.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    className="btn-icon-danger-sm"
                    title="Excluir chave"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="api-key-value-compact">
                  <code>{visibleKeys[key.id] ? key.key : maskKey(key.key)}</code>
                  <div className="api-key-actions">
                    <button
                      onClick={() => toggleKeyVisibility(key.id)}
                      className="btn-icon-sm"
                      title={visibleKeys[key.id] ? "Ocultar chave" : "Mostrar chave"}
                    >
                      {visibleKeys[key.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleCopyKey(key.key)}
                      className="btn-icon-sm"
                      title="Copiar chave"
                    >
                      {copiedKey === key.key ? (
                        <CheckCircle2 size={16} className="success" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="api-key-stats-compact">
                  <div className="stat-compact">
                    <span className="stat-label-compact">Requisições</span>
                    <span className="stat-value-compact">{(key.total_requests || 0).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="stat-compact">
                    <span className="stat-label-compact">Última Utilização</span>
                    <span className="stat-value-compact">
                      {key.last_used_at
                        ? new Date(key.last_used_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Nunca'}
                    </span>
                  </div>
                  <div className="stat-compact">
                    <span className={`status-badge-compact ${key.is_active ? 'active' : 'inactive'}`}>
                      {key.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-card">
        <h3>📚 Precisa de ajuda?</h3>
        <p>Acesse a <a href="/docs" style={{ color: '#3b82f6', fontWeight: 'bold' }}>Documentação Completa</a> para ver exemplos de código, endpoints disponíveis e guias de integração.</p>
      </div>
    </div>
  );
};

export default APIKeys;