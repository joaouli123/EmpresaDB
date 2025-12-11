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
import ContactModal from '../components/ContactModal';
import '../styles/LandingPage.css';
import '../styles/LandingPageUpdates.css';

const LandingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('professional');
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    loadPlans();
    loadBatchPackages();

    // Update window width on resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Garantir que sempre sejam arrays
  const safePlans = Array.isArray(plans) ? plans : [];
  const safeBatchPackages = Array.isArray(batchPackages) ? batchPackages : [];

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
          rate_limit: 10,
          features: [
            '200 consultas mensais',
            '0 consultas em lote/mês',
            '34+ filtros avançados',
            'Acesso API básico',
            'Dados atualizados',
            'Suporte por email'
          ]
        },
        {
          id: 2,
          name: 'start',
          display_name: 'Start',
          monthly_queries: 10000,
          monthly_batch_queries: 500,
          price_brl: 79.90,
          rate_limit: 60,
          features: [
            '10.000 consultas mensais',
            '500 consultas em lote/mês',
            '34+ filtros avançados',
            'Acesso API completo',
            'Dados atualizados diariamente',
            'Suporte prioritário',
            'Dashboard básico',
            'Créditos batch comprados nunca expiram'
          ]
        },
        {
          id: 3,
          name: 'growth',
          display_name: 'Growth',
          monthly_queries: 100000,
          monthly_batch_queries: 2000,
          price_brl: 249.90,
          rate_limit: 300,
          features: [
            '100.000 consultas mensais',
            '2.000 consultas em lote/mês',
            '34+ filtros avançados',
            'Acesso API completo',
            'Dados em tempo real',
            'Suporte prioritário',
            'Dashboard avançado',
            'Redis Cache (3x mais rápido)',
            'Rate limit: 300 req/min',
            'Créditos batch comprados nunca expiram'
          ]
        },
        {
          id: 4,
          name: 'pro',
          display_name: 'Pro',
          monthly_queries: 500000,
          monthly_batch_queries: 10000,
          price_brl: 799.90,
          rate_limit: 1000,
          features: [
            '500.000 consultas mensais',
            '10.000 consultas em lote/mês',
            '34+ filtros avançados',
            'Acesso API ilimitado',
            'Dados em tempo real',
            'Suporte 24/7',
            'Dashboard personalizado',
            'Redis Cache Premium',
            'Rate limit: 1000 req/min',
            'Relatórios customizados',
            'Créditos batch comprados nunca expiram'
          ]
        },
        {
          id: 5,
          name: 'enterprise',
          display_name: 'Enterprise',
          monthly_queries: 0,
          monthly_batch_queries: 0,
          price_brl: 0,
          rate_limit: 0,
          is_custom: true,
          features: [
            'Consultas ilimitadas*',
            'Consultas em lote ilimitadas*',
            'SLA garantido com uptime de 99,9%',
            'Gerente de conta dedicado',
            'Infraestrutura dedicada disponível',
            'Integração e onboarding personalizados',
            'Gestão e controle de usuários e pagamentos',
            'Desenvolvimento de features sob demanda',
            'Suporte prioritário 24/7'
          ]
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
      title: 'E muito mais!',
      description: 'Capital social, porte, endereço completo, QSA, regime tributário, natureza jurídica, data de abertura e 28+ outros campos'
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
      answer: 'Você tem acesso a mais de 34 filtros avançados! Pode filtrar por: estado (UF), município, CNAE (atividade econômica), situação cadastral, porte da empresa, data de abertura, razão social, nome fantasia, CEP, bairro, logradouro, opção pelo Simples Nacional, MEI, natureza jurídica e muito mais. Combine múltiplos filtros para encontrar exatamente o que precisa.'
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
  const testimonialItemsToShow = windowWidth <= 640 ? 1 : windowWidth <= 991 ? 2 : 3;
  const totalTestimonialPages = Math.ceil(testimonials.length / testimonialItemsToShow);

  const nextTestimonial = () => {
    setCurrentTestimonial(prev => (prev + 1) % (testimonials.length - testimonialItemsToShow + 1));
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(prev => (prev - 1 + (testimonials.length - testimonialItemsToShow + 1)) % (testimonials.length - testimonialItemsToShow + 1));
  };

  // Pricing Carousel Logic - Igual aos depoimentos
  const pricingItemsToShow = windowWidth <= 640 ? 1 : windowWidth <= 991 ? 2 : 3;

  const nextPricingSlide = () => {
    const itemsToShow = windowWidth <= 640 ? 1 : windowWidth <= 991 ? 2 : 3;
    setPricingCarouselIndex(prev => prev < safePlans.length - itemsToShow ? prev + 1 : 0);
  };

  const prevPricingSlide = () => {
    const itemsToShow = windowWidth <= 640 ? 1 : windowWidth <= 991 ? 2 : 3;
    setPricingCarouselIndex(prev => prev > 0 ? prev - 1 : safePlans.length - itemsToShow);
  };

  return (
      <div className="landing-page">
      {/* Floating Navbar */}
      <nav className="floating-navbar">
        <div className="navbar-content">
          <div className="navbar-logo">
            <Database size={28} />
            <span>DB Empresas</span>
          </div>

          {/* Links de navegação (visível no desktop) */}
          <div className="navbar-links">
            <a href="#features">Funcionalidades</a>
            <a href="#categories">Setores</a>
            <a href="#filters">Filtros</a>
            <a href="#pricing">Planos</a>
            <a href="#testimonials">Depoimentos</a>
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
            <a href="#filters" onClick={() => setMenuOpen(false)}>Filtros</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Planos</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>Depoimentos</a>
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
            <div className="pricing-carousel">
              <div className="pricing-carousel-grid">
                {safePlans.slice(pricingCarouselIndex, pricingCarouselIndex + pricingItemsToShow).map((plan) => {
                  const isPopular = plan.name === 'growth';
                  const priceMonthly = plan.price_brl;
                  const priceYearly = plan.price_brl * 12 * 0.83;
                  const displayPrice = billingPeriod === 'mensal' ? priceMonthly : priceYearly;

                  return (
                    <div
                      key={plan.id}
                      className={`pricing-card ${isPopular ? 'popular' : ''} ${plan.name === 'enterprise' ? 'enterprise' : ''} ${selectedPlan === plan.name ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan(plan.name)}
                      style={plan.name === 'enterprise' ? {
                        background: 'linear-gradient(135deg, #1e293b 0%, #111827 100%)',
                        border: '3px solid #fbbf24',
                        color: 'white'
                      } : {}}
                    >
                      {isPopular && <div className="popular-badge" style={{ top: '-16px' }}>Mais Popular</div>}
                      {plan.name === 'enterprise' && (
                        <div className="popular-badge" style={{
                          top: '-16px',
                          background: '#fbbf24',
                          color: '#1f2937'
                        }}>
                          WHITE LABEL
                        </div>
                      )}

                      <div className="plan-header">
                        <h3 style={plan.name === 'enterprise' ? { color: 'white' } : {}}>{plan.display_name}</h3>
                        <p className="plan-description" style={plan.name === 'enterprise' ? { color: 'rgba(255,255,255,0.7)' } : {}}>
                          {plan.name === 'free' && 'Para começar e testar'}
                          {plan.name === 'start' && 'Para pequenas empresas'}
                          {plan.name === 'growth' && 'Para empresas em crescimento'}
                          {plan.name === 'pro' && 'Para grandes volumes'}
                          {plan.name === 'enterprise' && 'Solução personalizada para grandes volumes'}
                        </p>
                      </div>

                      {plan.name === 'enterprise' ? (
                        <>
                          <div style={{
                            padding: '24px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '2px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '12px',
                            marginBottom: '24px'
                          }}>
                            <div style={{
                              fontSize: '36px',
                              fontWeight: '800',
                              color: '#60a5fa',
                              textAlign: 'left',
                              marginBottom: '4px'
                            }}>
                              ilimitadas*
                            </div>
                            <div style={{
                              fontSize: '16px',
                              color: 'rgba(255,255,255,0.6)',
                              textAlign: 'left'
                            }}>
                              consultas
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
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
                            <strong>{(plan.monthly_queries || 0).toLocaleString('pt-BR')}</strong> consultas/mês
                          </div>
                        </>
                      )}

                      <ul className="plan-features" style={plan.name === 'enterprise' ? {
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '20px',
                        marginTop: '20px'
                      } : {}}>
                        {plan.name === 'enterprise' ? (
                          (plan.features || []).map((feature, idx) => (
                            <li key={idx} style={{ color: 'rgba(255,255,255,0.85)' }}>
                              <Check size={18} style={{ color: '#10b981' }} />
                              {feature}
                            </li>
                          ))
                        ) : (
                          <>
                            <li>
                              <Check size={18} />
                              {(plan.monthly_queries || 0).toLocaleString('pt-BR')} consultas/mês
                            </li>

                            <li>
                              <Check size={18} />
                              {(plan.monthly_batch_queries || 0).toLocaleString('pt-BR')} consultas em lote/mês
                            </li>

                            <li>
                              <Check size={18} />
                              34+ filtros avançados
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
                          </>
                        )}
                      </ul>

                      {plan.name === 'enterprise' ? (
                        <a href="mailto:contato@dbempresas.com.br?subject=Interesse no Plano Enterprise">
                          <button className="btn-plan btn-secondary-large" style={{
                            background: '#fbbf24',
                            color: '#1f2937',
                            border: 'none',
                            fontWeight: '700'
                          }}>
                            Falar com Especialista
                          </button>
                        </a>
                      ) : (
                        <a href={plan.name === 'free' ? '/login' : `/login?plan=${plan.name}`}>
                          <button className={`btn-plan ${isPopular ? 'btn-primary-large' : 'btn-secondary-large'}`}>
                            {plan.price_brl === 0 ? 'Começar Grátis' : `Assinar ${plan.display_name}`}
                          </button>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botões de Navegação */}
            <button
              className="carousel-nav-button prev"
              onClick={prevPricingSlide}
            >
              <ChevronLeft size={24} style={{ color: '#3b82f6' }} />
            </button>

            <button
              className="carousel-nav-button next"
              onClick={nextPricingSlide}
            >
              <ChevronRight size={24} style={{ color: '#3b82f6' }} />
            </button>

            {/* Indicadores */}
            <div className="carousel-indicators">
              {Array.from({ length: safePlans.length - pricingItemsToShow + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPricingCarouselIndex(index)}
                  className={`carousel-indicator ${pricingCarouselIndex === index ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Addons Section */}
      {safeBatchPackages.length > 0 && (
        <section className="addons-section">
          <div className="section-header">
            <h2>⚡ Consultas em Lote</h2>
            <p>Pesquise milhares de empresas de uma vez com 34+ filtros avançados</p>
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
                <strong>🎯 34+ filtros disponíveis:</strong> Razão Social, Nome Fantasia, CNAE Principal e Secundário, UF, Município, CEP, Bairro, Logradouro, Tipo Logradouro, Número, Complemento, Porte, Situação Cadastral, Motivo Situação, Matriz/Filial, Data de Abertura, Data Situação Cadastral, Natureza Jurídica, Capital Social, Simples Nacional, MEI e muito mais!
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
                {safeBatchPackages.map((pkg, index) => {
                  const pricePerUnit = (pkg.price_brl || 0) / (pkg.credits || 1);
                  const basePricePerUnit = safeBatchPackages[0] ? (safeBatchPackages[0].price_brl || 0) / (safeBatchPackages[0].credits || 1) : pricePerUnit;
                  const savingsPercent = index > 0 ? Math.round((1 - (pricePerUnit / basePricePerUnit)) * 100) : 0;

                  return (
                    <tr key={pkg.id || index} style={{
                      borderBottom: '1px solid #e5e7eb',
                      background: index % 2 === 0 ? '#fafafa' : 'white',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#fafafa' : 'white'}
                    >
                      <td data-label="Pacote" style={{ padding: '20px 24px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <Package size={24} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '16px' }}>{pkg.display_name || 'Pacote'}</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{pkg.description || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Créditos" style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '700', color: '#3b82f6', fontSize: '20px' }}>
                          {(pkg.credits || 0).toLocaleString('pt-BR')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>consultas</div>
                      </td>
                      <td data-label="Preço Total" style={{ padding: '20px 24px', textAlign: 'center' }}>
                        <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '20px' }}>
                          R$ {(pkg.price_brl || 0).toFixed(2).replace('.', ',')}
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
                        <a href="/login" style={{ textDecoration: 'none' }}>
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
                        </a>
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
                {safeBatchPackages.length > 1 && (
                  <li style={{ fontSize: '15px', color: '#374151', lineHeight: '1.6' }}>
                    ✅ Economize até {Math.max(...safeBatchPackages.map(p => {
                      const pricePerUnit = (p.price_brl || 0) / (p.credits || 1);
                      const basePricePerUnit = safeBatchPackages[0] ? ((safeBatchPackages[0].price_brl || 0) / (safeBatchPackages[0].credits || 1)) : pricePerUnit;
                      const savings = basePricePerUnit > 0 ? Math.round((1 - (pricePerUnit / basePricePerUnit)) * 100) : 0;
                      return Math.max(0, savings);
                    }))}% comprando pacotes maiores
                  </li>
                )}
              </ul>
            </div>
          </div>
        </section>
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
          <button 
            className="btn-primary-large"
            onClick={() => setIsContactModalOpen(true)}
          >
            Fale com Nosso Time
            <ChevronRight size={20} />
          </button>
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


      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <Database size={32} />
              <h3>DB Empresas</h3>
            </div>
            <p>Acesso completo aos dados empresariais da Receita Federal. Consultas rápidas, precisas e atualizadas.</p>
          </div>

          <div className="footer-section">
            <h4>Produto</h4>
            <ul>
              <li><a href="#features">Funcionalidades</a></li>
              <li><a href="#pricing">Planos e Preços</a></li>
              <li><a href="/servicos">Serviços</a></li>
              <li><a href="/casos-de-uso">Casos de Uso</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Empresa</h4>
            <ul>
              <li><a href="/sobre">Sobre Nós</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/contato">Contato</a></li>
              <li><a href="/api">Documentação API</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Suporte</h4>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#contact">Fale Conosco</a></li>
              <li><a href="https://wa.me/5541987857413?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20DB%20Empresas" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              <li><a href="tel:+5541987857413">(41) 98785-7413</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="/privacidade">Política de Privacidade</a></li>
              <li><a href="/termos">Termos de Uso</a></li>
              <li><a href="mailto:contato@dbempresas.com.br">Contato Email</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 DB Empresas. Todos os direitos reservados.</p>
          <p>Dados oficiais da Receita Federal do Brasil</p>
        </div>
      </footer>

      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
};

export default LandingPage;