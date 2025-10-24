import { useState, useEffect } from 'react';
import { cnpjAPI, userAPI, api } from '../services/api'; // Import 'api'
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
  const [subscription, setSubscription] = useState(null); // State for subscription data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usageRes, subRes] = await Promise.all([
        cnpjAPI.getStats(),
        userAPI.getUsage(),
        api.get('/subscriptions/my-subscription') // Fetch subscription data
      ]);
      setStats(statsRes.data);
      setUsage(usageRes.data);
      setSubscription(subRes.data); // Set subscription state
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  const usageData = usage?.daily_usage || [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Visão geral do sistema e uso da API</p>
      </div>

      {subscription && (
        <div className="subscription-card">
          <h3>Sua Assinatura: {subscription.plan_name}</h3>
          <div className="subscription-stats">
            <div className="sub-stat">
              <p>Limite Mensal</p>
              <strong>{subscription.total_limit.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="sub-stat">
              <p>Consultas Usadas</p>
              <strong>{subscription.queries_used.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="sub-stat">
              <p>Consultas Restantes</p>
              <strong>{subscription.queries_remaining.toLocaleString('pt-BR')}</strong>
            </div>
            <div className="sub-stat">
              <p>Renovação</p>
              <strong>{new Date(subscription.renewal_date).toLocaleDateString('pt-BR')}</strong>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(subscription.queries_used / subscription.total_limit * 100)}%` }}
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
    </div>
  );
};

export default Dashboard;