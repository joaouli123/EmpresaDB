import { useState, useEffect } from 'react';
import { etlAPI, cnpjAPI } from '../services/api';
import { 
  Activity, 
  PlayCircle, 
  StopCircle, 
  RefreshCw, 
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download
} from 'lucide-react';

const AdminDashboard = () => {
  const [etlStatus, setEtlStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsConnection, setWsConnection] = useState(null);
  const [logs, setLogs] = useState([]);
  const [importStats, setImportStats] = useState(null);

  useEffect(() => {
    loadData();
    connectWebSocket();

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  // Poll de status detalhado quando ETL está rodando
  useEffect(() => {
    if (!etlStatus || !etlStatus.is_running) return;
    
    // Removido polling de detailed-status por enquanto
    // O ETL continua funcionando normalmente
    
  }, [etlStatus?.is_running]);

  const loadData = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        etlAPI.getStatus(),
        cnpjAPI.getStats()
      ]);
      
      console.log('[AdminDashboard] ETL Status recebido:', statusRes.data);
      setEtlStatus(statusRes.data);
      setStats(statsRes.data);
      
      // Carregar estatísticas de importação
      try {
        const importStatsRes = await etlAPI.getImportStatistics();
        setImportStats(importStatsRes.data.statistics);
      } catch (err) {
        console.log('[AdminDashboard] Estatísticas de importação não disponíveis ainda');
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    // Em desenvolvimento, usar localhost:8000 diretamente para WebSocket (proxy não funciona com WS)
    const isDev = import.meta.env.DEV;
    const wsUrl = isDev 
      ? 'ws://localhost:8000/api/v1/ws'
      : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/ws`;
    
    console.log('[ETL] Conectando WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[ETL] ✅ WebSocket conectado!');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[ETL] Mensagem WebSocket:', data);
      
      // Se for log, adicionar ao array de logs
      if (data.type === 'log') {
        const logEntry = {
          timestamp: data.data?.timestamp || new Date().toLocaleTimeString(),
          level: data.data?.level || 'info',
          message: data.data?.message || JSON.stringify(data.data)
        };
        setLogs(prev => [...prev, logEntry].slice(-100));
      }
      
      // Atualizar status do ETL
      if (data.type === 'status' || data.type === 'stats_update') {
        setEtlStatus(data.data || data.stats);
      }
    };

    ws.onerror = (error) => {
      console.error('[ETL] ❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.warn('[ETL] WebSocket fechado. Reconectando em 5s...');
      setTimeout(connectWebSocket, 5000);
    };

    setWsConnection(ws);
  };

  const handleStartETL = async () => {
    try {
      await etlAPI.startETL();
      await loadData();
    } catch (error) {
      console.error('Error starting ETL:', error);
    }
  };

  const handleStopETL = async () => {
    try {
      await etlAPI.stopETL();
      await loadData();
    } catch (error) {
      console.error('Error stopping ETL:', error);
    }
  };

  const handleCheckUpdates = async () => {
    try {
      const response = await etlAPI.checkUpdates();
      alert(response.data.message || 'Verificação concluída!');
    } catch (error) {
      console.error('Error checking updates:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando painel admin...</p>
      </div>
    );
  }

  const isRunning = etlStatus?.is_running || false;
  const stats_data = etlStatus?.stats || {};
  const statusText = isRunning ? 'Em Execução' : (stats_data.status === 'completed' ? 'Concluído' : 'Parado');
  const progress = stats_data.progress || 0;
  const processedRecords = stats_data.total_records || stats_data.imported_records || 0;
  
  // Calcula tempo decorrido se estiver rodando
  let timeElapsed = '0min';
  if (isRunning && stats_data.start_time) {
    try {
      const startTime = new Date(stats_data.start_time);
      const now = new Date();
      const diffMs = now - startTime;
      const diffMins = Math.floor(diffMs / 60000);
      timeElapsed = diffMins > 0 ? `${diffMins}min` : '< 1min';
    } catch (e) {
      console.error('Erro ao calcular tempo:', e);
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Painel do Administrador</h1>
        <p>Controle e monitoramento do sistema</p>
      </div>

      <div className="admin-controls">
        <button 
          className="btn-success" 
          onClick={handleStartETL}
          disabled={isRunning}
        >
          <PlayCircle size={20} />
          Iniciar ETL
        </button>
        <button 
          className="btn-danger" 
          onClick={handleStopETL}
          disabled={!isRunning}
        >
          <StopCircle size={20} />
          Parar ETL
        </button>
        <button className="btn-primary" onClick={handleCheckUpdates}>
          <RefreshCw size={20} />
          Verificar Atualizações
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className={`stat-icon ${isRunning ? 'green' : 'gray'}`}>
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Status do ETL</p>
            <h3 className="stat-value">{statusText}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Download size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Progresso</p>
            <h3 className="stat-value">{progress}%</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Tempo Decorrido</p>
            <h3 className="stat-value">{timeElapsed}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Registros Processados</p>
            <h3 className="stat-value">
              {processedRecords.toLocaleString('pt-BR')}
            </h3>
          </div>
        </div>
      </div>

      {importStats && (
        <div className="stats-section">
          <h2>📊 Estatísticas do Último Processamento</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green">
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Registros Novos</p>
                <h3 className="stat-value">
                  {importStats.new_records?.toLocaleString('pt-BR') || '0'}
                </h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">
                <RefreshCw size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Registros Atualizados</p>
                <h3 className="stat-value">
                  {importStats.updated_records?.toLocaleString('pt-BR') || '0'}
                </h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon gray">
                <AlertCircle size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Sem Mudanças</p>
                <h3 className="stat-value">
                  {importStats.unchanged_records?.toLocaleString('pt-BR') || '0'}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <Activity size={20} />
            <h2>Logs em Tempo Real</h2>
          </div>
          <div className="logs-container">
            {logs.length === 0 ? (
              <p className="no-logs">Nenhum log disponível</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-entry ${log.level}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <Database size={20} />
            <h2>Estatísticas do Sistema</h2>
          </div>
          <div className="system-stats">
            <div className="system-stat-item">
              <CheckCircle2 size={20} className="success" />
              <div>
                <h4>Empresas no Banco</h4>
                <p>{(stats?.total_empresas || 0).toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="system-stat-item">
              <CheckCircle2 size={20} className="success" />
              <div>
                <h4>Estabelecimentos</h4>
                <p>{(stats?.total_estabelecimentos || 0).toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="system-stat-item">
              <CheckCircle2 size={20} className="success" />
              <div>
                <h4>Sócios</h4>
                <p>{(stats?.total_socios || 0).toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="system-stat-item">
              <CheckCircle2 size={20} className="success" />
              <div>
                <h4>CNAEs</h4>
                <p>{(stats?.total_cnaes || 0).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
