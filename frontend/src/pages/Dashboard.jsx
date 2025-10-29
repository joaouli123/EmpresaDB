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
  AlertCircle,
  Package
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [batchCredits, setBatchCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Números fixos do banco de dados (não consulta API)
  const dbStats = {
    total_empresas: 64000000,
    total_estabelecimentos: 47000000,
    total_socios: 26000000
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usageRes, subRes, creditsRes] = await Promise.all([
        userAPI.getUsage(),
        api.get('/subscriptions/my-subscription'),
        api.get('/api/v1/batch/credits').catch(() => ({ data: null }))
      ]);
      setUsage(usageRes.data);
      setSubscription(subRes.data);
      setBatchCredits(creditsRes.data);
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
            <h3 className="stat-value">+65Mi</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Estabelecimentos</p>
            <h3 className="stat-value">+47Mi</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total de Sócios</p>
            <h3 className="stat-value">+26Mi</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Requisições Hoje</p>
            <h3 className="stat-value">
              {loading ? '...' : (usage?.queries_used_today || usage?.requests_today || 0).toLocaleString('pt-BR')}
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

      {batchCredits && (
        <div className="card">
          <div className="card-header">
            <Package size={20} />
            <h2>Créditos de Consultas em Lote</h2>
          </div>
          <div className="db-stats">
            <div className="db-stat-item">
              <p className="db-stat-label">Créditos Totais</p>
              <p className="db-stat-value">{(batchCredits.total_credits || 0).toLocaleString('pt-BR')}</p>
            </div>
            <div className="db-stat-item">
              <p className="db-stat-label">Créditos Usados</p>
              <p className="db-stat-value">{(batchCredits.used_credits || 0).toLocaleString('pt-BR')}</p>
            </div>
            <div className="db-stat-item">
              <p className="db-stat-label">Créditos Restantes</p>
              <p className="db-stat-value" style={{ color: '#10b981', fontWeight: 'bold' }}>
                {(batchCredits.available_credits || 0).toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="db-stat-item">
              <p className="db-stat-label">Status</p>
              <p className="db-stat-value" style={{ fontSize: '14px' }}>
                {batchCredits.available_credits > 0 ? '✅ Ativo' : '⚠️ Sem créditos'}
              </p>
            </div>
          </div>
          <div className="progress-bar" style={{ marginTop: '20px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${batchCredits.total_credits > 0 ? ((batchCredits.used_credits / batchCredits.total_credits) * 100) : 0}%`,
                backgroundColor: batchCredits.available_credits > 100 ? '#10b981' : batchCredits.available_credits > 0 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#059669'
          }}>
            <p style={{ margin: 0 }}>
              💡 <strong>Dica:</strong> Use o endpoint <code>/batch/search</code> para fazer consultas em lote. 
              Cada resultado retornado consome 1 crédito. Créditos não expiram!
            </p>
          </div>
          {batchCredits.available_credits === 0 && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <a
                href="/home#pricing"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Comprar Mais Créditos
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;