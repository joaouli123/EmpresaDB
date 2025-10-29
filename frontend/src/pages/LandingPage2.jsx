import { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Zap, 
  Shield, 
  TrendingUp, 
  Check, 
  ChevronRight,
  BarChart3,
  Users,
  Clock,
  Star,
  Building2,
  Store,
  Factory,
  Truck,
  Briefcase,
  ShoppingCart,
  Filter,
  MapPin,
  Calendar,
  FileCheck,
  Code,
  Layers,
  Mail,
  Phone,
  Target,
  Sparkles,
  Brain,
  Menu,
  X,
  Package
} from 'lucide-react';
import { api } from '../services/api';
import '../styles/LandingPage.css';
import '../styles/LandingPageUpdates.css';

const LandingPage2 = () => {
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const [billingPeriod, setBillingPeriod] = useState('mensal');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('varejo');
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [batchPackages, setBatchPackages] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    loadPlans();
    loadBatchPackages();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/api/v1/subscriptions/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      // Fallback: usar planos hardcoded se API falhar
      setPlans([
        {
          id: 1,
          name: 'free',
          display_name: 'Free',
          monthly_queries: 200,
          monthly_batch_queries: 0,
          price_brl: 0,
          rate_limit: 10
        },
        {
          id: 2,
          name: 'start',
          display_name: 'Start',
          monthly_queries: 10000,
          monthly_batch_queries: 500,
          price_brl: 79.90,
          rate_limit: 60
        },
        {
          id: 3,
          name: 'growth',
          display_name: 'Growth',
          monthly_queries: 100000,
          monthly_batch_queries: 2000,
          price_brl: 249.90,
          rate_limit: 300
        },
        {
          id: 4,
          name: 'pro',
          display_name: 'Pro',
          monthly_queries: 500000,
          monthly_batch_queries: 10000,
          price_brl: 799.90,
          rate_limit: 1000
        }
      ]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadBatchPackages = async () => {
    try {
      const response = await api.get('/api/v1/batch/packages');
      setBatchPackages(response.data);
    } catch (error) {
      console.error('Erro ao carregar pacotes de consulta em lote:', error);
      setBatchPackages([]);
    }
  };

  const benefits = [
    {
      icon: <Database size={32} />,
      title: 'Dados Completos da Receita Federal',
      description: 'Acesso a 54M+ empresas cadastradas, dados de estabelecimentos e QSA completo. Base sincronizada mensalmente com a RF'
    },
    {
      icon: <Zap size={32} />,
      title: 'Performance Otimizada',
      description: 'Consultas rápidas com cache Redis nos planos Growth+ e infraestrutura PostgreSQL otimizada'
    },
    {
      icon: <Shield size={32} />,
      title: '100% Seguro e Confiável',
      description: 'Dados oficiais da RF, autenticação JWT por API Key, rate limiting inteligente e conformidade LGPD'
    },
    {
      icon: <Search size={32} />,
      title: 'Consultas Avançadas',
      description: 'Busque empresas por CNPJ, CNAE, UF, município, situação cadastral, razão social, nome fantasia, porte e natureza jurídica'
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Dashboard Completo',
      description: 'Gráficos em tempo real, estatísticas de uso diário/mensal, logs detalhados de todas as consultas'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Exportação de Dados',
      description: 'Exporte resultados em CSV/Excel ou JSON estruturado, pronto para análise e integração'
    }
  ];

  const businessCategories = {
    varejo: {
      id: 'varejo',
      icon: <Store size={48} />,
      title: 'Varejo e Comércio',
      description: 'Encontre lojas, supermercados e pontos de venda em todo Brasil',
      count: '8M+',
      cnaes: [
        { icon: <ShoppingCart size={20} />, nome: 'Supermercados', quantidade: '~1.2M' },
        { icon: <Store size={20} />, nome: 'Lojas de Roupas', quantidade: '~890K' },
        { icon: <ShoppingCart size={20} />, nome: 'Farmácias', quantidade: '~650K' },
        { icon: <Store size={20} />, nome: 'Lojas de Calçados', quantidade: '~520K' },
        { icon: <ShoppingCart size={20} />, nome: 'Lojas de Móveis', quantidade: '~480K' },
        { icon: <Store size={20} />, nome: 'Lojas de Eletrônicos', quantidade: '~410K' },
        { icon: <ShoppingCart size={20} />, nome: 'Padarias', quantidade: '~380K' },
        { icon: <Store size={20} />, nome: 'Lojas de Cosméticos', quantidade: '~340K' },
        { icon: <ShoppingCart size={20} />, nome: 'Pet Shops', quantidade: '~280K' },
        { icon: <Store size={20} />, nome: 'Lojas de Materiais', quantidade: '+2.9M outros setores' }
      ]
    },
    industria: {
      id: 'industria',
      icon: <Factory size={48} />,
      title: 'Indústria',
      description: 'Fabricantes, montadoras e empresas de transformação',
      count: '2M+',
      cnaes: [
        { icon: <Factory size={20} />, nome: 'Ind. Alimentícia', quantidade: '~380K' },
        { icon: <Factory size={20} />, nome: 'Ind. Têxtil', quantidade: '~245K' },
        { icon: <Factory size={20} />, nome: 'Ind. Metalúrgica', quantidade: '~195K' },
        { icon: <Factory size={20} />, nome: 'Ind. Química', quantidade: '~168K' },
        { icon: <Factory size={20} />, nome: 'Ind. Plásticos', quantidade: '~142K' },
        { icon: <Factory size={20} />, nome: 'Ind. Madeira', quantidade: '~128K' },
        { icon: <Factory size={20} />, nome: 'Ind. Papel', quantidade: '~95K' },
        { icon: <Factory size={20} />, nome: 'Ind. Eletrônica', quantidade: '~72K' },
        { icon: <Factory size={20} />, nome: 'Ind. Automobilística', quantidade: '~58K' },
        { icon: <Factory size={20} />, nome: 'Ind. Farmacêutica', quantidade: '+517K outros setores' }
      ]
    },
    servicos: {
      id: 'servicos',
      icon: <Briefcase size={48} />,
      title: 'Serviços',
      description: 'Consultorias, agências, escritórios e prestadores',
      count: '12M+',
      cnaes: [
        { icon: <Briefcase size={20} />, nome: 'Contabilidade', quantidade: '~1.8M' },
        { icon: <Briefcase size={20} />, nome: 'Advocacia', quantidade: '~920K' },
        { icon: <Briefcase size={20} />, nome: 'Marketing', quantidade: '~680K' },
        { icon: <Briefcase size={20} />, nome: 'Consultoria TI', quantidade: '~540K' },
        { icon: <Briefcase size={20} />, nome: 'Arquitetura', quantidade: '~470K' },
        { icon: <Briefcase size={20} />, nome: 'Engenharia', quantidade: '~425K' },
        { icon: <Briefcase size={20} />, nome: 'Design Gráfico', quantidade: '~380K' },
        { icon: <Briefcase size={20} />, nome: 'RH e Recrutamento', quantidade: '~310K' },
        { icon: <Briefcase size={20} />, nome: 'Treinamentos', quantidade: '~275K' },
        { icon: <Briefcase size={20} />, nome: 'Assessoria Empresarial', quantidade: '+6.2M outros setores' }
      ]
    },
    logistica: {
      id: 'logistica',
      icon: <Truck size={48} />,
      title: 'Logística e Transporte',
      description: 'Transportadoras, distribuidoras e empresas de entrega',
      count: '1.5M+',
      cnaes: [
        { icon: <Truck size={20} />, nome: 'Transporte Rodoviário', quantidade: '~285K' },
        { icon: <Truck size={20} />, nome: 'Entregas Expressas', quantidade: '~195K' },
        { icon: <Truck size={20} />, nome: 'Armazenamento', quantidade: '~148K' },
        { icon: <Truck size={20} />, nome: 'Transporte de Cargas', quantidade: '~132K' },
        { icon: <Truck size={20} />, nome: 'Logística', quantidade: '~115K' },
        { icon: <Truck size={20} />, nome: 'Distribuição', quantidade: '~92K' },
        { icon: <Truck size={20} />, nome: 'Transporte Internacional', quantidade: '~76K' },
        { icon: <Truck size={20} />, nome: 'Serviços Postais', quantidade: '~58K' },
        { icon: <Truck size={20} />, nome: 'Transporte Urbano', quantidade: '~47K' },
        { icon: <Truck size={20} />, nome: 'Fretes', quantidade: '+352K outros setores' }
      ]
    },
    construcao: {
      id: 'construcao',
      icon: <Building2 size={48} />,
      title: 'Construção Civil',
      description: 'Construtoras, incorporadoras e empresas de engenharia',
      count: '900K+',
      cnaes: [
        { icon: <Building2 size={20} />, nome: 'Construtoras', quantidade: '~165K' },
        { icon: <Building2 size={20} />, nome: 'Incorporação', quantidade: '~128K' },
        { icon: <Building2 size={20} />, nome: 'Reformas', quantidade: '~95K' },
        { icon: <Building2 size={20} />, nome: 'Pintura', quantidade: '~82K' },
        { icon: <Building2 size={20} />, nome: 'Instalações Elétricas', quantidade: '~74K' },
        { icon: <Building2 size={20} />, nome: 'Instalações Hidráulicas', quantidade: '~68K' },
        { icon: <Building2 size={20} />, nome: 'Terraplenagem', quantidade: '~52K' },
        { icon: <Building2 size={20} />, nome: 'Alvenaria', quantidade: '~45K' },
        { icon: <Building2 size={20} />, nome: 'Demolição', quantidade: '~38K' },
        { icon: <Building2 size={20} />, nome: 'Pavimentação', quantidade: '+153K outros setores' }
      ]
    },
    ecommerce: {
      id: 'ecommerce',
      icon: <ShoppingCart size={48} />,
      title: 'E-commerce',
      description: 'Lojas virtuais e marketplaces em todo território nacional',
      count: '1.2M+',
      cnaes: [
        { icon: <ShoppingCart size={20} />, nome: 'Comércio Eletrônico', quantidade: '~320K' },
        { icon: <ShoppingCart size={20} />, nome: 'Marketplace', quantidade: '~185K' },
        { icon: <ShoppingCart size={20} />, nome: 'Dropshipping', quantidade: '~140K' },
        { icon: <ShoppingCart size={20} />, nome: 'Loja Virtual de Roupas', quantidade: '~95K' },
        { icon: <ShoppingCart size={20} />, nome: 'E-commerce Alimentício', quantidade: '~78K' },
        { icon: <ShoppingCart size={20} />, nome: 'Vendas Online', quantidade: '~67K' },
        { icon: <ShoppingCart size={20} />, nome: 'Infoprodutos', quantidade: '~52K' },
        { icon: <ShoppingCart size={20} />, nome: 'Assinaturas Online', quantidade: '~43K' },
        { icon: <ShoppingCart size={20} />, nome: 'Plataforma Digital', quantidade: '~38K' },
        { icon: <ShoppingCart size={20} />, nome: 'E-commerce B2B', quantidade: '+182K outros setores' }
      ]
    }
  };

  const advancedFilters = [
    {
      icon: <MapPin size={24} />,
      title: 'Localização',
      description: 'Estado (UF) e município da empresa'
    },
    {
      icon: <Filter size={24} />,
      title: 'CNAE',
      description: 'Atividade econômica principal e secundárias'
    },
    {
      icon: <Calendar size={24} />,
      title: 'Data de Abertura',
      description: 'Data de constituição da empresa'
    },
    {
      icon: <FileCheck size={24} />,
      title: 'Situação Cadastral',
      description: 'Ativa, baixada, suspensa, nula ou inapta'
    },
    {
      icon: <Building2 size={24} />,
      title: 'Razão Social e Nome Fantasia',
      description: 'Nome completo e nome de fantasia'
    },
    {
      icon: <Users size={24} />,
      title: 'E mais 26+ Campos',
      description: 'Capital social, porte, endereço completo, QSA, regime tributário e muito mais'
    }
  ];

  const integrationFeatures = [
    {
      icon: <Code size={32} />,
      title: 'API RESTful Simples',
      description: 'Documentação completa com exemplos em Python, JavaScript, PHP e cURL. Integre em minutos'
    },
    {
      icon: <Zap size={32} />,
      title: 'Resposta em 45ms',
      description: 'Cache Redis nos planos Growth+ e Pro garante respostas ultra-rápidas e alta disponibilidade'
    },
    {
      icon: <Layers size={32} />,
      title: 'JSON Estruturado',
      description: 'Dados padronizados da RF prontos para consumo. Empresa, estabelecimentos, QSA e CNAEs secundários'
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'CEO, TechStart Consultoria',
      avatar: 'CS',
      rating: 5,
      text: 'Antes gastávamos horas pesquisando manualmente dados de empresas. Com a API, conseguimos automatizar todo o processo de prospecção e validar leads em segundos. Valeu cada centavo!'
    },
    {
      name: 'Marina Costa',
      role: 'Analista de Compliance, Banco Regional',
      avatar: 'MC',
      rating: 5,
      text: 'Para fazer due diligence essa API é essencial. Os dados do QSA são completos e atualizados, o que nos dá segurança nas análises de crédito e onboarding de clientes.'
    },
    {
      name: 'Roberto Almeida',
      role: 'Desenvolvedor Full Stack',
      avatar: 'RA',
      rating: 5,
      text: 'Integrei a API no nosso sistema em menos de 1 hora. A documentação é clara, os endpoints são intuitivos e o suporte respondeu minhas dúvidas super rápido. Recomendo demais!'
    },
    {
      name: 'Juliana Mendes',
      role: 'Gerente de Marketing, AgênciaPro',
      avatar: 'JM',
      rating: 5,
      text: 'Usamos para segmentar campanhas B2B por setor e região. A qualidade dos dados de CNAE e localização nos ajudou a reduzir custo de aquisição em 40%. Resultado incrível!'
    },
    {
      name: 'Pedro Oliveira',
      role: 'Founder, StartupHub',
      avatar: 'PO',
      rating: 5,
      text: 'Como startup, precisávamos de algo acessível e confiável. O plano Growth tem um custo-benefício excelente e já validamos mais de 50 mil leads. Super satisfeito!'
    },
    {
      name: 'Fernanda Santos',
      role: 'Analista de Dados, LogísticaExpress',
      avatar: 'FS',
      rating: 5,
      text: 'A exportação em CSV facilitou muito nossas análises. Cruzamos dados de empresas com nosso CRM e identificamos oportunidades que estavam invisíveis. Ferramenta poderosa!'
    },
    {
      name: 'Lucas Ferreira',
      role: 'Head de Vendas, SolutionTech',
      avatar: 'LF',
      rating: 5,
      text: 'Nosso time de SDRs usa diariamente para qualificar prospects. Ter acesso ao porte da empresa, faturamento e sócios na hora do cold call aumentou nossa taxa de conversão.'
    },
    {
      name: 'Beatriz Rocha',
      role: 'Contadora, Contábil Moderna',
      avatar: 'BR',
      rating: 5,
      text: 'Simplesmente perfeito para validar CNPJs de clientes novos. Consigo verificar situação cadastral, endereço e atividades em segundos. Economizo muito tempo no dia a dia.'
    },
    {
      name: 'Ricardo Gomes',
      role: 'CTO, FinTech Inovadora',
      avatar: 'RG',
      rating: 5,
      text: 'Performance impecável! Mesmo com milhares de consultas por dia, a API se mantém estável e rápida. O cache Redis faz diferença real. Infraestrutura de primeiro mundo.'
    },
    {
      name: 'Camila Andrade',
      role: 'Analista Jurídico, Advocacia & Cia',
      avatar: 'CA',
      rating: 5,
      text: 'Essencial para nossas pesquisas societárias. O QSA completo com CPF dos sócios nos economiza idas ao cartório. Já pagou o investimento só no primeiro mês de uso!'
    }
  ];

  return (
    <div className="landing-page">
      {/* Floating Navbar */}
      <nav className="floating-navbar">
        <div className="navbar-content">
          <div className="navbar-logo">
            <Database size={28} />
            <span>CNPJ API</span>
          </div>

          {/* Links de navegação (visível no desktop) */}
          <div className="navbar-links">
            <a href="#features">Funcionalidades</a>
            <a href="#categories">Setores</a>
            <a href="#pricing">Planos</a>
            <a href="#testimonials">Depoimentos</a>
            <a href="#contact">Contato</a>
          </div>

          {/* Ações (visível no desktop) */}
          <div className="navbar-actions">
            <a href="/login">
              <button className="btn-navbar-secondary">Entrar</button>
            </a>
            <a href="#pricing">
              <button className="btn-navbar-primary">Começar Grátis</button>
            </a>
          </div>

          {/* Botão hamburguer (visível no mobile) */}
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Menu Mobile */}
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-links">
            <a href="#features" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>Setores</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Planos</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>Depoimentos</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contato</a>
          </div>

          <div className="mobile-menu-actions">
            <a href="/login" onClick={() => setMenuOpen(false)}>
              <button className="btn-navbar-secondary">Entrar</button>
            </a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>
              <button className="btn-navbar-primary">Começar Grátis</button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={16} />
            <span>Mais de 500 empresas já confiam na nossa API</span>
          </div>

          <h1 className="hero-title">
            Acesso Instantâneo a 54 Milhões de Empresas
            <br />
            <span className="gradient-text">Dados 100% Oficiais e Atualizados</span>
          </h1>

          <p className="hero-description">
            Pare de perder horas pesquisando dados de empresas manualmente. 
            Consulte CNPJ, QSA completo e estabelecimentos em segundos com nossa API REST. 
            Integração em minutos, dados da Receita Federal e performance supersônica.
          </p>

          <div className="hero-cta">
            <a href="#pricing">
              <button className="btn-primary-large btn-hero-primary">
                Comece Agora Gratuitamente
                <ChevronRight size={20} />
              </button>
            </a>
            <a href="#features">
              <button className="btn-secondary-large btn-hero-secondary">
                Ver Como Funciona
              </button>
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">54M+</div>
              <div className="stat-label">Empresas</div>
            </div>
            <div className="stat">
              <div className="stat-number">100%</div>
              <div className="stat-label">Dados Oficiais RF</div>
            </div>
            <div className="stat">
              <div className="stat-number">33+</div>
              <div className="stat-label">Campos de Dados</div>
            </div>
            <div className="stat">
              <div className="stat-number">API</div>
              <div className="stat-label">REST Simples</div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Categories Section - Com Tabs */}
      <section id="categories" className="categories-section">
        <div className="section-header">
          <h2>Dados de Todos os Setores</h2>
          <p>Explore os principais CNAEs de cada categoria e consulte milhões de empresas</p>
        </div>

        <div className="categories-tabs-container">
          <div className="tabs-header">
            {Object.values(businessCategories).map((category) => (
              <button
                key={category.id}
                className={`tab-button ${activeTab === category.id ? 'active' : ''}`}
                onClick={() => setActiveTab(category.id)}
              >
                <span className="tab-icon">{category.icon}</span>
                <span className="tab-label">{category.title}</span>
              </button>
            ))}
          </div>

          <div className="tab-content">
            {Object.values(businessCategories).map((category) => (
              <div
                key={category.id}
                className={`tab-panel ${activeTab === category.id ? 'active' : ''}`}
              >
                <div className="tab-panel-header">
                  <div className="category-icon-large">{category.icon}</div>
                  <div className="category-info">
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                    <div className="category-count">{category.count} empresas</div>
                  </div>
                </div>

                <div className="cnaes-grid">
                  {category.cnaes.slice(0, -1).map((cnae, index) => (
                    <div key={index} className="cnae-card">
                      <div className="cnae-icon">{cnae.icon}</div>
                      <div className="cnae-info">
                        <div className="cnae-nome">{cnae.nome}</div>
                        <div className="cnae-codigo">{cnae.quantidade} empresas</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="outros-setores-info">
                  <div className="outros-setores-content">
                    <div className="outros-icon">
                      <Database size={28} />
                    </div>
                    <div className="outros-text">
                      <h4>E isso é só o começo!</h4>
                      <p>
                        Além dos exemplos acima, nossa base conta com <strong>milhões de empresas</strong> em diversos outros setores. Esta é apenas uma amostra dos principais CNAEs disponíveis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Filters Section */}
      <section id="filters" className="benefits-section filters-section">
        <div className="section-header">
          <h2>Dados Detalhados Disponíveis</h2>
          <p>Acesse informações completas sobre qualquer empresa através da nossa API</p>
        </div>

        <div className="benefits-grid">
          {advancedFilters.map((filter, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">{filter.icon}</div>
              <h3>{filter.title}</h3>
              <p>{filter.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: 'var(--gray)', fontSize: '18px', marginBottom: '24px' }}>
            <strong>Todos os dados</strong> que você precisa em uma única consulta
          </p>
          <button className="btn-primary-large">
            Ver Documentação Completa
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Integration Section */}
      <section className="benefits-section integration-section">
        <div className="section-header">
          <h2>Integração Rápida e Fácil</h2>
          <p>API REST otimizada e simples de usar. Comece a consultar dados em minutos, não em dias</p>
        </div>

        <div className="benefits-grid">
          {integrationFeatures.map((feature, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="info-card" style={{ marginTop: '60px', marginBottom: '60px', background: '#1f2937', color: 'white', padding: '40px', borderRadius: '16px' }}>
          <h3 style={{ color: 'white', marginBottom: '24px', marginTop: '0' }}>Exemplo de Consulta por CNPJ</h3>
          <pre style={{ background: '#111827', padding: '24px', borderRadius: '8px', overflow: 'auto', fontSize: '14px' }}>
{`GET /api/v1/empresas?cnpj=00000000000191

{
  "cnpj": "00000000000191",
  "razao_social": "BANCO DO BRASIL S.A.",
  "nome_fantasia": "BANCO DO BRASIL",
  "situacao_cadastral": "ATIVA",
  "data_abertura": "1966-04-19",
  "cnae_principal": "6422-1/00",
  "porte": "DEMAIS",
  "endereco": {
    "municipio": "BRASILIA",
    "uf": "DF",
    ...
  },
  "capital_social": 103000000000.00,
  "qsa": [...],
  "cnaes_secundarios": [...],
  ...
}`}
          </pre>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{ marginBottom: '20px', color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>
              Documentação completa com exemplos em Python, JavaScript, PHP, Java e mais
            </p>
            <a href="#pricing">
              <button className="btn-primary-large" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1f2937' }}>
                Criar Conta para Acessar Documentação
                <ChevronRight size={20} />
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="benefits-section">
        <div className="section-header">
          <h2>Por Que Escolher Nossa Plataforma?</h2>
          <p>Tudo que você precisa para acessar dados empresariais de forma profissional</p>
        </div>

        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon">{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ 
            background: 'white', 
            padding: '32px', 
            borderRadius: '12px',
            maxWidth: '700px',
            margin: '0 auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <Clock size={48} style={{ color: 'var(--primary)', margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: '12px', color: 'var(--dark)' }}>Dados Totalmente Atualizados</h3>
            <p style={{ color: 'var(--gray)', fontSize: '16px', lineHeight: '1.6' }}>
              Nossa base é sincronizada <strong>mensalmente</strong> com a Receita Federal, garantindo que você sempre tenha 
              acesso às informações mais recentes sobre empresas brasileiras conforme disponibilizado pela RF.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <h2>Planos Que Cabem no Seu Bolso</h2>
          <p>Escolha o plano ideal para seu negócio. Sem taxas escondidas, cancele quando quiser</p>
        </div>

        <div className="billing-toggle">
          <button 
            className={`billing-option ${billingPeriod === 'mensal' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('mensal')}
          >
            Mensal
          </button>
          <button 
            className={`billing-option ${billingPeriod === 'anual' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('anual')}
          >
            Anual
            <span className="discount-badge">Economize 17%</span>
          </button>
        </div>

        {loadingPlans ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: 'var(--gray)' }}>Carregando planos...</p>
          </div>
        ) : (
          <div className="pricing-grid">
            {plans.map((plan) => {
              const isPopular = plan.name === 'growth';
              const priceMonthly = plan.price_brl;
              const priceYearly = plan.price_brl * 12 * 0.83;
              const displayPrice = billingPeriod === 'mensal' ? priceMonthly : priceYearly;

              return (
                <div 
                  key={plan.id} 
                  className={`pricing-card ${isPopular ? 'popular' : ''} ${selectedPlan === plan.name ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  {isPopular && <div className="popular-badge">Mais Popular</div>}

                  <div className="plan-header">
                    <h3>{plan.display_name}</h3>
                    <p className="plan-description">
                      {plan.name === 'free' && 'Ideal para testar a plataforma'}
                      {plan.name === 'start' && 'Perfeito para começar'}
                      {plan.name === 'growth' && 'Para empresas em crescimento'}
                    </p>
                  </div>

                  <div className="plan-price">
                    <span className="currency">R$</span>
                    <span className="amount">
                      {displayPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="period">
                      {billingPeriod === 'mensal' ? '/mês' : '/ano'}
                    </span>
                  </div>

                  {billingPeriod === 'anual' && priceMonthly > 0 && (
                    <div style={{ 
                      fontSize: '14px', 
                      color: 'var(--primary)', 
                      fontWeight: '600',
                      marginBottom: '12px',
                      textAlign: 'center'
                    }}>
                      R$ {(priceYearly / 12).toFixed(2).replace('.', ',')} /mês
                    </div>
                  )}

                  <div className="plan-queries">
                    <strong>{plan.monthly_queries.toLocaleString('pt-BR')}</strong> consultas/mês
                  </div>

                  {plan.monthly_batch_queries > 0 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: '#fff',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                    }}>
                      ⚡ {plan.monthly_batch_queries.toLocaleString('pt-BR')} consultas em lote/mês
                    </div>
                  )}

                  <ul className="plan-features">
                    <li>
                      <Check size={18} />
                      {plan.monthly_queries.toLocaleString('pt-BR')} consultas/mês
                    </li>
                    
                    <li>
                      <Check size={18} />
                      {plan.name === 'free' && '50 consultas em lote/mês'}
                      {plan.name === 'start' && '500 consultas em lote/mês'}
                      {plan.name === 'growth' && '2.000 consultas em lote/mês'}
                      {plan.name === 'pro' && '10.000 consultas em lote/mês'}
                    </li>
                    
                    <li>
                      <Check size={18} />
                      +45 filtros avançados
                    </li>
                    
                    {plan.name !== 'free' && (
                      <li>
                        <Check size={18} />
                        <span style={{ color: '#10b981', fontWeight: '600' }}>
                          ✨ Créditos batch nunca expiram
                        </span>
                      </li>
                    )}
                    
                    <li>
                      <Check size={18} />
                      Consulta completa por CNPJ
                    </li>
                    <li>
                      <Check size={18} />
                      Dados completos da empresa
                    </li>
                    <li>
                      <Check size={18} />
                      QSA e CNAEs secundários
                    </li>
                    {plan.name !== 'free' && (
                      <li>
                        <Check size={18} />
                        Dashboard com estatísticas
                      </li>
                    )}
                    <li>
                      <Check size={18} />
                      Documentação da API
                    </li>
                    {plan.name === 'free' && (
                      <li>
                        <Check size={18} />
                        Suporte por email
                      </li>
                    )}
                    {plan.name === 'start' && (
                      <>
                        <li>
                          <Check size={18} />
                          Suporte por email
                        </li>
                        <li>
                          <Check size={18} />
                          Rate limit: 60 req/min
                        </li>
                      </>
                    )}
                    {plan.name === 'growth' && (
                      <>
                        <li>
                          <Check size={18} />
                          Cache Redis para performance
                        </li>
                        <li>
                          <Check size={18} />
                          Suporte via WhatsApp
                        </li>
                        <li>
                          <Check size={18} />
                          Rate limit: 300 req/min
                        </li>
                      </>
                    )}
                  </ul>

                  <a href="/pricing">
                    <button className={`btn-plan ${isPopular ? 'btn-primary-large' : 'btn-secondary-large'}`}>
                      {plan.price_brl === 0 ? 'Começar Grátis' : `Assinar ${plan.display_name}`}
                    </button>
                  </a>
                </div>
              );
            })}
          </div>
        )}

        <div className="enterprise-card" style={{
          marginTop: '60px',
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          borderRadius: '24px',
          padding: '48px',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'grid\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 100 0 L 0 0 0 100\' fill=\'none\' stroke=\'rgba(255,255,255,0.05)\' stroke-width=\'1\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23grid)\'/%3E%3C/svg%3E")',
            opacity: 0.3
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '16px', color: 'white' }}>
              Enterprise
            </h3>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
              Solução personalizada para grandes volumes e necessidades específicas
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', maxWidth: '800px', margin: '0 auto 40px' }}>
              <div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Consultas</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>Ilimitadas*</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Rate Limit</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>Customizado</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Suporte</div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>Prioritário</div>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto 40px', maxWidth: '600px', textAlign: 'left' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', color: 'rgba(255,255,255,0.9)' }}>
                <Check size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                SLA garantido com uptime de 99.9%
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', color: 'rgba(255,255,255,0.9)' }}>
                <Check size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                Gerente de conta dedicado
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', color: 'rgba(255,255,255,0.9)' }}>
                <Check size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                Infraestrutura dedicada disponível
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', color: 'rgba(255,255,255,0.9)' }}>
                <Check size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                Integração e onboarding personalizados
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', color: 'rgba(255,255,255,0.9)' }}>
                <Check size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                Relatórios e analytics customizados
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', color: 'rgba(255,255,255,0.9)' }}>
                <Check size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                Desenvolvimento de features sob demanda
              </li>
            </ul>
            <button 
              onClick={() => window.location.href = '#contact'}
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#1f2937',
                border: 'none',
                padding: '16px 48px',
                fontSize: '18px',
                fontWeight: '700',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(251, 191, 36, 0.3)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 32px rgba(251, 191, 36, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 24px rgba(251, 191, 36, 0.3)';
              }}
            >
              Falar com Especialista
            </button>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '16px' }}>
              * Sujeito a fair use policy
            </p>
          </div>
        </div>
      </section>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2>O Que Nossos Clientes Dizem</h2>
          <p>Mais de 500 empresas confiam em nossa plataforma todos os dias</p>
        </div>

        <div className="testimonials-carousel-wrapper">
          <div className="testimonials-carousel">
            <div className="testimonials-carousel-grid">
              {(() => {
                const itemsToShow = window.innerWidth <= 640 ? 1 : window.innerWidth <= 991 ? 2 : 3;
                return testimonials.slice(currentTestimonial, currentTestimonial + itemsToShow).map((testimonial, index) => (
                  <div key={index} className="testimonial-card">
                    <div className="stars">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                    <p className="testimonial-text">"{testimonial.text}"</p>
                    <div className="testimonial-author">
                      <div className="author-avatar">{testimonial.avatar}</div>
                      <div className="author-info">
                        <div className="author-name">{testimonial.name}</div>
                        <div className="author-role">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Botões de Navegação */}
          <button
            className="carousel-nav-button prev"
            onClick={() => {
              const itemsToShow = window.innerWidth <= 640 ? 1 : window.innerWidth <= 991 ? 2 : 3;
              setCurrentTestimonial(prev => prev > 0 ? prev - 1 : testimonials.length - itemsToShow);
            }}
          >
            <ChevronRight size={24} style={{ transform: 'rotate(180deg)', color: '#3b82f6' }} />
          </button>

          <button
            className="carousel-nav-button next"
            onClick={() => {
              const itemsToShow = window.innerWidth <= 640 ? 1 : window.innerWidth <= 991 ? 2 : 3;
              setCurrentTestimonial(prev => prev < testimonials.length - itemsToShow ? prev + 1 : 0);
            }}
          >
            <ChevronRight size={24} style={{ color: '#3b82f6' }} />
          </button>

          {/* Indicadores */}
          <div className="carousel-indicators">
            {(() => {
              const itemsToShow = window.innerWidth <= 640 ? 1 : window.innerWidth <= 991 ? 2 : 3;
              return Array.from({ length: testimonials.length - itemsToShow + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`carousel-indicator ${currentTestimonial === index ? 'active' : ''}`}
                />
              ));
            })()}
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Pronto Para Começar?</h2>
          <p>Junte-se a centenas de empresas que já utilizam nossa plataforma</p>
          <a href="#pricing">
            <button className="btn-primary-large btn-cta-primary">
              Criar Conta Grátis
              <ChevronRight size={20} />
            </button>
          </a>
          <p className="cta-note">Sem cartão de crédito necessário • Cancele quando quiser • Dados 100% atualizados</p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-wrapper">
          <div className="section-header">
            <h2>Entre em Contato</h2>
            <p>Tem dúvidas? Nossa equipe está pronta para ajudar</p>
          </div>

          <div className="contact-compact-grid">
            <div className="contact-info-cards">
              <div className="contact-info-item">
                <Mail size={20} />
                <div>
                  <strong>Email</strong>
                  <p>contato@cnpjapi.com.br</p>
                </div>
              </div>

              <div className="contact-info-item">
                <Phone size={20} />
                <div>
                  <strong>Telefone</strong>
                  <p>(11) 9 9999-9999</p>
                </div>
              </div>

              <div className="contact-info-item">
                <Clock size={20} />
                <div>
                  <strong>Horário</strong>
                  <p>Seg - Sex: 9h às 18h</p>
                </div>
              </div>
            </div>

            <form className="contact-form-compact">
              <div className="form-row">
                <input type="text" placeholder="Seu nome completo" required />
                <input type="email" placeholder="seu@email.com" required />
              </div>

              <div className="form-row">
                <input type="tel" placeholder="(11) 99999-9999" />
                <input type="text" placeholder="Nome da empresa" />
              </div>

              <select required>
                <option value="">Selecione um assunto</option>
                <option value="duvidas">Dúvidas sobre Planos</option>
                <option value="tecnico">Suporte Técnico</option>
                <option value="comercial">Proposta Comercial</option>
                <option value="outro">Outro</option>
              </select>

              <textarea rows="3" placeholder="Como podemos ajudar?" required></textarea>

              <button type="submit" className="btn-primary-large">
                Enviar Mensagem
                <ChevronRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <Database size={32} />
              <h3>CNPJ API</h3>
            </div>
            <p>Acesso completo aos dados empresariais da Receita Federal. Consultas rápidas, precisas e atualizadas.</p>
            <div className="social-links">
              <a href="#" aria-label="LinkedIn"><Users size={20} /></a>
              <a href="#" aria-label="Twitter"><Users size={20} /></a>
              <a href="#" aria-label="Instagram"><Users size={20} /></a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Produto</h4>
            <ul>
              <li><a href="#features">Funcionalidades</a></li>
              <li><a href="#pricing">Planos e Preços</a></li>
              <li><a href="#api">Documentação API</a></li>
              <li><a href="#updates">Atualizações</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Empresa</h4>
            <ul>
              <li><a href="#about">Sobre Nós</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#careers">Carreiras</a></li>
              <li><a href="#contact">Contato</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Suporte</h4>
            <ul>
              <li><a href="#help">Central de Ajuda</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#status">Status do Sistema</a></li>
              <li><a href="#terms">Termos de Uso</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Política de Privacidade</a></li>
              <li><a href="#terms">Termos de Serviço</a></li>
              <li><a href="#lgpd">LGPD</a></li>
              <li><a href="#cookies">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 CNPJ API. Todos os direitos reservados.</p>
          <p>Dados oficiais da Receita Federal do Brasil</p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20a%20API%20de%20CNPJ" 
        className="whatsapp-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contato via WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
};

export default LandingPage2;