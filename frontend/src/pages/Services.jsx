
import { Helmet } from 'react-helmet-async';
import SharedLayout from '../components/SharedLayout';
import { Database, Search, Zap, Filter, BarChart3, Shield } from 'lucide-react';

const Services = () => {
  return (
    <SharedLayout>
      <Helmet>
        <title>Serviços de Consulta CNPJ e Dados Empresariais | DB Empresas</title>
        <meta name="description" content="Conheça nossos serviços de consulta CNPJ: API REST, busca avançada, validação de empresas, QSA completo e análise de dados empresariais da Receita Federal." />
        <meta name="keywords" content="serviços consulta CNPJ, API dados empresas, validação CNPJ, busca empresas Brasil, QSA empresas, análise dados Receita Federal" />
        <link rel="canonical" href="https://dbempresas.com.br/servicos" />
        <meta property="og:title" content="Serviços de Consulta CNPJ - DB Empresas" />
        <meta property="og:description" content="API REST para consulta de CNPJ, busca avançada, validação e análise de dados empresariais." />
        <meta property="og:url" content="https://dbempresas.com.br/servicos" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="page-hero">
        <h1>Nossos Serviços</h1>
        <p>Soluções completas para consulta e análise de dados empresariais</p>
      </div>

      <div className="content-section">
        <h2>O Que Oferecemos</h2>
        <p>
          A DB Empresas fornece uma plataforma completa para acesso aos dados da Receita Federal, 
          com serviços que atendem desde pequenas empresas até grandes corporações.
        </p>

        <div className="features-grid" style={{ marginTop: '60px' }}>
          <div className="feature-card">
            <Database size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Consulta por CNPJ</h3>
            <p>
              Consulte dados completos de qualquer empresa brasileira por CNPJ: razão social, endereço, 
              situação cadastral, CNAE, porte, capital social e muito mais.
            </p>
          </div>

          <div className="feature-card">
            <Search size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Busca Avançada</h3>
            <p>
              Encontre empresas usando 34+ filtros avançados: localização, CNAE, porte, data de abertura, 
              situação cadastral e combine múltiplos critérios.
            </p>
          </div>

          <div className="feature-card">
            <Zap size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>API REST Ultra Rápida</h3>
            <p>
              Integre nossa API em minutos. Resposta em 45ms, documentação completa e exemplos em 
              7 linguagens de programação.
            </p>
          </div>

          <div className="feature-card">
            <Filter size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Consultas em Lote</h3>
            <p>
              Busque milhares de empresas de uma vez com filtros combinados. Ideal para prospecção, 
              análise de mercado e enriquecimento de dados.
            </p>
          </div>

          <div className="feature-card">
            <BarChart3 size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>QSA Completo</h3>
            <p>
              Acesse o Quadro de Sócios e Administradores (QSA) completo de qualquer empresa, 
              com 26,5 milhões de sócios cadastrados.
            </p>
          </div>

          <div className="feature-card">
            <Shield size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Validação de Empresas</h3>
            <p>
              Valide a existência e situação cadastral de empresas em tempo real para compliance, 
              análise de crédito e due diligence.
            </p>
          </div>
        </div>
      </div>

      <div className="content-section" style={{ background: '#f9fafb' }}>
        <h2>Casos de Uso</h2>
        <div style={{ marginTop: '30px' }}>
          <ul style={{ fontSize: '18px', lineHeight: '2', color: '#4b5563' }}>
            <li>🎯 <strong>Prospecção B2B:</strong> Encontre leads qualificados por setor, localização e porte</li>
            <li>💰 <strong>Análise de Crédito:</strong> Valide empresas e acesse dados cadastrais completos</li>
            <li>📊 <strong>Inteligência de Mercado:</strong> Analise concorrentes e oportunidades de negócio</li>
            <li>✅ <strong>Compliance:</strong> Verifique situação cadastral e valide fornecedores</li>
            <li>🚀 <strong>Enriquecimento de CRM:</strong> Complete dados de clientes automaticamente</li>
            <li>📈 <strong>Marketing Digital:</strong> Crie públicos segmentados para campanhas online</li>
          </ul>
        </div>
      </div>
    </SharedLayout>
  );
};

export default Services;
