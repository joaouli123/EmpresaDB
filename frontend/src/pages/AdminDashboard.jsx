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

  useEffect(() => {
    loadData();
    connectWebSocket();

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        etlAPI.getStatus(),
        cnpjAPI.getStats()
      ]);
      setEtlStatus(statusRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/etl`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs(prev => [...prev, data].slice(-100));
      if (data.type === 'status') {
        setEtlStatus(data.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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

  const isRunning = etlStatus?.status === 'running';

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
            <h3 className="stat-value">
              {isRunning ? 'Em Execução' : 'Parado'}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Download size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Progresso</p>
            <h3 className="stat-value">
              {etlStatus?.progress || 0}%
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Tempo Decorrido</p>
            <h3 className="stat-value">
              {etlStatus?.elapsed_time || '0min'}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Database size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Registros Processados</p>
            <h3 className="stat-value">
              {(etlStatus?.processed_records || 0).toLocaleString('pt-BR')}
            </h3>
          </div>
        </div>
      </div>

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
