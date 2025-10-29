
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Check, Zap, Shield, TrendingUp, Package, Sparkles } from 'lucide-react';
import './Pricing.css';

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [batchPackages, setBatchPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [purchasing, setPurchasing] = useState(null);
  const navigate = useNavigate();

  const rateLimits = {
    'free': 10,
    'starter': 60,
    'growth': 300,
    'professional': 1000
  };

  useEffect(() => {
    loadPlans();
    loadBatchPackages();
  }, []);

  const enrichPlanFeatures = (plan) => {
    // Adiciona features específicas de batch queries e filtros
    const baseFeatures = plan.features || [];
    const enrichedFeatures = [...baseFeatures];
    
    // Adicionar info de consultas em lote se houver
    if (plan.monthly_batch_queries > 0) {
      enrichedFeatures.unshift(`${plan.monthly_batch_queries.toLocaleString('pt-BR')} consultas em lote/mês`);
    }
    
    // Adicionar info de filtros avançados
    if (!enrichedFeatures.some(f => f.includes('filtros avançados'))) {
      enrichedFeatures.push('+45 filtros avançados');
    }
    
    // Adicionar info sobre créditos que não expiram (exceto plano free)
    if (plan.name !== 'free' && !enrichedFeatures.some(f => f.includes('nunca expiram'))) {
      enrichedFeatures.push('Créditos batch comprados nunca expiram');
    }
    
    return {
      ...plan,
      features: enrichedFeatures
    };
  };

  const loadPlans = async () => {
    try {
      const response = await api.get('/subscriptions/plans');
      const enrichedPlans = response.data.map(enrichPlanFeatures);
      setPlans(enrichedPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      // Fallback: usar planos hardcoded se API falhar
      setPlans([
        {
          id: 1,
          name: 'free',
          display_name: 'Free',
          monthly_queries: 200,
          monthly_batch_queries: 50,
          price_brl: 0,
          features: [
            '200 consultas mensais',
            '50 consultas em lote/mês',
            '+45 filtros avançados',
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
          monthly_batch_queries: 0,
          price_brl: 79.90,
          features: [
            '10.000 consultas mensais',
            '+45 filtros avançados',
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
          monthly_batch_queries: 0,
          price_brl: 249.90,
          features: [
            '100.000 consultas mensais',
            '+45 filtros avançados',
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
          name: 'professional',
          display_name: 'Professional',
          monthly_queries: 500000,
          monthly_batch_queries: 0,
          price_brl: 799.90,
          features: [
            '500.000 consultas mensais',
            '+45 filtros avançados',
            'Acesso API ilimitado',
            'Dados em tempo real',
            'Suporte 24/7',
            'Dashboard personalizado',
            'Redis Cache Premium',
            'Rate limit: 1000 req/min',
            'Relatórios customizados',
            'Créditos batch comprados nunca expiram'
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchPackages = async () => {
    try {
      const response = await api.get('/api/v1/batch/packages');
      setBatchPackages(response.data);
    } catch (error) {
      console.error('Erro ao carregar pacotes:', error);
      // Fallback: usar pacotes hardcoded se API falhar
      setBatchPackages([
        {
          id: 1,
          name: 'batch_starter',
          display_name: 'Starter',
          description: 'Ideal para testes e projetos pequenos',
          credits: 1000,
          price_brl: 49.90,
          price_per_unit: 0.0499,
          sort_order: 1,
          is_active: true
        },
        {
          id: 2,
          name: 'batch_professional',
          display_name: 'Professional',
          description: 'Para empresas e consultas frequentes',
          credits: 5000,
          price_brl: 199.90,
          price_per_unit: 0.03998,
          sort_order: 2,
          is_active: true
        },
        {
          id: 3,
          name: 'batch_enterprise',
          display_name: 'Enterprise',
          description: 'Melhor custo-benefício para grandes volumes',
          credits: 20000,
          price_brl: 599.90,
          price_per_unit: 0.029995,
          sort_order: 3,
          is_active: true
        }
      ]);
    }
  };

  const handleSubscribe = async (planId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setSubscribing(planId);
    
    try {
      const response = await api.post('/stripe/create-checkout-session', {
        plan_id: planId,
        success_url: `${window.location.origin}/subscription?success=true`,
        cancel_url: `${window.location.origin}/home#pricing`
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      alert('Erro ao iniciar processo de pagamento. Tente novamente.');
      setSubscribing(null);
    }
  };

  const handlePurchasePackage = async (packageId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setPurchasing(packageId);
    
    try {
      const response = await api.post(`/api/v1/batch/packages/${packageId}/purchase`);
      
      if (response.data.success && response.data.session_url) {
        window.location.href = response.data.session_url;
      } else {
        throw new Error(response.data.message || 'Erro ao iniciar compra');
      }
    } catch (error) {
      console.error('Erro ao comprar pacote:', error);
      alert('Erro ao iniciar compra. Tente novamente.');
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Planos e Preços</h1>
        <p>Escolha o melhor plano para suas necessidades de consulta CNPJ</p>
      </div>

      <div className="pricing-features">
        <div className="feature-item">
          <Zap size={24} />
          <h4>Rápido</h4>
          <p>Respostas em menos de 50ms</p>
        </div>
        <div className="feature-item">
          <Shield size={24} />
          <h4>Seguro</h4>
          <p>API autenticada e criptografada</p>
        </div>
        <div className="feature-item">
          <TrendingUp size={24} />
          <h4>Escalável</h4>
          <p>Planos que crescem com você</p>
        </div>
      </div>

      {/* PLANOS MENSAIS */}
      <div className="section-title">
        <h2>🎯 Planos Mensais</h2>
        <p>Consultas individuais por CNPJ</p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.name === 'professional' ? 'featured' : ''}`}>
            {plan.name === 'professional' && <div className="popular-badge">Mais Popular</div>}
            <h3>{plan.display_name}</h3>
            <div className="plan-price">
              <span className="currency">R$</span>
              <span className="amount">{plan.price_brl.toFixed(2)}</span>
              <span className="period">/mês</span>
            </div>
            <div className="plan-limit">
              <strong>{plan.monthly_queries.toLocaleString('pt-BR')}</strong> consultas/mês
            </div>
            {plan.monthly_batch_queries > 0 && (
              <div className="batch-included-badge" style={{
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
            <div className="plan-rate-limit" style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '14px',
              color: '#3b82f6',
              fontWeight: '500'
            }}>
              ⚡ {rateLimits[plan.name] || 10} requisições/min
            </div>
            <ul className="plan-features">
              <li>
                <Check size={18} />
                {rateLimits[plan.name] || 10} req/min (Rate Limit)
              </li>
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <Check size={18} />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={`btn-plan ${plan.name === 'professional' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSubscribe(plan.id)}
              disabled={subscribing === plan.id}
            >
              {subscribing === plan.id ? 'Processando...' : 'Assinar Agora'}
            </button>
          </div>
        ))}
      </div>

      {/* PACOTES DE CONSULTAS EM LOTE */}
      {batchPackages.length > 0 && (
        <>
          <div className="section-title batch-section">
            <div className="batch-header">
              <Sparkles size={32} className="sparkle-icon" />
              <div>
                <h2>⚡ Consultas em Lote</h2>
                <p>Pesquise milhares de empresas de uma vez com +45 filtros avançados</p>
              </div>
            </div>
            <div className="batch-description">
              <p>
                <strong>Novo!</strong> Faça buscas avançadas por razão social, CNAE, localização, porte, faturamento, data de abertura e muito mais.
                Cada resultado retornado = 1 crédito. <strong style={{color: '#10b981'}}>✨ Créditos comprados nunca expiram!</strong>
              </p>
              <div style={{
                marginTop: '15px',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                borderLeft: '4px solid #667eea',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                <strong>🎯 +45 filtros disponíveis:</strong> Razão Social, CNAE, UF, Cidade, Bairro, Porte, Situação Cadastral, 
                Natureza Jurídica, Matriz/Filial, Faturamento Estimado, Data de Abertura e muitos outros!
              </div>
            </div>
          </div>

          <div className="batch-packages-grid">
            {batchPackages.map((pkg) => {
              const pricePerUnit = pkg.price_per_unit;
              const savingsPercent = batchPackages[0] && pkg.id !== batchPackages[0].id 
                ? Math.round((1 - (pricePerUnit / batchPackages[0].price_per_unit)) * 100)
                : 0;

              return (
                <div key={pkg.id} className="batch-package-card">
                  {savingsPercent > 0 && (
                    <div className="savings-badge">
                      Economize {savingsPercent}%
                    </div>
                  )}
                  <div className="package-icon">
                    <Package size={40} />
                  </div>
                  <h3>{pkg.display_name}</h3>
                  <div className="package-credits">
                    <span className="credits-amount">{pkg.credits.toLocaleString('pt-BR')}</span>
                    <span className="credits-label">créditos</span>
                  </div>
                  <div className="package-price">
                    <div className="price-main">
                      <span className="currency">R$</span>
                      <span className="amount">{pkg.price_brl.toFixed(2)}</span>
                    </div>
                    <div className="price-per-unit">
                      R$ {(pricePerUnit * 100).toFixed(2)} centavos/crédito
                    </div>
                  </div>
                  <p className="package-description">{pkg.description}</p>
                  <button
                    className="btn-package"
                    onClick={() => handlePurchasePackage(pkg.id)}
                    disabled={purchasing === pkg.id}
                  >
                    {purchasing === pkg.id ? 'Processando...' : 'Comprar Agora'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="batch-info-box">
            <h4>💡 Como funciona?</h4>
            <ul>
              <li>✅ Compre um pacote de créditos (pagamento único)</li>
              <li>✅ Use o endpoint <code>/batch/search</code> com filtros avançados</li>
              <li>✅ Cada empresa retornada = 1 crédito consumido</li>
              <li>✅ Créditos não expiram - use quando quiser!</li>
              <li>✅ Economize até {Math.max(...batchPackages.map(p => {
                const savings = batchPackages[0] && p.id !== batchPackages[0].id 
                  ? Math.round((1 - (p.price_per_unit / batchPackages[0].price_per_unit)) * 100)
                  : 0;
                return savings;
              }))}% comprando pacotes maiores</li>
            </ul>
          </div>
        </>
      )}

      <div className="pricing-faq">
        <h2>Perguntas Frequentes</h2>
        <div className="faq-item">
          <h4>Como funciona a cobrança?</h4>
          <p>A cobrança é mensal e renovada automaticamente. Você pode cancelar a qualquer momento.</p>
        </div>
        <div className="faq-item">
          <h4>Posso mudar de plano?</h4>
          <p>Sim! Você pode fazer upgrade ou downgrade a qualquer momento pelo painel.</p>
        </div>
        <div className="faq-item">
          <h4>O que são consultas em lote?</h4>
          <p>Consultas em lote permitem pesquisar milhares de empresas de uma vez usando filtros como CNAE, localização, porte, etc. Ideal para prospecção e análises de mercado.</p>
        </div>
        <div className="faq-item">
          <h4>Os créditos de consultas em lote expiram?</h4>
          <p>Não! Os créditos comprados não expiram. Use quando precisar, sem pressa.</p>
        </div>
        <div className="faq-item">
          <h4>Tem garantia de reembolso?</h4>
          <p>Sim! Oferecemos garantia de 7 dias. Se não ficar satisfeito, devolvemos seu dinheiro.</p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
