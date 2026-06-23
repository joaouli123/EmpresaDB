import { useState, useEffect } from 'react';
import { adminAPI, etlAPI } from '../../services/api';
import { RefreshCw, PlayCircle, StopCircle, Search, AlertCircle, CheckCircle } from 'lucide-react';

const AdminETL = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getEtl();
      setInfo(res.data);
    } catch (e) {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const run = async (label, fn) => {
    setBusy(label);
    setMsg({ type: '', text: '' });
    try {
      const res = await fn();
      setMsg({ type: 'success', text: res?.data?.message || 'Operação enviada.' });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e?.response?.data?.detail || 'Não foi possível executar agora.' });
    } finally {
      setBusy('');
    }
  };

  const fmtDate = (s) => (s ? new Date(s).toLocaleString('pt-BR') : '—');

  if (loading) {
    return <div className="loading-container"><div className="spinner" /><p>Carregando...</p></div>;
  }

  return (
    <div className="pg" style={{ maxWidth: '1100px' }}>
      <div className="pg-head">
        <div>
          <h1>Atualização de dados (ETL)</h1>
          <p>Competência atual, última atualização e controle de importação</p>
        </div>
        <button className="btn-flat ghost" onClick={() => run('check', etlAPI.checkUpdates)} disabled={!!busy}>
          <Search size={16} /> Verificar atualizações
        </button>
      </div>

      {msg.text && <div className={`pmsg ${msg.type}`}>{msg.text}</div>}

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label"><RefreshCw size={15} /> Competência no banco</span>
          <div className="kpi-value" style={{ fontSize: 20 }}>{info?.competencia || 'Não registrada'}</div>
          <div className="kpi-sub">{info?.cron_configured ? 'Controle de ETL ativo' : 'Controle de ETL ainda não inicializado'}</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><CheckCircle size={15} /> Última importação</span>
          <div className="kpi-value" style={{ fontSize: 20 }}>{fmtDate(info?.last_import)}</div>
          <div className="kpi-sub">Registrada após sucesso da carga</div>
        </div>
      </div>

      <div className="pcard">
        <div className="pcard-head"><h2>Controle de importação</h2></div>
        <div className="pcard-body">
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
            Iniciar dispara o download e a carga dos dados mais recentes da Receita. A carga é pesada e pode
            deixar os dados temporariamente incompletos.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-flat primary" onClick={() => run('start', etlAPI.startETL)} disabled={!!busy}>
              <PlayCircle size={16} /> Iniciar atualização
            </button>
            <button className="btn-flat ghost" onClick={() => run('status', etlAPI.getStatus)} disabled={!!busy}>
              <RefreshCw size={16} /> Status
            </button>
            <button className="btn-flat danger" onClick={() => run('stop', etlAPI.stopETL)} disabled={!!busy}>
              <StopCircle size={16} /> Parar
            </button>
          </div>
        </div>
      </div>

      <div className="pcard">
        <div className="pcard-head"><h2>Histórico de execuções</h2></div>
        <div className="pcard-body">
          {(!info?.history || info.history.length === 0) ? (
            <div className="pempty"><AlertCircle size={28} className="ico" /><p>Sem histórico de execuções registrado.</p></div>
          ) : (
            <table className="ptable">
              <thead><tr><th>Início</th><th>Fim</th><th>Status</th></tr></thead>
              <tbody>
                {info.history.map((h, i) => (
                  <tr key={i}>
                    <td>{fmtDate(h.started_at)}</td>
                    <td>{fmtDate(h.finished_at)}</td>
                    <td><span className={`pbadge ${h.status === 'success' ? 'green' : h.status === 'running' ? 'blue' : 'gray'}`}>{h.status || '—'}</span></td>
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

export default AdminETL;
