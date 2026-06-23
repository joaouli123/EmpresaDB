import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { DollarSign, Receipt, TrendingUp, AlertCircle } from 'lucide-react';

const brl = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
const fmt = (n) => (n || 0).toLocaleString('pt-BR');

const AdminFinance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getFinance();
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Não foi possível carregar o financeiro.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Carregando...</p></div>;

  if (error) {
    return (
      <div className="pg"><div className="pcard"><div className="pempty">
        <AlertCircle size={34} className="ico" /><h3>Erro ao carregar</h3><p>{error}</p>
        <button className="btn-flat primary" onClick={load}>Tentar novamente</button>
      </div></div></div>
    );
  }

  const t = data.totals;
  const series = data.revenue_series || [];
  const maxRev = Math.max(1, ...series.map((s) => s.revenue));

  return (
    <div className="pg" style={{ maxWidth: '1100px' }}>
      <div className="pg-head">
        <div>
          <h1>Financeiro</h1>
          <p>Receita, transações e indicadores de faturamento</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label"><DollarSign size={15} /> Receita total</span>
          <div className="kpi-value">{brl(t.revenue_total)}</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><TrendingUp size={15} /> Ticket médio</span>
          <div className="kpi-value">{brl(t.avg_ticket)}</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><Receipt size={15} /> Faturas pagas</span>
          <div className="kpi-value">{fmt(t.paid_count)}</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><Receipt size={15} /> Em aberto</span>
          <div className="kpi-value">{fmt(t.open_invoices)}</div>
        </div>
      </div>

      <div className="pcard">
        <div className="pcard-head"><h2>Receita por mês (6 meses)</h2></div>
        <div className="pcard-body">
          {series.length === 0 ? (
            <div className="pempty"><p>Sem receita registrada ainda.</p></div>
          ) : (
            <>
              <div className="barchart">
                {series.map((s, i) => (
                  <div className="bar" key={i} title={`${s.month}: ${brl(s.revenue)}`}>
                    <i style={{ height: `${(s.revenue / maxRev) * 100}%` }} />
                  </div>
                ))}
              </div>
              <div className="barchart-x">
                {series.map((s, i) => <span key={i}>{s.month.slice(5)}</span>)}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="pcard">
        <div className="pcard-head"><h2>Transações recentes</h2></div>
        <div className="pcard-body">
          {(!data.transactions || data.transactions.length === 0) ? (
            <div className="pempty"><AlertCircle size={28} className="ico" /><p>Nenhuma transação registrada.</p></div>
          ) : (
            <table className="ptable">
              <thead><tr><th>Data</th><th>Usuário</th><th>Tipo</th><th>Status</th><th className="amount">Valor</th></tr></thead>
              <tbody>
                {data.transactions.map((tx, i) => (
                  <tr key={i}>
                    <td>{tx.date ? new Date(tx.date).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>{tx.user}</td>
                    <td>{tx.type}</td>
                    <td><span className={`pbadge ${tx.status === 'paid' ? 'green' : tx.status === 'open' || tx.status === 'draft' ? 'blue' : 'gray'}`}>{tx.status}</span></td>
                    <td className="amount">{brl(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;
