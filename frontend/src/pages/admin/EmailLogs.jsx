import { useState, useEffect } from 'react';
import { emailLogsAPI } from '../../services/api';
import { 
  Mail, 
  RefreshCw, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  Check,
  X
} from 'lucide-react';

const EmailLogs = () => {
  const [activeTab, setActiveTab] = useState('email-logs');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});

  const pageSize = 50;

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        ...filters
      };

      let response;
      switch (activeTab) {
        case 'email-logs':
          response = await emailLogsAPI.getEmailLogs(params);
          break;
        case 'followup-tracking':
          response = await emailLogsAPI.getFollowupTracking(params);
          break;
        case 'usage-notifications':
          response = await emailLogsAPI.getUsageNotifications(params);
          break;
        default:
          return;
      }

      setData(response.data.items || response.data || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Error loading data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const getStatusBadge = (status, type = 'email') => {
    const badges = {
      email: {
        sent: { color: '#10b981', label: 'Enviado' },
        failed: { color: '#ef4444', label: 'Falhou' }
      },
      followup: {
        completed: { color: '#10b981', label: 'Completo' },
        sent: { color: '#3b82f6', label: 'Enviado' },
        pending: { color: '#f59e0b', label: 'Pendente' },
        abandoned: { color: '#6b7280', label: 'Abandonado' }
      }
    };

    const badgeType = type === 'email' ? badges.email : badges.followup;
    const badge = badgeType[status] || { color: '#6b7280', label: status };

    return (
      <span 
        style={{
          backgroundColor: badge.color,
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'capitalize'
        }}
      >
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const renderEmailLogsFilters = () => (
    <div className="filters-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="Usuário"
        value={filters.username || ''}
        onChange={(e) => handleFilterChange('username', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      />
      <select
        value={filters.email_type || ''}
        onChange={(e) => handleFilterChange('email_type', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      >
        <option value="">Todos os Tipos</option>
        <option value="welcome">Boas-vindas</option>
        <option value="followup">Follow-up</option>
        <option value="usage_50">Uso 50%</option>
        <option value="usage_80">Uso 80%</option>
        <option value="limit_reached">Limite Atingido</option>
      </select>
      <select
        value={filters.status || ''}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      >
        <option value="">Todos os Status</option>
        <option value="sent">Enviado</option>
        <option value="failed">Falhou</option>
      </select>
      <input
        type="date"
        placeholder="Data Inicial"
        value={filters.date_from || ''}
        onChange={(e) => handleFilterChange('date_from', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      />
      <input
        type="date"
        placeholder="Data Final"
        value={filters.date_to || ''}
        onChange={(e) => handleFilterChange('date_to', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      />
      <button 
        onClick={clearFilters}
        style={{ 
          padding: '8px 16px', 
          background: '#ef4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <X size={16} />
        Limpar
      </button>
    </div>
  );

  const renderFollowupFilters = () => (
    <div className="filters-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="Usuário"
        value={filters.username || ''}
        onChange={(e) => handleFilterChange('username', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      />
      <select
        value={filters.status || ''}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      >
        <option value="">Todos os Status</option>
        <option value="pending">Pendente</option>
        <option value="sent">Enviado</option>
        <option value="completed">Completo</option>
        <option value="abandoned">Abandonado</option>
      </select>
      <input
        type="date"
        placeholder="Data Inicial"
        value={filters.date_from || ''}
        onChange={(e) => handleFilterChange('date_from', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      />
      <input
        type="date"
        placeholder="Data Final"
        value={filters.date_to || ''}
        onChange={(e) => handleFilterChange('date_to', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      />
      <button 
        onClick={clearFilters}
        style={{ 
          padding: '8px 16px', 
          background: '#ef4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <X size={16} />
        Limpar
      </button>
    </div>
  );

  const renderUsageFilters = () => (
    <div className="filters-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="Usuário"
        value={filters.username || ''}
        onChange={(e) => handleFilterChange('username', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      />
      <input
        type="month"
        placeholder="Mês/Ano"
        value={filters.month || ''}
        onChange={(e) => handleFilterChange('month', e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', minWidth: '150px' }}
      />
      <button 
        onClick={clearFilters}
        style={{ 
          padding: '8px 16px', 
          background: '#ef4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <X size={16} />
        Limpar
      </button>
    </div>
  );

  const renderEmailLogsTable = () => (
    <div className="table-container" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Data/Hora</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Usuário</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Email Destinatário</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Tipo</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Assunto</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Erro</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Nenhum log de email encontrado
              </td>
            </tr>
          ) : (
            data.map((log, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px' }}>{formatDate(log.sent_at || log.created_at)}</td>
                <td style={{ padding: '12px' }}>{log.username || log.user_id}</td>
                <td style={{ padding: '12px' }}>{log.recipient_email}</td>
                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{log.email_type?.replace('_', ' ')}</td>
                <td style={{ padding: '12px' }}>{log.subject}</td>
                <td style={{ padding: '12px' }}>{getStatusBadge(log.status, 'email')}</td>
                <td style={{ padding: '12px', color: '#ef4444', fontSize: '12px' }}>
                  {log.error_message || '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderFollowupTable = () => (
    <div className="table-container" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Usuário</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Tentativa Atual</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Total de Tentativas</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Última Tentativa</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Próxima Tentativa</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Nenhum registro de follow-up encontrado
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px' }}>{record.username || record.user_id}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{record.current_attempt}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{record.total_attempts}</td>
                <td style={{ padding: '12px' }}>{formatDate(record.last_attempt_at)}</td>
                <td style={{ padding: '12px' }}>{formatDate(record.next_attempt_at)}</td>
                <td style={{ padding: '12px' }}>{getStatusBadge(record.status, 'followup')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderUsageTable = () => (
    <div className="table-container" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Usuário</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Mês/Ano</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Notificação 50% Enviada</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Notificação 80% Enviada</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Data Envio 50%</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Data Envio 80%</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Nenhuma notificação de uso encontrada
              </td>
            </tr>
          ) : (
            data.map((notification, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px' }}>{notification.username || notification.user_id}</td>
                <td style={{ padding: '12px' }}>{notification.month_year}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {notification.notified_50 ? (
                    <Check size={20} color="#10b981" />
                  ) : (
                    <X size={20} color="#ef4444" />
                  )}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {notification.notified_80 ? (
                    <Check size={20} color="#10b981" />
                  ) : (
                    <X size={20} color="#ef4444" />
                  )}
                </td>
                <td style={{ padding: '12px' }}>{formatDate(notification.notified_50_at)}</td>
                <td style={{ padding: '12px' }}>{formatDate(notification.notified_80_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '8px', 
        marginTop: '20px',
        padding: '20px 0'
      }}>
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            background: currentPage === 1 ? '#f9fafb' : 'white',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1
          }}
        >
          Anterior
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              1
            </button>
            {startPage > 2 && <span>...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              background: currentPage === page ? '#3b82f6' : 'white',
              color: currentPage === page ? 'white' : 'black',
              cursor: 'pointer',
              fontWeight: currentPage === page ? '600' : '400'
            }}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span>...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            background: currentPage === totalPages ? '#f9fafb' : 'white',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1
          }}
        >
          Próxima
        </button>
      </div>
    );
  };

  return (
    <div className="admin-database">
      <div className="page-header">
        <div>
          <h1>Logs de Email</h1>
          <p>Visualize e monitore todos os logs de email do sistema</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={loadData}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={20} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => {
              setActiveTab('email-logs');
              setCurrentPage(1);
              setFilters({});
            }}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'email-logs' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'email-logs' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'email-logs' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} />
              Email Logs
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('followup-tracking');
              setCurrentPage(1);
              setFilters({});
            }}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'followup-tracking' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'followup-tracking' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'followup-tracking' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} />
              Follow-up Tracking
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('usage-notifications');
              setCurrentPage(1);
              setFilters({});
            }}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'usage-notifications' ? '3px solid #3b82f6' : 'none',
              color: activeTab === 'usage-notifications' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'usage-notifications' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              Usage Notifications
            </div>
          </button>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          {activeTab === 'email-logs' && renderEmailLogsFilters()}
          {activeTab === 'followup-tracking' && renderFollowupFilters()}
          {activeTab === 'usage-notifications' && renderUsageFilters()}

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <p style={{ color: '#6b7280' }}>Carregando dados...</p>
            </div>
          ) : (
            <>
              {activeTab === 'email-logs' && renderEmailLogsTable()}
              {activeTab === 'followup-tracking' && renderFollowupTable()}
              {activeTab === 'usage-notifications' && renderUsageTable()}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailLogs;
