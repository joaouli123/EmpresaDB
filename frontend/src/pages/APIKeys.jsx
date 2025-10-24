import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { Key, Plus, Trash2, Copy, CheckCircle2, Calendar } from 'lucide-react';

const APIKeys = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

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
                    disabled={deleting === key.id}
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
        <h3>🔌 Como integrar com seu sistema externo</h3>
        
        <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #f59e0b' }}>
          <h4 style={{ color: '#92400e', marginBottom: '8px' }}>📍 URLs de Conexão:</h4>
          <p style={{ color: '#92400e', fontSize: '14px', margin: '4px 0' }}>
            <strong>Frontend:</strong> <code>{window.location.origin}</code>
          </p>
          <p style={{ color: '#92400e', fontSize: '14px', margin: '4px 0' }}>
            <strong>API Backend:</strong> <code>{window.location.protocol}//{window.location.hostname}:8000</code>
          </p>
        </div>

        <h4>Autenticação:</h4>
        <p>Inclua sua chave de API no cabeçalho <code>X-API-Key</code> de todas as requisições:</p>
        <pre><code>X-API-Key: SUA_CHAVE_AQUI</code></pre>
        
        <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Exemplo com cURL:</h4>
        <pre><code>curl -H "X-API-Key: SUA_CHAVE" {window.location.protocol}//{window.location.hostname}:8000/cnpj/00000000000191</code></pre>
        
        <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Exemplo com Python (para integração externa):</h4>
        <pre style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}><code>{`import requests

# Configure a URL da API (use porta 8000 para backend direto)
API_URL = '${window.location.protocol}//${window.location.hostname}:8000'

headers = {'X-API-Key': 'SUA_CHAVE_API_AQUI'}

# Buscar empresas em SP
response = requests.get(
    f'{API_URL}/search?uf=SP&situacao_cadastral=02&page=1',
    headers=headers
)

if response.status_code == 200:
    data = response.json()
    print(f"Total encontrado: {data['total']}")
    for empresa in data['items']:
        print(f"{empresa['razao_social']} - {empresa['cnpj_completo']}")
else:
    print(f"Erro: {response.status_code} - {response.text}")`}</code></pre>
        
        <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Exemplo com JavaScript/Node.js:</h4>
        <pre style={{ background: '#1e293b', padding: '12px', borderRadius: '6px' }}><code>{`// Configure a URL da API
const API_URL = '${window.location.protocol}//${window.location.hostname}:8000';

const response = await fetch(
  \`\${API_URL}/cnpj/00000000000191\`,
  {
    headers: {
      'X-API-Key': 'SUA_CHAVE_API_AQUI'
    }
  }
);

if (response.ok) {
  const data = await response.json();
  console.log(data);
} else {
  console.error('Erro:', response.status, await response.text());
}`}</code></pre>

        <div style={{ marginTop: '20px', padding: '12px', background: '#dbeafe', borderRadius: '8px', border: '2px solid #3b82f6' }}>
          <h4 style={{ color: '#1e40af', marginBottom: '8px' }}>💡 Dica para Integração:</h4>
          <p style={{ color: '#1e40af', fontSize: '14px' }}>
            Para conectar seu sistema externo ao Replit, use sempre a <strong>porta 8000</strong> que aponta para o backend da API.<br/>
            URL completa: <code>{window.location.protocol}//{window.location.hostname}:8000</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default APIKeys;
