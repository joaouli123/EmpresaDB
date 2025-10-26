import { useState, useEffect } from 'react';
import { cnpjAPI, userAPI, api } from '../services/api';
import {
  Database,
  Building2,
  Users,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnae: '',
    uf: '',
    municipio: '',
    situacao_cadastral: '',
    data_inicio_atividade_min: '',
    data_inicio_atividade_max: ''
  });
  const [results, setResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usageRes, subRes] = await Promise.all([
        cnpjAPI.getStats(),
        userAPI.getUsage(),
        api.get('/subscriptions/my-subscription')
      ]);
      setStats(statsRes.data);
      setUsage(usageRes.data);
      setSubscription(subRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Falha ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Função para converter data DD/MM/YYYY para YYYY-MM-DD
  const convertDateToISO = (dateStr) => {
    if (!dateStr) return null;

    // Se já está no formato YYYY-MM-DD, retorna como está
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }

    // Se está no formato DD/MM/YYYY, converte para YYYY-MM-DD
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }

    return null;
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Adicionar filtros
      if (filters.razao_social) params.append('razao_social', filters.razao_social);
      if (filters.nome_fantasia) params.append('nome_fantasia', filters.nome_fantasia);
      if (filters.cnae) params.append('cnae', filters.cnae);
      if (filters.uf) params.append('uf', filters.uf);
      if (filters.municipio) params.append('municipio', filters.municipio);
      if (filters.situacao_cadastral) params.append('situacao_cadastral', filters.situacao_cadastral);

      // Converter datas para formato ISO (YYYY-MM-DD)
      const dataMin = convertDateToISO(filters.data_inicio_atividade_min);
      const dataMax = convertDateToISO(filters.data_inicio_atividade_max);

      // IMPORTANTE: API usa '_min' e '_max', não '_de' e '_ate'
      if (dataMin) params.append('data_inicio_atividade_min', dataMin);
      if (dataMax) params.append('data_inicio_atividade_max', dataMax);

      params.append('page', currentPage);
      params.append('per_page', itemsPerPage);

      const response = await api.get(`/search?${params.toString()}`);

      setResults(response.data.items || []);
      setTotalPages(response.data.total_pages || 0);
      setTotalResults(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao buscar empresas');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle size={48} className="error-icon" />
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={loadData} className="retry-button">Tentar Novamente</button>
      </div>
    );
  }

  const usageData = usage?.daily_usage || [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Visão geral do sistema e uso da API</p>
      </div>

      {subscription && subscription.plan_name && (
        <div className="subscription-card">
          <h3>Sua Assinatura: {subscription.plan_name}</h3>
          <div className="subscription-stats">
            <div className="sub-stat">
              <p>Limite Mensal</p>
              <strong>{(subscription.total_limit || 0).toLocaleString('pt-BR')}</strong>
            </div>
            <div className="sub-stat">
              <p>Consultas Usadas</p>
              <strong>{(subscription.queries_used || 0).toLocaleString('pt-BR')}</strong>
            </div>
            <div className="sub-stat">
              <p>Consultas Restantes</p>
              <strong>{(subscription.queries_remaining || 0).toLocaleString('pt-BR')}</strong>
            </div>
            <div className="sub-stat">
              <p>Renovação</p>
              <strong>{subscription.renewal_date ? new Date(subscription.renewal_date).toLocaleDateString('pt-BR') : 'N/A'}</strong>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((subscription.total_limit || 0) > 0 ? ((subscription.queries_used || 0) / (subscription.total_limit || 1) * 100) : 0)}%` }}
            />
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Building2 size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total de Empresas</p>
            <h3 className="stat-value">
              {(stats?.total_empresas || 0).toLocaleString('pt-BR')}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Estabelecimentos</p>
            <h3 className="stat-value">
              {(stats?.total_estabelecimentos || 0).toLocaleString('pt-BR')}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total de Sócios</p>
            <h3 className="stat-value">
              {(stats?.total_socios || 0).toLocaleString('pt-BR')}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Requisições Hoje</p>
            <h3 className="stat-value">
              {(usage?.requests_today || 0).toLocaleString('pt-BR')}
            </h3>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <TrendingUp size={20} />
            <h2>Uso da API (Últimos 7 dias)</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <Clock size={20} />
            <h2>Status do Sistema</h2>
          </div>
          <div className="status-list">
            <div className="status-item">
              <CheckCircle2 size={20} className="status-icon success" />
              <div className="status-content">
                <h4>Banco de Dados</h4>
                <p>Conectado e operacional</p>
              </div>
            </div>
            <div className="status-item">
              <CheckCircle2 size={20} className="status-icon success" />
              <div className="status-content">
                <h4>API REST</h4>
                <p>Funcionando normalmente</p>
              </div>
            </div>
            <div className="status-item">
              <CheckCircle2 size={20} className="status-icon success" />
              <div className="status-content">
                <h4>Dados Atualizados</h4>
                <p>Última atualização: {usage?.last_update || 'Hoje'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <Database size={20} />
          <h2>Estatísticas do Banco de Dados</h2>
        </div>
        <div className="db-stats">
          <div className="db-stat-item">
            <p className="db-stat-label">CNAEs Cadastrados</p>
            <p className="db-stat-value">{(stats?.total_cnaes || 0).toLocaleString('pt-BR')}</p>
          </div>
          <div className="db-stat-item">
            <p className="db-stat-label">Municípios</p>
            <p className="db-stat-value">{(stats?.total_municipios || 0).toLocaleString('pt-BR')}</p>
          </div>
          <div className="db-stat-item">
            <p className="db-stat-label">Taxa de Sucesso</p>
            <p className="db-stat-value">99.9%</p>
          </div>
          <div className="db-stat-item">
            <p className="db-stat-label">Tempo Médio de Resposta</p>
            <p className="db-stat-value">{usage?.avg_response_time || '45ms'}</p>
          </div>
        </div>
      </div>

      {/* Seção de Busca de Empresas (se houver) */}
      <div className="card search-filters">
        <div className="card-header">
          <Users size={20} />
          <h2>Busca de Empresas</h2>
        </div>
        <div className="filter-grid">
          <div className="filter-item">
            <label>Razão Social:</label>
            <input
              type="text"
              placeholder="Ex: Nome da Empresa"
              value={filters.razao_social}
              onChange={(e) => setFilters({ ...filters, razao_social: e.target.value })}
            />
          </div>
          <div className="filter-item">
            <label>Nome Fantasia:</label>
            <input
              type="text"
              placeholder="Ex: Fantasia Ltda"
              value={filters.nome_fantasia}
              onChange={(e) => setFilters({ ...filters, nome_fantasia: e.target.value })}
            />
          </div>
          <div className="filter-item">
            <label>CNAE:</label>
            <input
              type="text"
              placeholder="Ex: 47.71-2/01"
              value={filters.cnae}
              onChange={(e) => setFilters({ ...filters, cnae: e.target.value })}
            />
          </div>
          <div className="filter-item">
            <label>UF:</label>
            <input
              type="text"
              placeholder="Ex: SP"
              value={filters.uf}
              onChange={(e) => setFilters({ ...filters, uf: e.target.value })}
            />
          </div>
          <div className="filter-item">
            <label>Município:</label>
            <input
              type="text"
              placeholder="Ex: São Paulo"
              value={filters.municipio}
              onChange={(e) => setFilters({ ...filters, municipio: e.target.value })}
            />
          </div>
          <div className="filter-item">
            <label>Situação Cadastral:</label>
            <input
              type="text"
              placeholder="Ex: Ativa"
              value={filters.situacao_cadastral}
              onChange={(e) => setFilters({ ...filters, situacao_cadastral: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Data Início DE:</label>
            <input
              type="text"
              placeholder="DD/MM/AAAA ou AAAA-MM-DD"
              value={filters.data_inicio_atividade_min}
              onChange={(e) => setFilters({ ...filters, data_inicio_atividade_min: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Data Início ATÉ:</label>
            <input
              type="text"
              placeholder="DD/MM/AAAA ou AAAA-MM-DD"
              value={filters.data_inicio_atividade_max}
              onChange={(e) => setFilters({ ...filters, data_inicio_atividade_max: e.target.value })}
            />
          </div>
        </div>
        <button onClick={handleSearch} className="search-button">Buscar Empresas</button>
      </div>

      {results.length > 0 && (
        <div className="card results-card">
          <div className="card-header">
            <Users size={20} />
            <h2>Resultados da Busca</h2>
          </div>
          <div className="results-summary">
            <p>Total de Empresas Encontradas: <strong>{totalResults.toLocaleString('pt-BR')}</strong></p>
            <p>Página {currentPage} de {totalPages}</p>
          </div>
          <table className="results-table">
            <thead>
              <tr>
                <th>CNPJ</th>
                <th>Razão Social</th>
                <th>Nome Fantasia</th>
                <th>Município</th>
                <th>UF</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr key={item.cnpj}>
                  <td>{item.cnpj}</td>
                  <td>{item.razao_social}</td>
                  <td>{item.nome_fantasia}</td>
                  <td>{item.municipio}</td>
                  <td>{item.uf}</td>
                  <td>{item.situacao_cadastral}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Anterior</button>
            <span>Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Próxima</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;