
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
  Layers
} from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('profissional');
  const [billingPeriod, setBillingPeriod] = useState('mensal'); // 'mensal' ou 'anual'

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

  const businessCategories = [
    {
      icon: <Store size={32} />,
      title: 'Varejo e Comércio',
      description: 'Encontre lojas, supermercados e pontos de venda em todo Brasil',
      count: '8M+'
    },
    {
      icon: <Factory size={32} />,
      title: 'Indústria',
      description: 'Fabricantes, montadoras e empresas de transformação',
      count: '2M+'
    },
    {
      icon: <Briefcase size={32} />,
      title: 'Serviços',
      description: 'Consultorias, agências, escritórios e prestadores',
      count: '12M+'
    },
    {
      icon: <Truck size={32} />,
      title: 'Logística e Transporte',
      description: 'Transportadoras, distribuidoras e empresas de entrega',
      count: '1.5M+'
    },
    {
      icon: <Building2 size={32} />,
      title: 'Construção Civil',
      description: 'Construtoras, incorporadoras e empresas de engenharia',
      count: '900K+'
    },
    {
      icon: <ShoppingCart size={32} />,
      title: 'E-commerce',
      description: 'Lojas virtuais e marketplaces em todo território nacional',
      count: '1.2M+'
    }
  ];

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
            <button className="btn-primary-large">
              Começar Agora
              <ChevronRight size={20} />
            </button>
            <button className="btn-secondary-large">
              Ver Demonstração
            </button>
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

      {/* Business Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Dados de Todos os Setores</h2>
          <p>Acesse informações completas de empresas em qualquer segmento do mercado brasileiro</p>
        </div>
        
        <div className="categories-grid">
          {businessCategories.map((category, index) => (
            <div key={index} className="category-card">
              <div className="category-icon">{category.icon}</div>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <div className="category-count">
                {category.count} empresas
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Advanced Filters Section */}
      <section className="filters-section">
        <div className="section-header">
          <h2>Filtros Poderosos Para Sua Busca</h2>
          <p>Encontre exatamente o que você precisa com nossos filtros avançados e combinações ilimitadas</p>
        </div>
        
        <div className="filters-grid">
          {advancedFilters.map((filter, index) => (
            <div key={index} className="filter-card">
              <div className="filter-icon">{filter.icon}</div>
              <div className="filter-content">
                <h3>{filter.title}</h3>
                <p>{filter.description}</p>
              </div>
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
      <section className="benefits-section">
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
      <section className="benefits-section">
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
      <section className="pricing-section">
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
      <section className="testimonials-section">
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
          <button className="btn-primary-large">
            Criar Conta Grátis
            <ChevronRight size={20} />
          </button>
          <p className="cta-note">Sem cartão de crédito necessário • Cancele quando quiser • Dados 100% atualizados</p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
