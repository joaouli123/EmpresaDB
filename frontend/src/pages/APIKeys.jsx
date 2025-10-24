import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { Key, Plus, Trash2, Copy, CheckCircle2, Calendar } from 'lucide-react';

const APIKeys = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const response = await userAPI.getAPIKeys();
      setApiKeys(response.data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      await userAPI.createAPIKey({ name: newKeyName });
      setNewKeyName('');
      setShowCreateForm(false);
      await loadAPIKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Erro ao criar chave de API');
    }
  };

  const handleDeleteKey = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta chave de API?')) {
      return;
    }

    try {
      await userAPI.deleteAPIKey(id);
      await loadAPIKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Erro ao excluir chave de API');
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
        >
          <Plus size={20} />
          Nova Chave
        </button>
      </div>

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
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar Chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="api-keys-container">
        {apiKeys.length === 0 ? (
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
          <div className="keys-list">
            {apiKeys.map((key) => (
              <div key={key.id} className="key-card">
                <div className="key-header">
                  <div className="key-icon">
                    <Key size={24} />
                  </div>
                  <div className="key-info">
                    <h3>{key.name}</h3>
                    <div className="key-meta">
                      <Calendar size={14} />
                      <span>Criada em {new Date(key.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <button 
                    className="btn-icon-danger"
                    onClick={() => handleDeleteKey(key.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="key-value">
                  <code>{key.key}</code>
                  <button 
                    className="btn-icon"
                    onClick={() => handleCopyKey(key.key)}
                  >
                    {copiedKey === key.key ? (
                      <CheckCircle2 size={18} className="success" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                </div>
                <div className="key-stats">
                  <div className="key-stat">
                    <p className="label">Total de Requisições</p>
                    <p className="value">{(key.total_requests || 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="key-stat">
                    <p className="label">Última Utilização</p>
                    <p className="value">{key.last_used || 'Nunca'}</p>
                  </div>
                  <div className="key-stat">
                    <p className="label">Status</p>
                    <p className="value status-active">Ativa</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="info-card">
        <h3>Como usar sua chave de API</h3>
        <p>Inclua sua chave de API no cabeçalho de todas as requisições:</p>
        <pre><code>Authorization: Bearer SUA_CHAVE_AQUI</code></pre>
        <p>Exemplo com curl:</p>
        <pre><code>curl -H "Authorization: Bearer SUA_CHAVE" https://api.exemplo.com/cnpj/00000000000191</code></pre>
      </div>
    </div>
  );
};

export default APIKeys;
