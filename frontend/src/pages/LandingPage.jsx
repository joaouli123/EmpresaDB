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
  Package,
  ChevronDown,
  HelpCircle,
  ChevronLeft
} from 'lucide-react';
import { api } from '../services/api';
import '../styles/LandingPage.css';
import '../styles/LandingPageUpdates.css';

const LandingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const [billingPeriod, setBillingPeriod] = useState('mensal'); // 'mensal' ou 'anual'
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('varejo');
  const [menuOpen, setMenuOpen] = useState(false);
  const [batchPackages, setBatchPackages] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [pricingCarouselIndex, setPricingCarouselIndex] = useState(0); // Carrossel de Preços

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
      // Fallback: usar pacotes hardcoded se API falhar
      setBatchPackages([
        {
          id: 1,
          display_name: 'Pacote Starter',
          credits: 1000,
          price_brl: 49.90,
          price_per_unit: 0.0499,
          description: 'Ideal para começar'
        },
        {
          id: 2,
          display_name: 'Pacote Basic',
          credits: 5000,
          price_brl: 199.90,
          price_per_unit: 0.03998,
          description: 'Melhor custo-benefício'
        },
        {
          id: 3,
          display_name: 'Pacote Pro',
          credits: 15000,
          price_brl: 499.90,
          price_per_unit: 0.03333,
          description: 'Para alto volume'
        }
      ]);
    }
  };

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
      title: 'Dados Estruturados',
      description: 'Receba dados em JSON organizados e prontos para análise e integração com suas ferramentas'
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
      title: 'E mais 34+ Campos',
      description: 'Capital social, porte, endereço completo, QSA, regime tributário e muito mais'
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
      text: 'Economizamos 80% do tempo com pesquisa de empresas após integrar a API. Nossa prospecção B2B ficou 3x mais rápida e identificamos leads qualificados em segundos!'
    },
    {
      name: 'Marina Costa',
      role: 'Analista de Compliance, Banco Regional',
      avatar: 'MC',
      rating: 5,
      text: 'Integração fácil e dados precisos! Validamos mais de 5 mil CNPJs por mês e reduzimos em 70% o tempo de due diligence. Essencial para nosso compliance!'
    },
    {
      name: 'Roberto Almeida',
      role: 'Desenvolvedor Full Stack',
      avatar: 'RA',
      rating: 5,
      text: 'Integrei a API em menos de 1 hora! A documentação é clara, os endpoints são intuitivos e o suporte respondeu minhas dúvidas super rápido. Recomendo demais!'
    },
    {
      name: 'Fernanda Oliveira',
      role: 'Head de Marketing, AgenciaMax',
      avatar: 'FO',
      rating: 5,
      text: 'Revolucionou nossa prospecção! Criamos públicos lookalike no Meta Ads com listas segmentadas de CNPJs. Nosso CPL caiu 45% e a taxa de conversão dobrou!'
    },
    {
      name: 'João Pedro Santos',
      role: 'CTO, FinTech Solutions',
      avatar: 'JP',
      rating: 5,
      text: 'API estável e performática! Processamos mais de 50 mil consultas por dia sem problemas. A resposta em menos de 50ms é impressionante. Excelente custo-benefício!'
    },
    {
      name: 'Patrícia Mendes',
      role: 'Analista de Crédito, Cooperativa Central',
      avatar: 'PM',
      rating: 5,
      text: 'Dados 100% confiáveis da Receita Federal! Eliminamos erros de cadastro e aceleramos nossa análise de crédito. O suporte é sempre rápido e atencioso!'
    },
    {
      name: 'Ricardo Fernandes',
      role: 'Product Manager, SaaS Enterprise',
      avatar: 'RF',
      rating: 5,
      text: 'Escalamos de 500 para 100 mil consultas/mês sem problemas! A API aguenta o tranco e os filtros avançados são perfeitos para nossa plataforma B2B!'
    },
    {
      name: 'Juliana Rocha',
      role: 'Diretora Comercial, ERP Nacional',
      avatar: 'JR',
      rating: 5,
      text: 'Enriquecemos nosso CRM automaticamente! Agora temos dados completos de 100% dos nossos leads. O ROI foi de 300% no primeiro trimestre!'
    },
    {
      name: 'André Martins',
      role: 'Founder, StartupHub',
      avatar: 'AM',
      rating: 5,
      text: 'A API mais completa de CNPJ do mercado! Testamos 4 concorrentes e esta aqui ganha em preço, performance e qualidade dos dados. Impecável!'
    },
    {
      name: 'Camila Torres',
      role: 'Business Analyst, Consultoria Estratégica',
      avatar: 'CT',
      rating: 5,
      text: 'Dados atualizados diariamente! Conseguimos mapear mercados inteiros em minutos. As consultas em lote economizaram centenas de horas de pesquisa manual!'
    }
  ];

  const faqs = [
    {
      question: 'Como funcionam as consultas em lote?',
      answer: 'As consultas em lote permitem buscar múltiplas empresas de uma vez usando filtros avançados (CNAE, UF, município, porte, etc). Você pode consultar milhares de empresas em uma única requisição usando o endpoint /batch/search. Cada empresa retornada consome 1 crédito. Os créditos podem ser inclusos no seu plano mensal ou comprados em pacotes avulsos que nunca expiram.'
    },
    {
      question: 'Os dados são realmente da Receita Federal?',
      answer: 'Sim! Todos os dados são 100% oficiais e sincronizados mensalmente com a base pública da Receita Federal do Brasil. Isso inclui CNPJ completo, razão social, nome fantasia, endereço, situação cadastral, CNAE, porte, natureza jurídica, QSA (sócios e administradores) e muito mais. Garantimos conformidade total com a LGPD.'
    },
    {
      question: 'Quais filtros avançados posso usar nas buscas?',
      answer: 'Você tem acesso a mais de 45 filtros avançados! Pode filtrar por: estado (UF), município, CNAE (atividade econômica), situação cadastral, porte da empresa, data de abertura, razão social, nome fantasia, CEP, bairro, logradouro, opção pelo Simples Nacional, MEI, natureza jurídica e muito mais. Combine múltiplos filtros para encontrar exatamente o que precisa.'
    },
    {
      question: 'Como funciona o plano gratuito?',
      answer: 'O plano gratuito oferece 200 consultas por mês sem custo algum! Você pode consultar dados completos de qualquer CNPJ, incluindo informações da empresa, estabelecimentos e QSA. É perfeito para testar a plataforma. Não precisa cartão de crédito para começar e pode fazer upgrade a qualquer momento.'
    },
    {
      question: 'Posso exportar os dados para análise?',
      answer: 'Sim! Todas as consultas retornam dados em formato JSON estruturado, perfeito para integração com seu sistema. Além disso, você pode exportar resultados em CSV/Excel diretamente pelo dashboard para análises em planilhas. Os dados estão prontos para uso em ferramentas de BI, CRM ou qualquer sistema.'
    }
  ];

  // Testimonial Carousel Logic
  const testimonialItemsToShow = window.innerWidth <= 640 ? 1 : window.innerWidth <= 991 ? 2 : 3;
  const totalTestimonialPages = Math.ceil(testimonials.length / testimonialItemsToShow);

  const nextTestimonial = () => {
    setCurrentTestimonial(prev => (prev + 1) % (testimonials.length - testimonialItemsToShow + 1));
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(prev => (prev - 1 + (testimonials.length - testimonialItemsToShow + 1)) % (testimonials.length - testimonialItemsToShow + 1));
  };

  // Pricing Carousel Logic
  const getPricingItemsPerPage = () => {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 991) return 2;
    return 3;
  };

  const getPricingGap = () => {
    if (window.innerWidth <= 640) return 20;
    if (window.innerWidth <= 991) return 24;
    return 32;
  };

  const [pricingItemsPerPage, setPricingItemsPerPage] = useState(getPricingItemsPerPage());
  const [pricingGap, setPricingGap] = useState(getPricingGap());

  useEffect(() => {
    const handleResize = () => {
      setPricingItemsPerPage(getPricingItemsPerPage());
      setPricingGap(getPricingGap());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPricingPages = Math.ceil(plans.length / pricingItemsPerPage);

  const nextPricingSlide = () => {
    setPricingCarouselIndex(prev => (prev + 1) % totalPricingPages);
  };

  const prevPricingSlide = () => {
    setPricingCarouselIndex(prev => (prev - 1 + totalPricingPages) % totalPricingPages);
  };

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
            <a href="#faq">FAQ</a>
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
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
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
            <span>Mais de 500 empresas já confiam em nossa plataforma</span>
          </div>

          <h1 className="hero-title">
            Acesso Instantâneo a 64 Milhões de Empresas
            <br />
            <span className="gradient-text">Dados 100% Oficiais e Atualizados</span>
          </h1>

          <p className="hero-description">
            A maneira mais rápida e confiável de acessar dados completos de qualquer empresa no Brasil. 
            Sem burocracia, sem complicação. Consultas em milissegundos, integração simples e 
            dados 100% confiáveis para seu negócio.
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

        <div className="info-card" style={{ marginTop: '80px', marginBottom: '80px', background: '#1f2937', color: 'white', paddingTop: '48px', paddingBottom: '48px', paddingLeft: '32px', paddingRight: '32px', borderRadius: '16px' }}>
          <h3 style={{ color: 'white', marginBottom: '24px', marginTop: '0' }}>Exemplo de Consulta</h3>
          <pre style={{ background: '#111827', padding: '24px', borderRadius: '8px', overflow: 'auto', marginBottom: '0' }}>
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
          <p style={{ marginTop: '24px', marginBottom: '0', color: 'rgba(255,255,255,0.8)', paddingTop: '16px', paddingBottom: '16px' }}>
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
          <div className="pricing-carousel-wrapper">
            <button 
              className="carousel-nav-button prev" 
              onClick={prevPricingSlide}
              aria-label="Planos anteriores"
            >
              <ChevronLeft size={24} color="#333" />
            </button>

            <div className="pricing-carousel-container" style={{ overflow: 'visible' }}>
              <div 
                className="pricing-carousel-grid"
                style={{
                  transform: `translateX(-${pricingCarouselIndex * 100}%)`,
                  transition: 'transform 0.5s ease',
                  display: 'flex'
                }}
              >
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
                      style={{
                        flex: `0 0 calc((100% - ${(pricingItemsPerPage - 1) * pricingGap}px) / ${pricingItemsPerPage})`,
                        maxWidth: `calc((100% - ${(pricingItemsPerPage - 1) * pricingGap}px) / ${pricingItemsPerPage})`,
                        overflow: 'visible',
                        position: 'relative',
                        marginTop: isPopular ? '20px' : '0'
                      }}
                    >
                      {isPopular && <div className="popular-badge" style={{ top: '-16px' }}>Mais Popular</div>}

                      <div className="plan-header">
                        <h3>{plan.display_name}</h3>
                        <p className="plan-description">
                          {plan.name === 'free' && 'Para começar e testar'}
                          {plan.name === 'start' && 'Para pequenas empresas'}
                          {plan.name === 'growth' && 'Para empresas em crescimento'}
                          {plan.name === 'pro' && 'Para grandes volumes'}
                        </p>
                      </div>

                      <div className="plan-price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span className="currency">R$</span>
                          <span className="amount">{displayPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <span className="period" style={{ fontSize: '16px', color: 'var(--gray)', marginTop: '4px' }}>
                          /{billingPeriod === 'mensal' ? 'mês' : 'ano'}
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

                      <ul className="plan-features">
                        <li>
                          <Check size={18} />
                          {plan.monthly_queries.toLocaleString('pt-BR')} consultas/mês
                        </li>

                        <li>
                          <Check size={18} />
                          {plan.name === 'free' && '0 consultas em lote/mês'}
                          {plan.name === 'start' && '500 consultas em lote/mês'}
                          {plan.name === 'growth' && '2.000 consultas em lote/mês'}
                          {plan.name === 'pro' && '10.000 consultas em lote/mês'}
                        </li>

                        <li>
                          <Check size={18} />
                          16+ filtros avançados
                        </li>

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

                {/* Card Enterprise dentro do grid */}
                <div className="pricing-card enterprise-card" style={{
                  background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '3px solid #fbbf24'
                }}>
                  <div className="popular-badge" style={{ background: '#fbbf24', color: '#1f2937' }}>Customizado</div>
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
                    <h3 className="plan-name" style={{ color: 'white' }}>Enterprise</h3>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>
                      Solução personalizada para grandes volumes
                    </p>
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '2px solid rgba(59, 130, 246, 0.4)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '24px'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa', marginBottom: '4px' }}>
                        ilimitadas*
                      </div>
                      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>consultas</div>
                    </div>
                    <ul className="plan-features" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        Consultas ilimitadas*
                      </li>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        Consultas em lote ilimitadas*
                      </li>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        SLA garantido 99,9%
                      </li>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        Gerente de conta dedicado
                      </li>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        Infraestrutura dedicada
                      </li>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        White Label disponível
                      </li>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        Onboarding personalizado
                      </li>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        Relatórios customizados
                      </li>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        Features sob demanda
                      </li>
                      <li style={{ color: 'rgba(255,255,255,0.9)', borderBottom: 'none' }}>
                        <Check size={18} style={{ color: '#10b981' }} />
                        Suporte prioritário 24/7
                      </li>
                    </ul>
                    <button 
                      onClick={() => window.location.href = 'mailto:contato@cnpjapi.com.br?subject=Interesse no Plano Enterprise'}
                      className="btn-plan"
                      style={{
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        color: '#1f2937',
                        fontWeight: '700',
                        marginTop: '20px'
                      }}
                    >
                      Falar com Especialista
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button 
              className="carousel-nav-button next" 
              onClick={nextPricingSlide}
              aria-label="Próximos planos"
            >
              <ChevronRight size={24} color="#333" />
            </button>

            <div className="carousel-indicators">
              {Array.from({ length: totalPricingPages }).map((_, index) => (
                <button
                  key={index}
                  className={`carousel-indicator ${index === pricingCarouselIndex ? 'active' : ''}`}
                  onClick={() => setPricingCarouselIndex(index)}
                  aria-label={`Ir para página ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Addons Section */}
      {batchPackages.length > 0 && (
        <section className="addons-section">
          <div className="section-header">
            <h2>⚡ Consultas em Lote</h2>
            <p>Pesquise milhares de empresas de uma vez com 16+ filtros avançados</p>
          </div>
          
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '40px'
            }}>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
                <strong>Novo!</strong> Faça buscas por razão social, CNAE, localização, porte, faturamento, data de abertura e muito mais.
                Cada resultado retornado = 1 crédito.
              </p>
              <p style={{ fontSize: '16px', color: '#10b981', fontWeight: '700', marginBottom: '20px' }}>
                ✨ Créditos comprados nunca expiram!
              </p>
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderLeft: '4px solid #667eea',
                borderRadius: '8px',
                fontSize: '15px',
                maxWidth: '900px',
                margin: '0 auto'
              }}>
                <strong>🎯 16+ filtros disponíveis:</strong> Razão Social, Nome Fantasia, CNAE Principal e Secundário, UF, Município, CEP, Bairro, Logradouro, Porte, Situação Cadastral, Matriz/Filial, Data de Abertura, Simples Nacional, MEI e muito mais!
              </div>
            </div>
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '15px'
            }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: 'white', fontWeight: '700' }}>Pacote</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: 'white', fontWeight: '700' }}>Créditos</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: 'white', fontWeight: '700' }}>Preço Total</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: 'white', fontWeight: '700' }}>Preço/Crédito</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: 'white', fontWeight: '700' }}>Economia</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', color: 'white', fontWeight: '700' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {batchPackages.map((pkg, index) => {
                  const pricePerUnit = pkg.price_brl / pkg.credits;
                  const basePricePerUnit = batchPackages[0] ? batchPackages[0].price_brl / batchPackages[0].credits : pricePerUnit;
                  const savingsPercent = index > 0 ? Math.round((1 - (pricePerUnit / basePricePerUnit)) * 100) : 0;

                  return (
                    <tr key={pkg.id} style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      background: index % 2 === 0 ? '#fafafa' : 'white',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#fafafa' : 'white'}
                    >
                      <td data-label="Pacote" style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Package size={24} style={{ color: '#3b82f6', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '16px' }}>{pkg.display_name}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{pkg.description}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Créditos" style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '700', color: '#3b82f6', fontSize: '20px' }}>
                          {pkg.credits.toLocaleString('pt-BR')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>consultas</div>
                      </td>
                      <td data-label="Preço Total" style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '20px' }}>
                          R$ {pkg.price_brl.toFixed(2).replace('.', ',')}
                        </div>
                      </td>
                      <td data-label="Preço/Crédito" style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ 
                          background: 'linear-gradient(135deg, #10b98120, #05966920)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>
                          <div style={{ fontWeight: '700', color: '#10b981', fontSize: '15px' }}>
                            R$ {(pricePerUnit).toFixed(4).replace('.', ',')}
                          </div>
                        </div>
                      </td>
                      <td data-label="Economia" style={{ padding: '20px 24px', textAlign: 'center' }}>
                        {savingsPercent > 0 ? (
                          <div style={{ 
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '700',
                            display: 'inline-block'
                          }}>
                            -{savingsPercent}%
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td data-label="Ação" style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <button style={{
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: 'white',
                          border: 'none',
                          padding: '10px 24px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        >
                          Comprar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
            
            <div style={{ 
              marginTop: '40px', 
              padding: '32px', 
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '12px',
              border: '2px solid #bae6fd'
            }}>
              <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: 'var(--primary)' }}>💡 Como funciona?</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
                <li style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>✅ Compre um pacote de créditos (pagamento único)</li>
                <li style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>✅ Use o endpoint <code style={{ background: '#e5e7eb', padding: '3px 8px', borderRadius: '4px', fontSize: '14px' }}>/batch/search</code> com filtros avançados</li>
                <li style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>✅ Cada empresa retornada = 1 crédito consumido</li>
                <li style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>✅ Créditos não expiram - use quando quiser!</li>
                {batchPackages.length > 1 && (
                  <li style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>
                    ✅ Economize até {Math.max(...batchPackages.map(p => {
                      const pricePerUnit = p.price_brl / p.credits;
                      const basePricePerUnit = batchPackages[0] ? batchPackages[0].price_brl / batchPackages[0].credits : pricePerUnit;
                      const savings = basePricePerUnit > 0 ? Math.round((1 - (pricePerUnit / basePricePerUnit)) * 100) : 0;
                      return savings;
                    }))}% comprando pacotes maiores
                  </li>
                )}
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-header">
          <h2>O Que Nossos Clientes Dizem</h2>
          <p>Mais de 500 empresas confiam em nossa plataforma todos os dias</p>
        </div>

        <div className="testimonials-carousel-wrapper">
          <div className="testimonials-carousel">
            <div className="testimonials-carousel-grid">
              {testimonials.slice(currentTestimonial, currentTestimonial + testimonialItemsToShow).map((testimonial, index) => (
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
          </div>

          {/* Botões de Navegação */}
          <button
            className="carousel-nav-button prev"
            onClick={prevTestimonial}
          >
            <ChevronRight size={24} style={{ transform: 'rotate(180deg)', color: '#3b82f6' }} />
          </button>

          <button
            className="carousel-nav-button next"
            onClick={nextTestimonial}
          >
            <ChevronRight size={24} style={{ color: '#3b82f6' }} />
          </button>

          {/* Indicadores */}
          <div className="carousel-indicators">
            {Array.from({ length: testimonials.length - testimonialItemsToShow + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`carousel-indicator ${currentTestimonial === index ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="benefits-section" style={{ background: '#f9fafb' }}>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
            <HelpCircle size={32} color="var(--primary)" />
            <h2 style={{ margin: 0 }}>Perguntas Frequentes</h2>
          </div>
          <p>Tire suas dúvidas sobre nossa plataforma e funcionalidades</p>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              style={{
                background: 'white',
                borderRadius: '12px',
                marginBottom: '16px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                boxShadow: openFaqIndex === index ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#111827',
                  paddingRight: '20px'
                }}>
                  {faq.question}
                </span>
                <ChevronDown 
                  size={24} 
                  color="var(--primary)"
                  style={{
                    transform: openFaqIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    flexShrink: 0
                  }}
                />
              </button>

              {openFaqIndex === index && (
                <div style={{
                  padding: '0 24px 24px 24px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#4b5563',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '20px' }}>
            Ainda tem dúvidas? Nossa equipe está pronta para ajudar!
          </p>
          <a href="#contact">
            <button className="btn-primary-large">
              Fale com Nosso Time
              <ChevronRight size={20} />
            </button>
          </a>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Pronto Para Começar?</h2>
          <p>Entre no jogo com dados atualizados e de alta qualidade. Comece em minutos, sem compromisso.</p>
          <a href="#pricing">
            <button className="btn-primary-large btn-cta-primary">
              Comece Agora - Teste Grátis
              <ChevronRight size={20} />
            </button>
          </a>
          <p className="cta-note">✓ Sem cartão de crédito • ✓ 200 consultas gratuitas • ✓ Cancele quando quiser</p>
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