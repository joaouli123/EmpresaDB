import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Activity, TrendingUp, DollarSign, Database, AlertCircle } from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('pt-BR');
const brl = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getOverview();
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Não foi possível carregar os indicadores.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando indicadores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pg">
        <div className="pcard"><div className="pempty">
          <AlertCircle size={34} className="ico" />
          <h3>Erro ao carregar</h3>
          <p>{error}</p>
          <button className="btn-flat primary" onClick={load}>Tentar novamente</button>
        </div></div>
      </div>
    );
  }

  const u = data.users, us = data.usage, sub = data.subscriptions, fin = data.finance, db = data.database;
  const maxDaily = Math.max(1, ...us.daily.map((d) => d.requests));
  const maxDist = Math.max(1, ...sub.distribution.map((d) => d.count));

  return (
    <div className="pg" style={{ maxWidth: '1240px' }}>
      <div className="pg-head">
        <div>
          <h1>Visão geral</h1>
          <p>Indicadores de usuários, consumo, planos, financeiro e banco</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label"><Users size={15} /> Usuários</span>
          <div className="kpi-value">{fmt(u.total)}</div>
          <div className="kpi-sub up">+{fmt(u.new_this_month)} este mês</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><Activity size={15} /> Ativos (30d)</span>
          <div className="kpi-value">{fmt(u.active_30d)}</div>
          <div className="kpi-sub">{fmt(u.active)} contas ativas</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><Activity size={15} /> Requisições no mês</span>
          <div className="kpi-value">{fmt(us.requests_this_month)}</div>
          <div className="kpi-sub">{fmt(us.requests_today)} hoje</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><TrendingUp size={15} /> MRR</span>
          <div className="kpi-value">{brl(sub.mrr)}</div>
          <div className="kpi-sub">{fmt(sub.paid_active)} assinaturas pagas</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><DollarSign size={15} /> Receita no mês</span>
          <div className="kpi-value">{brl(fin.revenue_this_month)}</div>
          <div className="kpi-sub">{brl(fin.revenue_total)} no total</div>
        </div>
      </div>

      <div className="pgrid-2">
        <div className="pcard">
          <div className="pcard-head">
            <h2>Requisições (14 dias)</h2>
          </div>
          <div className="pcard-body">
            {us.daily.length === 0 ? (
              <div className="pempty"><p>Sem dados de consumo ainda.</p></div>
            ) : (
              <>
                <div className="barchart">
                  {us.daily.map((d, i) => (
                    <div className="bar" key={i} title={`${d.date}: ${fmt(d.requests)}`}>
                      <i style={{ height: `${(d.requests / maxDaily) * 100}%` }} />
                    </div>
                  ))}
                </div>
                <div className="barchart-x">
                  {us.daily.map((d, i) => (
                    <span key={i}>{i % 2 === 0 ? d.date : ''}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pcard">
          <div className="pcard-head">
            <h2>Distribuição por plano</h2>
          </div>
          <div className="pcard-body">
            {sub.distribution.map((d, i) => (
              <div className="distrow" key={i}>
                <span className="dname">{d.plan}</span>
                <span className="dtrack"><span className="dfill" style={{ width: `${(d.count / maxDist) * 100}%` }} /></span>
                <span className="dcount">{fmt(d.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pcard">
        <div className="pcard-head">
          <div className="pcard-head-id">
            <div className="key-icon-sq"><Database size={17} /></div>
            <div>
              <h2>Banco de dados CNPJ</h2>
              <p className="sub">{db.competencia ? `Competência ${db.competencia}` : 'Competência não registrada'} · {db.size}</p>
            </div>
          </div>
        </div>
        <div className="pcard-body">
          <div className="pmetrics">
            <div><span className="k">Empresas</span><span className="v">{fmt(db.empresas)}</span></div>
            <div><span className="k">Estabelecimentos</span><span className="v">{fmt(db.estabelecimentos)}</span></div>
            <div><span className="k">Sócios</span><span className="v">{fmt(db.socios)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
