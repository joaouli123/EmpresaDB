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
  Star
} from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState('profissional');

  const plans = [
    {
      id: 'basico',
      name: 'Básico',
      price: '59,90',
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
      price: '89,90',
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
      price: '149,00',
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
      description: 'Acesso a milhões de empresas, estabelecimentos, sócios e CNPJs atualizados'
    },
    {
      icon: <Zap size={32} />,
      title: 'API Ultra Rápida',
      description: 'Consultas em milissegundos com nossa infraestrutura otimizada'
    },
    {
      icon: <Shield size={32} />,
      title: '100% Seguro e Confiável',
      description: 'Dados oficiais da Receita Federal com total segurança e privacidade'
    },
    {
      icon: <Search size={32} />,
      title: 'Busca Avançada',
      description: 'Filtros por CNAE, localização, porte, situação cadastral e muito mais'
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Análise de Mercado',
      description: 'Insights valiosos para prospecção, compliance e inteligência de negócios'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Relatórios Detalhados',
      description: 'Visualize dados, exporte relatórios e tome decisões baseadas em informação'
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'CEO, TechStart Consultoria',
      avatar: 'CS',
      rating: 5,
      text: 'Transformou nossa prospecção B2B! Conseguimos identificar leads qualificados 3x mais rápido.'
    },
    {
      name: 'Marina Costa',
      role: 'Analista de Compliance',
      avatar: 'MC',
      rating: 5,
      text: 'Ferramenta essencial para due diligence. Dados precisos e atualizados que fazem toda diferença.'
    },
    {
      name: 'Roberto Almeida',
      role: 'Contador',
      avatar: 'RA',
      rating: 5,
      text: 'Economizei horas de trabalho manual. A API é rápida e a integração foi muito simples!'
    }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={16} />
            <span>+64 milhões de empresas cadastradas</span>
          </div>
          
          <h1 className="hero-title">
            Acesso Completo aos Dados
            <br />
            <span className="gradient-text">Públicos de CNPJ</span>
          </h1>
          
          <p className="hero-description">
            API profissional com dados da Receita Federal. Consulte empresas, estabelecimentos, 
            sócios e muito mais em segundos. Ideal para compliance, prospecção e inteligência de mercado.
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
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="section-header">
          <h2>Planos Que Cabem no Seu Bolso</h2>
          <p>Escolha o plano ideal para seu negócio. Sem taxas escondidas, cancele quando quiser</p>
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
                <span className="amount">{plan.price}</span>
                <span className="period">/mês</span>
              </div>
              
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
          <p className="cta-note">Sem cartão de crédito necessário • Cancele quando quiser</p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
