import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Database, HardDrive, Activity, AlertCircle } from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('pt-BR');

const AdminDatabase = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getDbHealth();
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Não foi possível carregar a saúde do banco.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><p>Carregando...</p></div>;
  }

  if (error) {
    return (
      <div className="pg">
        <div className="pcard"><div className="pempty">
          <AlertCircle size={34} className="ico" />
          <h3>Erro ao carregar</h3><p>{error}</p>
          <button className="btn-flat primary" onClick={load}>Tentar novamente</button>
        </div></div>
      </div>
    );
  }

  const connPct = data.max_connections ? Math.min((data.active_connections / data.max_connections) * 100, 100) : 0;
  const connLevel = connPct >= 90 ? 'over' : connPct >= 70 ? 'warn' : '';

  return (
    <div className="pg" style={{ maxWidth: '1100px' }}>
      <div className="pg-head">
        <div>
          <h1>Banco de dados</h1>
          <p>Saúde, tamanho, conexões e volume das tabelas</p>
        </div>
        <span className={`pbadge ${data.status === 'operacional' ? 'green' : 'red'}`}>
          {data.status === 'operacional' ? 'Operacional' : 'Indisponível'}
        </span>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label"><HardDrive size={15} /> Tamanho do banco</span>
          <div className="kpi-value" style={{ fontSize: 22 }}>{data.size}</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><Activity size={15} /> Conexões ativas</span>
          <div className="kpi-value">{fmt(data.active_connections)}<span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}> / {fmt(data.max_connections)}</span></div>
          <div className="ubar" style={{ marginTop: 8 }}><div className={`ubar-fill ${connLevel}`} style={{ width: `${connPct}%` }} /></div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><Database size={15} /> Competência dos dados</span>
          <div className="kpi-value" style={{ fontSize: 20 }}>{data.competencia || 'Não registrada'}</div>
        </div>
      </div>

      <div className="pcard">
        <div className="pcard-head"><h2>Tabelas (volume e tamanho)</h2></div>
        <div className="pcard-body">
          {(!data.tables || data.tables.length === 0) ? (
            <div className="pempty"><p>Sem informações de tabelas.</p></div>
          ) : (
            <table className="ptable">
              <thead><tr><th>Tabela</th><th>Registros (estimado)</th><th>Tamanho</th></tr></thead>
              <tbody>
                {data.tables.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{t.table}</td>
                    <td>{fmt(t.rows)}</td>
                    <td>{t.size}</td>
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

export default AdminDatabase;
