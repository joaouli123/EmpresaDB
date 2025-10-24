
import { useState } from 'react';
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
  X
} from 'lucide-react';
import '../styles/LandingPage.css';
import '../styles/LandingPageUpdates.css';

const LandingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('profissional');
  const [billingPeriod, setBillingPeriod] = useState('mensal'); // 'mensal' ou 'anual'
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('varejo');
  const [menuOpen, setMenuOpen] = useState(false);

  const plans = [
    {
      id: 'basico',
      name: 'Básico',
      priceMonthly: '59,90',
      priceYearly: '503,16', // 59.90 * 12 * 0.7 = 503.16
      queries: '300',
      description: 'Ideal para pequenos negócios',
      features: [
        '300 consultas mensais',
        'Acesso API completo',
        'Dados atualizados',
        'Suporte por email',
        'Dashboard básico'
      ],
      popular: false
    },
    {
      id: 'profissional',
      name: 'Profissional',
      priceMonthly: '89,90',
      priceYearly: '755,16', // 89.90 * 12 * 0.7 = 755.16
      queries: '500',
      description: 'Para empresas em crescimento',
      features: [
        '500 consultas mensais',
        'Acesso API completo',
        'Dados atualizados diariamente',
        'Suporte prioritário',
        'Dashboard avançado',
        'Exportação em Excel/CSV',
        'Filtros personalizados'
      ],
      popular: true
    },
    {
      id: 'empresarial',
      name: 'Empresarial',
      priceMonthly: '149,00',
      priceYearly: '1.252,80', // 149.00 * 12 * 0.7 = 1252.80
      queries: '1.000',
      description: 'Solução corporativa completa',
      features: [
        '1.000 consultas mensais',
        'Acesso API ilimitado',
        'Dados em tempo real',
        'Suporte 24/7',
        'Dashboard personalizado',
        'Exportação ilimitada',
        'Webhooks e integrações',
        'Relatórios customizados'
      ],
      popular: false
    }
  ];

  const addons = [
    { queries: '+200', price: '49,90' },
    { queries: '+400', price: '69,90' }
  ];

  const benefits = [
    {
      icon: <Database size={32} />,
      title: 'Dados Completos da Receita Federal',
      description: 'Acesso a milhões de empresas, estabelecimentos, sócios e CNPJs atualizados em tempo real'
    },
    {
      icon: <Zap size={32} />,
      title: 'API Ultra Rápida',
      description: 'Consultas em milissegundos com nossa infraestrutura otimizada e cache inteligente'
    },
    {
      icon: <Shield size={32} />,
      title: '100% Seguro e Confiável',
      description: 'Dados oficiais da Receita Federal com total segurança, privacidade e conformidade LGPD'
    },
    {
      icon: <Search size={32} />,
      title: 'Busca Avançada',
      description: 'Filtros por CNAE, localização, porte, situação cadastral, faturamento e muito mais'
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Análise de Mercado',
      description: 'Insights valiosos para prospecção, compliance e inteligência de negócios'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Relatórios Detalhados',
      description: 'Visualize dados, exporte relatórios e tome decisões baseadas em informação real'
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
      description: 'Filtre por estado, município, CEP ou bairro específico'
    },
    {
      icon: <Filter size={24} />,
      title: 'CNAE',
      description: 'Busque por atividade econômica principal ou secundária'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Porte da Empresa',
      description: 'MEI, Micro, Pequena, Média ou Grande empresa'
    },
    {
      icon: <Calendar size={24} />,
      title: 'Data de Abertura',
      description: 'Encontre empresas por período de constituição'
    },
    {
      icon: <FileCheck size={24} />,
      title: 'Situação Cadastral',
      description: 'Ativa, baixada, suspensa, nula ou inapta'
    },
    {
      icon: <Users size={24} />,
      title: 'Sócios e QSA',
      description: 'Pesquise por CPF/CNPJ de sócios e administradores'
    }
  ];

  const integrationFeatures = [
    {
      icon: <Code size={32} />,
      title: 'API RESTful Simples',
      description: 'Endpoints intuitivos e documentação completa para integração rápida'
    },
    {
      icon: <Zap size={32} />,
      title: 'Resposta Instantânea',
      description: 'Tempo médio de resposta de 45ms para qualquer consulta'
    },
    {
      icon: <Layers size={32} />,
      title: 'JSON Estruturado',
      description: 'Dados organizados e prontos para consumo em qualquer linguagem'
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'CEO, TechStart Consultoria',
      avatar: 'CS',
      rating: 5,
      text: 'Transformou nossa prospecção B2B! Conseguimos identificar leads qualificados 3x mais rápido com os filtros avançados.'
    },
    {
      name: 'Marina Costa',
      role: 'Analista de Compliance',
      avatar: 'MC',
      rating: 5,
      text: 'Ferramenta essencial para due diligence. Dados precisos e atualizados que fazem toda diferença no nosso trabalho.'
    },
    {
      name: 'Roberto Almeida',
      role: 'Desenvolvedor Full Stack',
      avatar: 'RA',
      rating: 5,
      text: 'API muito bem documentada e fácil de integrar. Em 30 minutos já estava consultando dados no meu sistema!'
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
          
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Menu Hambúrguer */}
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-links">
            <a href="#features" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
            <a href="#categories" onClick={() => setMenuOpen(false)}>Setores</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Planos</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>Depoimentos</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contato</a>
          </div>
          
          <div className="mobile-menu-actions">
            <a href="#contact" onClick={() => setMenuOpen(false)}>
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
            <span>Dados mais recentes do Brasil • Atualização diária</span>
          </div>
          
          <h1 className="hero-title">
            Acesso Completo aos Dados
            <br />
            <span className="gradient-text">Públicos de CNPJ</span>
          </h1>
          
          <p className="hero-description">
            API profissional com dados oficiais e atualizados da Receita Federal. 
            Consulte empresas, estabelecimentos, sócios e muito mais em milissegundos. 
            Integração simples, filtros poderosos e dados 100% confiáveis para seu negócio.
          </p>
          
          <div className="hero-cta">
            <a href="#pricing">
              <button className="btn-primary-large btn-hero-primary">
                Começar Agora
                <ChevronRight size={20} />
              </button>
            </a>
            <a href="#features">
              <button className="btn-secondary-large btn-hero-secondary">
                Ver Demonstração
              </button>
            </a>
          </div>
          
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">64M+</div>
              <div className="stat-label">Empresas</div>
            </div>
            <div className="stat">
              <div className="stat-number">47M+</div>
              <div className="stat-label">Estabelecimentos</div>
            </div>
            <div className="stat">
              <div className="stat-number">26M+</div>
              <div className="stat-label">Sócios</div>
            </div>
            <div className="stat">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
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
          <h2>Filtros Poderosos Para Sua Busca</h2>
          <p>Encontre exatamente o que você precisa com nossos filtros avançados e combinações ilimitadas</p>
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
            <strong>Combine múltiplos filtros</strong> para encontrar seu público-alvo perfeito
          </p>
          <button className="btn-primary-large">
            Ver Todos os Filtros Disponíveis
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

        <div className="info-card" style={{ marginTop: '40px', background: '#1f2937', color: 'white' }}>
          <h3 style={{ color: 'white', marginBottom: '16px' }}>Exemplo de Consulta</h3>
          <pre style={{ background: '#111827', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
{`GET /api/v1/empresas?cnpj=00000000000191

{
  "cnpj": "00000000000191",
  "razao_social": "BANCO DO BRASIL S.A.",
  "nome_fantasia": "BANCO DO BRASIL",
  "situacao_cadastral": "ATIVA",
  "data_abertura": "1966-04-19",
  "cnae_principal": "6422-1/00",
  "porte": "DEMAIS",
  "natureza_juridica": "205-1",
  ...
}`}
          </pre>
          <p style={{ marginTop: '16px', color: 'rgba(255,255,255,0.8)' }}>
            Documentação completa com exemplos em Python, JavaScript, PHP, Java e mais
          </p>
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
              Nossa base é sincronizada <strong>diariamente</strong> com a Receita Federal, garantindo que você sempre tenha 
              acesso às informações mais recentes sobre empresas brasileiras. Última atualização: hoje.
            </p>
          </div>
        </div>
      </section>

      {/* Lookalike/Meta Ads Section */}
      <section id="marketing" className="lookalike-section">
        <div className="section-header">
          <h2>Potencialize Suas Campanhas com Públicos Lookalike</h2>
          <p>Use nossos dados para criar audiências personalizadas no Meta Ads e treinar a inteligência artificial para encontrar clientes ideais</p>
        </div>

        <div className="benefits-grid" style={{ marginBottom: '48px' }}>
          <div className="benefit-card" style={{ background: 'white' }}>
            <div className="benefit-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Target size={32} />
            </div>
            <h3>Público-Alvo Preciso</h3>
            <p>Exporte listas segmentadas de CNPJs para criar audiências personalizadas (Custom Audiences) no Facebook e Instagram Ads</p>
          </div>

          <div className="benefit-card" style={{ background: 'white' }}>
            <div className="benefit-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Brain size={32} />
            </div>
            <h3>Treinar a IA do Meta</h3>
            <p>Alimente o algoritmo com dados precisos de empresas similares ao seu cliente ideal, melhorando drasticamente a performance das campanhas</p>
          </div>

          <div className="benefit-card" style={{ background: 'white' }}>
            <div className="benefit-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Sparkles size={32} />
            </div>
            <h3>Lookalike Inteligente</h3>
            <p>A partir da sua lista de CNPJs, o Meta cria públicos semelhantes (Lookalike Audiences) com milhões de prospects qualificados</p>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '20px',
          maxWidth: '800px',
          margin: '0 auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          border: '2px solid #fbbf24'
        }}>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--dark)', marginBottom: '16px', textAlign: 'center' }}>
            Como Funciona na Prática
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: 'white', 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: '700',
                flexShrink: 0
              }}>1</div>
              <div>
                <strong style={{ color: 'var(--dark)' }}>Filtre empresas do seu nicho</strong>
                <p style={{ color: 'var(--gray)', margin: '4px 0 0 0', fontSize: '15px' }}>Use nossa API para buscar CNPJs por CNAE, localização, porte e situação cadastral</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: 'white', 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: '700',
                flexShrink: 0
              }}>2</div>
              <div>
                <strong style={{ color: 'var(--dark)' }}>Exporte e carregue no Meta Ads</strong>
                <p style={{ color: 'var(--gray)', margin: '4px 0 0 0', fontSize: '15px' }}>Crie uma Custom Audience com os CNPJs das empresas-alvo no Gerenciador de Anúncios</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: 'white', 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: '700',
                flexShrink: 0
              }}>3</div>
              <div>
                <strong style={{ color: 'var(--dark)' }}>Deixe a IA do Meta trabalhar</strong>
                <p style={{ color: 'var(--gray)', margin: '4px 0 0 0', fontSize: '15px' }}>O algoritmo analisa padrões e encontra empresas similares, expandindo seu alcance com precisão</p>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '32px', 
            padding: '20px', 
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#78350f', fontWeight: '600', margin: 0 }}>
              💡 <strong>Resultado:</strong> Campanhas mais eficientes, menor CPA e melhor ROI nas suas estratégias de marketing digital
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
            <span className="discount-badge">Economize 30%</span>
          </button>
        </div>
        
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`pricing-card ${plan.popular ? 'popular' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && <div className="popular-badge">Mais Popular</div>}
              
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
              </div>
              
              <div className="plan-price">
                <span className="currency">R$</span>
                <span className="amount">
                  {billingPeriod === 'mensal' ? plan.priceMonthly : plan.priceYearly}
                </span>
                <span className="period">
                  {billingPeriod === 'mensal' ? '/mês' : '/ano'}
                </span>
              </div>
              
              {billingPeriod === 'anual' && (
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--primary)', 
                  fontWeight: '600',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  R$ {(parseFloat(plan.priceYearly.replace('.', '').replace(',', '.')) / 12).toFixed(2).replace('.', ',')} /mês
                </div>
              )}
              
              <div className="plan-queries">
                <strong>{plan.queries}</strong> consultas/mês
              </div>
              
              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <Check size={18} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button className={`btn-plan ${plan.popular ? 'btn-primary-large' : 'btn-secondary-large'}`}>
                Assinar {plan.name}
              </button>
            </div>
          ))}
        </div>
        
        <div className="addons-section">
          <h3>Precisa de mais consultas?</h3>
          <p>Compre pacotes adicionais a qualquer momento</p>
          <div className="addons-grid">
            {addons.map((addon, index) => (
              <div key={index} className="addon-card">
                <div className="addon-queries">{addon.queries} consultas</div>
                <div className="addon-price">R$ {addon.price}</div>
                <button className="btn-addon">Adicionar ao Plano</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2>O Que Nossos Clientes Dizem</h2>
          <p>Empresas de todos os tamanhos confiam em nossa plataforma</p>
        </div>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
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
          ))}
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

export default LandingPage;
