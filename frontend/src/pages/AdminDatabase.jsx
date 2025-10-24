import { useState, useEffect } from 'react';
import { cnpjAPI, etlAPI } from '../services/api';
import { Database, RefreshCw, HardDrive, Table, AlertCircle } from 'lucide-react';

const AdminDatabase = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await cnpjAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading database stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando estatísticas do banco de dados...</p>
      </div>
    );
  }

  const tables = [
    { name: 'empresas', label: 'Empresas', count: stats?.total_empresas || 0 },
    { name: 'estabelecimentos', label: 'Estabelecimentos', count: stats?.total_estabelecimentos || 0 },
    { name: 'socios', label: 'Sócios', count: stats?.total_socios || 0 },
    { name: 'cnaes', label: 'CNAEs', count: stats?.total_cnaes || 0 },
    { name: 'municipios', label: 'Municípios', count: stats?.total_municipios || 0 },
    { name: 'simples_nacional', label: 'Simples Nacional', count: stats?.total_simples || 0 },
  ];

  const totalRecords = tables.reduce((sum, table) => sum + table.count, 0);

  return (
    <div className="admin-database">
      <div className="page-header">
        <div>
          <h1>Banco de Dados</h1>
          <p>Estatísticas e informações do banco de dados</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={20} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Database size={28} />
          </div>
          <div>
            <p className="stat-label">Total de Registros</p>
            <p className="stat-value">{totalRecords.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Table size={28} />
          </div>
          <div>
            <p className="stat-label">Tabelas Ativas</p>
            <p className="stat-value">{tables.filter(t => t.count > 0).length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <HardDrive size={28} />
          </div>
          <div>
            <p className="stat-label">Status do Banco</p>
            <p className="stat-value">Operacional</p>
          </div>
        </div>
      </div>

      <div className="database-tables">
        <h2>Tabelas do Sistema</h2>
        
        {totalRecords === 0 && (
          <div className="alert alert-warning" style={{ 
            background: '#fff3cd', 
            color: '#856404', 
            borderLeft: '4px solid #ffc107' 
          }}>
            <AlertCircle size={20} />
            <div>
              <strong>Banco de Dados Vazio</strong>
              <p>Nenhum dado foi importado ainda. Execute o processo ETL para importar os dados da Receita Federal.</p>
            </div>
          </div>
        )}

        <div className="tables-list">
          {tables.map((table) => (
            <div key={table.name} className="table-card">
              <div className="table-header">
                <div className="table-icon">
                  <Table size={24} />
                </div>
                <div className="table-info">
                  <h3>{table.label}</h3>
                  <p className="table-name">Tabela: {table.name}</p>
                </div>
              </div>
              <div className="table-stats">
                <div className="table-stat">
                  <p className="label">Total de Registros</p>
                  <p className="value">{table.count.toLocaleString('pt-BR')}</p>
                </div>
                <div className="table-stat">
                  <p className="label">Status</p>
                  <p className={`value ${table.count > 0 ? 'status-active' : 'status-empty'}`}>
                    {table.count > 0 ? 'Com Dados' : 'Vazio'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-card">
        <h3>Sobre o Banco de Dados</h3>
        <p>
          O sistema utiliza PostgreSQL para armazenar todos os dados públicos da Receita Federal.
          As tabelas são organizadas para otimizar consultas e garantir a integridade dos dados.
        </p>
        <p>
          <strong>Tabelas Principais:</strong> Empresas, Estabelecimentos e Sócios
        </p>
        <p>
          <strong>Tabelas Auxiliares:</strong> CNAEs, Municípios, Simples Nacional
        </p>
      </div>
    </div>
  );
};

export default AdminDatabase;
