
import { Helmet } from 'react-helmet-async';
import SharedLayout from '../components/SharedLayout';
import { TrendingUp, Users, ShoppingCart, Building2, BarChart3, Target } from 'lucide-react';

const UseCases = () => {
  return (
    <SharedLayout>
      <Helmet>
        <title>Casos de Uso API CNPJ - Prospecção, Marketing, Compliance | DB Empresas</title>
        <meta name="description" content="Descubra como usar nossa API de CNPJ para prospecção B2B, marketing digital, análise de crédito, compliance, enriquecimento de CRM e inteligência de mercado." />
        <meta name="keywords" content="casos de uso CNPJ, prospecção B2B, marketing dados empresas, compliance CNPJ, análise crédito empresas, CRM enriquecimento" />
        <link rel="canonical" href="https://dbempresas.com.br/casos-de-uso" />
      </Helmet>

      <div className="page-hero">
        <h1>Casos de Uso</h1>
        <p>Descubra como empresas usam nossa plataforma para impulsionar seus resultados</p>
      </div>

      <div className="content-section">
        <div className="features-grid">
          <div className="feature-card">
            <Target size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Prospecção B2B</h3>
            <p>
              Encontre leads qualificados usando filtros avançados por setor (CNAE), localização, porte e 
              data de abertura. Ideal para equipes comerciais e agências de marketing.
            </p>
          </div>

          <div className="feature-card">
            <ShoppingCart size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Marketing Digital</h3>
            <p>
              Crie públicos lookalike no Meta Ads e Google Ads com listas segmentadas de empresas. 
              Melhore seu CPL e taxa de conversão.
            </p>
          </div>

          <div className="feature-card">
            <BarChart3 size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Análise de Crédito</h3>
            <p>
              Valide empresas em tempo real, verifique situação cadastral, QSA e dados cadastrais 
              para análise de risco e concessão de crédito.
            </p>
          </div>

          <div className="feature-card">
            <Building2 size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Compliance e Due Diligence</h3>
            <p>
              Verifique fornecedores, parceiros e clientes. Acesse dados oficiais da Receita Federal 
              para processos de compliance e auditoria.
            </p>
          </div>

          <div className="feature-card">
            <Users size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Enriquecimento de CRM</h3>
            <p>
              Complete automaticamente os dados de clientes no seu CRM. Obtenha razão social, endereço, 
              CNAE, porte e outras informações em tempo real.
            </p>
          </div>

          <div className="feature-card">
            <TrendingUp size={48} color="#3b82f6" style={{ marginBottom: '16px' }} />
            <h3>Inteligência de Mercado</h3>
            <p>
              Analise concorrentes, identifique oportunidades de mercado e faça estudos setoriais 
              com dados atualizados de milhões de empresas.
            </p>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default UseCases;
