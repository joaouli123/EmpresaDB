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
        <>
          {/* MODELO 1: Compacto com barra grande */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>MODELO 1</span>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '4px 0', color: '#1f2937' }}>
                  {subscription.queries_used || 0}/{subscription.total_limit || 0} <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '400' }}>consultas</span>
                </h3>
              </div>
              {subscription.plan_name === 'Free' && (subscription.queries_used || 0) >= (subscription.total_limit || 0) && (
                <a href="/home#pricing" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>Fazer upgrade →</a>
              )}
            </div>
            <div style={{ 
              height: '12px', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '999px', 
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${((subscription.queries_used || 0) / (subscription.total_limit || 1)) * 100}%`,
                backgroundColor: (subscription.queries_used || 0) >= (subscription.total_limit || 0) ? '#ef4444' : '#3b82f6',
                borderRadius: '999px',
                transition: 'all 0.3s ease'
              }}></div>
            </div>
          </div>

          {/* MODELO 2: Cards lado a lado minimalista */}
          <div className="card">
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '12px', display: 'block' }}>MODELO 2</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Usadas</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>{subscription.queries_used || 0}</p>
              </div>
              <div style={{ width: '1px', height: '40px', backgroundColor: '#e5e7eb' }}></div>
              <div>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Restantes</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: (subscription.queries_used || 0) >= (subscription.total_limit || 0) ? '#ef4444' : '#10b981', margin: 0 }}>
                  {(subscription.total_limit || 0) - (subscription.queries_used || 0)}
                </p>
              </div>
            </div>
            {subscription.plan_name === 'Free' && (subscription.queries_used || 0) >= (subscription.total_limit || 0) && (
              <a href="/home#pricing" style={{ 
                display: 'block',
                marginTop: '12px',
                textAlign: 'center',
                fontSize: '11px',
                color: '#3b82f6',
                textDecoration: 'none',
                padding: '8px',
                backgroundColor: '#eff6ff',
                borderRadius: '6px',
                fontWeight: '500'
              }}>Fazer upgrade do plano</a>
            )}
          </div>

          {/* MODELO 3: Circular progress */}
          <div className="card">
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '12px', display: 'block' }}>MODELO 3</span>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" strokeWidth="8"></circle>
                  <circle 
                    cx="40" 
                    cy="40" 
                    r="32" 
                    fill="none" 
                    stroke={(subscription.queries_used || 0) >= (subscription.total_limit || 0) ? '#ef4444' : '#3b82f6'}
                    strokeWidth="8"
                    strokeDasharray={`${((subscription.queries_used || 0) / (subscription.total_limit || 1)) * 201} 201`}
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <p style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                    {Math.round(((subscription.queries_used || 0) / (subscription.total_limit || 1)) * 100)}%
                  </p>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0' }}>
                  {subscription.queries_used || 0} de {subscription.total_limit || 0} consultas usadas
                </p>
                {subscription.plan_name === 'Free' && (subscription.queries_used || 0) >= (subscription.total_limit || 0) && (
                  <a href="/home#pricing" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>Fazer upgrade →</a>
                )}
              </div>
            </div>
          </div>

          {/* MODELO 4: Super compacto inline */}
          <div className="card">
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '12px', display: 'block' }}>MODELO 4</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                flex: 1,
                height: '8px',
                backgroundColor: '#f3f4f6',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${((subscription.queries_used || 0) / (subscription.total_limit || 1)) * 100}%`,
                  backgroundColor: (subscription.queries_used || 0) >= (subscription.total_limit || 0) ? '#ef4444' : '#3b82f6',
                  borderRadius: '999px'
                }}></div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', whiteSpace: 'nowrap' }}>
                {subscription.queries_used || 0}/{subscription.total_limit || 0}
              </span>
              {subscription.plan_name === 'Free' && (subscription.queries_used || 0) >= (subscription.total_limit || 0) && (
                <a href="/home#pricing" style={{ 
                  fontSize: '11px',
                  color: '#fff',
                  backgroundColor: '#3b82f6',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}>Upgrade</a>
              )}
            </div>
          </div>
        </>
      )}

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