import { useMemo, useState, useEffect } from 'react';
import { userAPI, api } from '../services/api';
import { Building2, Database, Users, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const pct = (used, total) => (total > 0 ? Math.min((used / total) * 100, 100) : 0);

const UsageBar = ({ label, used, total, remaining, remainingLabel, green, showUpgrade }) => {
  const percent = pct(used, total);
  const full = total > 0 && used >= total;
  return (
    <div className="usage-block">
      <div className="usage-row">
        <span className="usage-label">{label}</span>
        <span className="usage-count"><strong>{used.toLocaleString('pt-BR')}</strong> de {total.toLocaleString('pt-BR')}</span>
      </div>
      <div className="usage-track">
        <div className={`usage-bar-fill${full ? ' is-full' : green ? ' is-green' : ''}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="usage-hint">
        <span>{remaining.toLocaleString('pt-BR')} {remainingLabel}</span>
        {showUpgrade && <a href="/home#pricing">Fazer upgrade →</a>}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [batchCredits, setBatchCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usageRes, subRes, creditsRes] = await Promise.allSettled([
        userAPI.getUsage(),
        api.get('/api/v1/subscriptions/my-subscription'),
        api.get('/api/v1/batch/credits'),
      ]);
      const usageData = usageRes.status === 'fulfilled' ? usageRes.value.data : null;
      const subscriptionData = subRes.status === 'fulfilled' ? subRes.value.data : null;
      const creditsData = creditsRes.status === 'fulfilled' ? creditsRes.value.data : null;
      setUsage(usageData);
      setSubscription(subscriptionData);
      setBatchCredits(creditsData);
      if (!usageData && !subscriptionData && !creditsData) {
        throw new Error('Dashboard data unavailable');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Falha ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const usageData = useMemo(() => {
    if (!usage || !usage.daily_usage) return [];
    return usage.daily_usage.map((item) => ({ date: item.date, requests: item.requests || 0 }));
  }, [usage]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <AlertCircle size={40} color="var(--danger)" />
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={loadData} className="btn-primary">Tentar Novamente</button>
      </div>
    );
  }

  const isFree = subscription?.plan_name === 'Free';
  const normalUsed = subscription?.queries_used || 0;
  const normalTotal = subscription?.total_limit || 200;
  const normalRemaining = Math.max(normalTotal - normalUsed, 0);
  const batchUsed = batchCredits?.used_credits || 0;
  const batchTotal = batchCredits?.total_credits || 0;
  const batchAvailable = batchCredits?.available_credits || 0;
  const queriesToday = usage?.queries_used_today || usage?.requests_today || 0;

  const stats = [
    { icon: Building2, color: 'blue', label: 'Empresas', value: '66,0 mi' },
    { icon: Database, color: 'green', label: 'Estabelecimentos', value: '69,2 mi' },
    { icon: Users, color: 'purple', label: 'Sócios', value: '26,5 mi' },
    { icon: Activity, color: 'orange', label: 'Consultas hoje', value: queriesToday.toLocaleString('pt-BR') },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Visão geral do sistema e uso da API</p>
      </div>

      <div className="stats-grid">
        {stats.map(({ icon: Icon, color, label, value }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon size={20} /></div>
            <div className="stat-content">
              <p className="stat-label">{label}</p>
              <h3 className="stat-value">{value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <TrendingUp size={18} />
            <h2>Uso da API (últimos 7 dias)</h2>
          </div>
          <div className="chart-container">
            {usageData.length === 0 ? (
              <p className="chart-empty">Ainda não há dados de uso para exibir.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="var(--primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <Activity size={18} />
            <h2>Uso de consultas</h2>
          </div>
          <UsageBar
            label="Consultas avulsas"
            used={normalUsed}
            total={normalTotal}
            remaining={normalRemaining}
            remainingLabel="restantes este mês"
            showUpgrade={isFree}
          />
          <UsageBar
            label="Consultas em lote"
            used={batchUsed}
            total={batchTotal}
            remaining={batchAvailable}
            remainingLabel="créditos restantes"
            green
            showUpgrade={isFree && batchTotal === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
