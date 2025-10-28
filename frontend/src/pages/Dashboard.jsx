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

  // Dados de uso para o gráfico (últimos 7 dias) - DADOS REAIS DO USUÁRIO
  const generateUsageData = () => {
    if (!usage || !usage.daily_usage) {
      return [];
    }
    
    return usage.daily_usage.map(item => ({
      date: item.date,
      requests: item.requests || 0
    }));
  };

  const usageData = generateUsageData();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Visão geral do sistema e uso da API</p>
      </div>

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
              {(usage?.queries_used_today || 0).toLocaleString('pt-BR')}
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
                <p>Última atualização: Hoje</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {subscription && subscription.plan_name && (
        <div className="card">
          <div className="card-header">
            <CheckCircle2 size={20} />
            <h2>Seu Plano: {subscription.plan_name}</h2>
          </div>
          <div className="db-stats">
            <div className="db-stat-item">
              <p className="db-stat-label">Limite Mensal</p>
              <p className="db-stat-value">{(subscription.total_limit || 0).toLocaleString('pt-BR')}</p>
            </div>
            <div className="db-stat-item">
              <p className="db-stat-label">Consultas Usadas</p>
              <p className="db-stat-value">{(subscription.queries_used || 0).toLocaleString('pt-BR')}</p>
            </div>
            <div className="db-stat-item">
              <p className="db-stat-label">Consultas Restantes</p>
              <p className="db-stat-value">{(subscription.queries_remaining || 0).toLocaleString('pt-BR')}</p>
            </div>
            <div className="db-stat-item">
              <p className="db-stat-label">Renovação</p>
              <p className="db-stat-value">
                {subscription.plan_name === 'Free' 
                  ? 'Mensal (Gratuito)' 
                  : subscription.renewal_date 
                    ? new Date(subscription.renewal_date).toLocaleDateString('pt-BR') 
                    : 'N/A'}
              </p>
            </div>
          </div>
          <div className="progress-bar" style={{ marginTop: '20px' }}>
            <div
              className="progress-fill"
              style={{ 
                width: `${((subscription.total_limit || 0) > 0 ? ((subscription.queries_used || 0) / (subscription.total_limit || 1) * 100) : 0)}%`,
                backgroundColor: subscription.plan_name === 'Free' && ((subscription.queries_used || 0) / (subscription.total_limit || 1) * 100) > 80 ? '#ef4444' : '#3b82f6'
              }}
            />
          </div>
          {subscription.plan_name === 'Free' && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <a 
                href="/home#pricing" 
                style={{
                  display: 'inline-block',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Fazer Upgrade do Plano
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
