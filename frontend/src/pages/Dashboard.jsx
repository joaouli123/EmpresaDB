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
        api.get('/api/v1/subscriptions/my-subscription'),
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

        {subscription && subscription.plan_name && (
          <div className="card">
            <div className="card-header">
              <Activity size={20} />
              <h2>Uso de Consultas</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', padding: '20px 0' }}>
              {/* Círculo Consultas Usadas */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>Consultas Usadas</p>
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                  <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10"></circle>
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="50" 
                      fill="none" 
                      stroke={(subscription.queries_used || 0) >= (subscription.total_limit || 0) ? '#ef4444' : '#3b82f6'}
                      strokeWidth="10"
                      strokeDasharray={`${((subscription.queries_used || 0) / (subscription.total_limit || 1)) * 314} 314`}
                      strokeLinecap="round"
                    ></circle>
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                      {subscription.queries_used || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Círculo Consultas Restantes */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>Consultas Restantes</p>
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                  <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10"></circle>
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="50" 
                      fill="none" 
                      stroke={(subscription.queries_used || 0) >= (subscription.total_limit || 0) ? '#ef4444' : '#10b981'}
                      strokeWidth="10"
                      strokeDasharray={`${(((subscription.total_limit || 0) - (subscription.queries_used || 0)) / (subscription.total_limit || 1)) * 314} 314`}
                      strokeLinecap="round"
                    ></circle>
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: (subscription.queries_used || 0) >= (subscription.total_limit || 0) ? '#ef4444' : '#10b981' }}>
                      {(subscription.total_limit || 0) - (subscription.queries_used || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px 0' }}>
                {subscription.queries_used || 0} de {subscription.total_limit || 0} consultas usadas no plano {subscription.plan_name}
              </p>
              {subscription.plan_name === 'Free' && (subscription.queries_used || 0) >= (subscription.total_limit || 0) && (
                <a href="/home#pricing" style={{ 
                  display: 'inline-block',
                  fontSize: '12px',
                  color: '#3b82f6',
                  backgroundColor: '#eff6ff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}>Fazer upgrade do plano →</a>
              )}
            </div>
          </div>
        )}
      </div>


      {batchCredits && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} />
              <h2 style={{ fontSize: '16px', margin: 0 }}>Créditos de Consultas em Lote</h2>
            </div>
            {batchCredits.available_credits === 0 && (
              <a
                href="/home#pricing"
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Comprar Mais Créditos
              </a>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', padding: '16px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px 0' }}>Créditos Totais</p>
              <p style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{(batchCredits.total_credits || 0).toLocaleString('pt-BR')}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px 0' }}>Créditos Usados</p>
              <p style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{(batchCredits.used_credits || 0).toLocaleString('pt-BR')}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px 0' }}>Créditos Restantes</p>
              <p style={{ fontSize: '20px', fontWeight: '600', color: '#10b981', margin: 0 }}>
                {(batchCredits.available_credits || 0).toLocaleString('pt-BR')}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px 0' }}>Status</p>
              <p style={{ fontSize: '16px', fontWeight: '600', color: batchCredits.available_credits > 0 ? '#10b981' : '#f59e0b', margin: 0 }}>
                {batchCredits.available_credits > 0 ? 'Ativo' : 'Sem créditos'}
              </p>
            </div>
          </div>
          <div className="progress-bar" style={{ marginTop: '8px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${batchCredits.total_credits > 0 ? ((batchCredits.used_credits / batchCredits.total_credits) * 100) : 0}%`,
                backgroundColor: batchCredits.available_credits > 100 ? '#10b981' : batchCredits.available_credits > 0 ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
          <div style={{ 
            marginTop: '12px', 
            padding: '10px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#059669'
          }}>
            <p style={{ margin: 0 }}>
              💡 <strong>Dica:</strong> Use o endpoint <code>/batch/search</code> para fazer consultas em lote. 
              Cada resultado retornado consome 1 crédito. Créditos não expiram!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;