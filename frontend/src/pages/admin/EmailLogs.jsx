import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Mail, Send, AlertCircle, RefreshCw, Clock, XCircle, Search } from 'lucide-react';

const BASE = '/api/v1/admin';
const PER_PAGE = 25;

const ENDPOINTS = {
  logs: `${BASE}/email-logs`,
  followups: `${BASE}/followup-tracking`,
  usage: `${BASE}/usage-notifications`,
};

const TABS = [
  { id: 'logs', label: 'Logs de email', icon: Mail },
  { id: 'followups', label: 'Follow-ups', icon: Send },
  { id: 'usage', label: 'Notificações de uso', icon: AlertCircle },
];

// Tipos realmente gravados em clientes.email_logs (ver email_tracking_schema.sql e chamadas a log_email)
const EMAIL_TYPE_OPTIONS = [
  ['account_created', 'Conta criada'],
  ['account_activation', 'Ativação de conta'],
  ['password_reset', 'Redefinição de senha'],
  ['subscription_created', 'Assinatura criada'],
  ['subscription_renewed', 'Assinatura renovada'],
  ['subscription_expired', 'Assinatura vencida'],
  ['subscription_cancelled', 'Assinatura cancelada'],
  ['usage_50', 'Uso 50%'],
  ['usage_80', 'Uso 80%'],
  ['batch_credits_purchased', 'Créditos em lote'],
];

const EMAIL_TYPE_LABELS = Object.fromEntries(EMAIL_TYPE_OPTIONS);

const EMPTY_FILTERS = { username: '', emailType: '', status: '', dateFrom: '', dateTo: '', monthYear: '' };

const fmt = (n) => (n || 0).toLocaleString('pt-BR');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

const emailStatusBadge = (status) => {
  const map = { sent: ['green', 'Enviado'], failed: ['red', 'Falhou'], bounced: ['gray', 'Retornou'] };
  const [cls, label] = map[status] || ['gray', status || '—'];
  return <span className={`pbadge ${cls}`}>{label}</span>;
};

const followupStatusBadge = (status) => {
  const map = {
    completed: ['green', 'Concluído'],
    sent: ['blue', 'Enviado'],
    pending: ['gray', 'Pendente'],
    abandoned: ['red', 'Abandonado'],
  };
  const [cls, label] = map[status] || ['gray', status || '—'];
  return <span className={`pbadge ${cls}`}>{label}</span>;
};

const EmailLogs = () => {
  const [tab, setTab] = useState('logs');
  const [stats, setStats] = useState(null);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros (rascunho — aplicados ao clicar em Filtrar / Enter)
  const [username, setUsername] = useState('');
  const [emailType, setEmailType] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [monthYear, setMonthYear] = useState('');

  const currentFilters = () => ({ username, emailType, status, dateFrom, dateTo, monthYear });

  const loadStats = async () => {
    try {
      const res = await api.get(`${BASE}/email-logs/stats`);
      setStats(res.data);
    } catch {
      setStats(null);
    }
  };

  const buildParams = (t, p, f) => {
    const params = { page: p, per_page: PER_PAGE };
    if (f.username.trim()) params.username = f.username.trim();
    if (t === 'logs') {
      if (f.emailType) params.email_type = f.emailType;
      if (f.status) params.status = f.status;
      if (f.dateFrom) params.date_from = f.dateFrom;
      if (f.dateTo) params.date_to = f.dateTo;
    } else if (t === 'followups') {
      if (f.status) params.status = f.status;
      if (f.dateFrom) params.date_from = f.dateFrom;
      if (f.dateTo) params.date_to = f.dateTo;
    } else if (t === 'usage') {
      if (f.monthYear) params.month_year = f.monthYear;
    }
    return params;
  };

  const load = async (t, p, f) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(ENDPOINTS[t], { params: buildParams(t, p, f) });
      setRows(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 0);
      setPage(res.data.page || p);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Não foi possível carregar os dados.');
      setRows([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    load('logs', 1, EMPTY_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetFilterFields = () => {
    setUsername('');
    setEmailType('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setMonthYear('');
  };

  const switchTab = (t) => {
    if (t === tab) return;
    setTab(t);
    resetFilterFields();
    load(t, 1, EMPTY_FILTERS);
  };

  const applyFilters = () => load(tab, 1, currentFilters());

  const clearFilters = () => {
    resetFilterFields();
    load(tab, 1, EMPTY_FILTERS);
  };

  const refresh = () => {
    loadStats();
    load(tab, page, currentFilters());
  };

  const cardTitles = {
    logs: ['Emails enviados', 'Histórico de envios registrados pelo sistema'],
    followups: ['Follow-ups de assinatura', 'Tentativas de recuperação de assinaturas vencidas'],
    usage: ['Notificações de uso', 'Avisos de consumo (50% e 80%) enviados por mês'],
  };

  const emptyMessages = {
    logs: ['Nenhum log de email', 'Ajuste os filtros ou aguarde novos envios.'],
    followups: ['Nenhum follow-up registrado', 'Nenhuma tentativa de follow-up encontrada para os filtros atuais.'],
    usage: ['Nenhuma notificação de uso', 'Nenhum aviso de consumo encontrado para os filtros atuais.'],
  };

  const renderLogsTable = () => (
    <table className="ptable">
      <thead>
        <tr>
          <th>Data</th>
          <th>Usuário</th>
          <th>Destinatário</th>
          <th>Tipo</th>
          <th>Assunto</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((log) => (
          <tr key={log.id}>
            <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(log.sent_at)}</td>
            <td>
              <div style={{ fontWeight: 600 }}>{log.username || `#${log.user_id}`}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{log.user_email}</div>
            </td>
            <td>{log.recipient_email}</td>
            <td><span className="pbadge blue">{EMAIL_TYPE_LABELS[log.email_type] || log.email_type}</span></td>
            <td>{log.subject || '—'}</td>
            <td>
              {emailStatusBadge(log.status)}
              {log.error_message && (
                <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, maxWidth: 220 }}>
                  {log.error_message}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderFollowupsTable = () => (
    <table className="ptable">
      <thead>
        <tr>
          <th>Usuário</th>
          <th>Assinatura</th>
          <th>Tentativa</th>
          <th>Total de tentativas</th>
          <th>Última tentativa</th>
          <th>Próxima tentativa</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((ft) => (
          <tr key={ft.id}>
            <td>
              <div style={{ fontWeight: 600 }}>{ft.username || `#${ft.user_id}`}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{ft.user_email}</div>
            </td>
            <td>{ft.subscription_id || '—'}</td>
            <td>{fmt(ft.attempt_number)}</td>
            <td>{fmt(ft.total_attempts)}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(ft.last_attempt_at)}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(ft.next_attempt_at)}</td>
            <td>{followupStatusBadge(ft.status)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderUsageTable = () => (
    <table className="ptable">
      <thead>
        <tr>
          <th>Usuário</th>
          <th>Mês/Ano</th>
          <th>Notificação 50%</th>
          <th>Notificação 80%</th>
          <th>Criado em</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((un) => (
          <tr key={un.id}>
            <td>
              <div style={{ fontWeight: 600 }}>{un.username || `#${un.user_id}`}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{un.user_email}</div>
            </td>
            <td>{un.month_year || '—'}</td>
            <td>
              {un.notification_50_sent ? (
                <>
                  <span className="pbadge green">Enviada</span>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{fmtDateTime(un.sent_50_at)}</div>
                </>
              ) : (
                <span className="pbadge gray">Não enviada</span>
              )}
            </td>
            <td>
              {un.notification_80_sent ? (
                <>
                  <span className="pbadge green">Enviada</span>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{fmtDateTime(un.sent_80_at)}</div>
                </>
              ) : (
                <span className="pbadge gray">Não enviada</span>
              )}
            </td>
            <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(un.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const [cardTitle, cardSub] = cardTitles[tab];
  const [emptyTitle, emptyText] = emptyMessages[tab];

  return (
    <div className="pg" style={{ maxWidth: '1240px' }}>
      <div className="pg-head">
        <div>
          <h1>Logs de email</h1>
          <p>Monitore envios, follow-ups de assinatura e notificações de uso</p>
        </div>
        <button className="btn-flat ghost" onClick={refresh} disabled={loading}>
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label"><Send size={15} /> Total enviados</span>
          <div className="kpi-value">{stats ? fmt(stats.total_sent) : '—'}</div>
          {stats && <div className="kpi-sub">de {fmt(stats.total)} registros</div>}
        </div>
        <div className="kpi">
          <span className="kpi-label"><XCircle size={15} /> Falhas</span>
          <div className="kpi-value">{stats ? fmt(stats.total_failed) : '—'}</div>
        </div>
        <div className="kpi">
          <span className="kpi-label"><Clock size={15} /> Últimos 7 dias</span>
          <div className="kpi-value">{stats ? fmt(stats.last_7_days) : '—'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`btn-flat ${tab === t.id ? 'primary' : 'ghost'}`}
              onClick={() => switchTab(t.id)}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="admin-filters">
        <input
          placeholder="Buscar por usuário..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
        />
        {tab === 'logs' && (
          <>
            <select value={emailType} onChange={(e) => setEmailType(e.target.value)}>
              <option value="">Todos os tipos</option>
              {EMAIL_TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="sent">Enviado</option>
              <option value="failed">Falhou</option>
              <option value="bounced">Retornou</option>
            </select>
          </>
        )}
        {tab === 'followups' && (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="sent">Enviado</option>
            <option value="completed">Concluído</option>
            <option value="abandoned">Abandonado</option>
          </select>
        )}
        {(tab === 'logs' || tab === 'followups') && (
          <>
            <input type="date" title="Data inicial" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <input type="date" title="Data final" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </>
        )}
        {tab === 'usage' && (
          <input type="month" title="Mês/Ano" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} />
        )}
        <button className="btn-flat primary" onClick={applyFilters} disabled={loading}>
          <Search size={16} /> Filtrar
        </button>
        <button className="btn-flat ghost" onClick={clearFilters} disabled={loading}>
          Limpar
        </button>
      </div>

      <div className="pcard">
        <div className="pcard-head">
          <div>
            <h2>{cardTitle}</h2>
            <p className="sub">{cardSub}</p>
          </div>
          {!loading && !error && <span className="pbadge gray">{fmt(total)} registros</span>}
        </div>
        <div className="pcard-body">
          {loading ? (
            <div className="pempty">
              <div className="spinner" />
              <p>Carregando...</p>
            </div>
          ) : error ? (
            <div className="pempty">
              <AlertCircle size={34} className="ico" />
              <h3>Erro ao carregar</h3>
              <p>{error}</p>
              <button className="btn-flat primary" onClick={() => load(tab, page, currentFilters())}>
                Tentar novamente
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="pempty">
              <Mail size={34} className="ico" />
              <h3>{emptyTitle}</h3>
              <p>{emptyText}</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                {tab === 'logs' && renderLogsTable()}
                {tab === 'followups' && renderFollowupsTable()}
                {tab === 'usage' && renderUsageTable()}
              </div>
              {totalPages > 1 && (
                <div className="pager">
                  <span>{fmt(total)} registros · página {page} de {totalPages}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn-flat ghost"
                      disabled={page <= 1 || loading}
                      onClick={() => load(tab, page - 1, currentFilters())}
                    >
                      Anterior
                    </button>
                    <button
                      className="btn-flat ghost"
                      disabled={page >= totalPages || loading}
                      onClick={() => load(tab, page + 1, currentFilters())}
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailLogs;
