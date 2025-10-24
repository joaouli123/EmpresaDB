
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Check, Zap, Shield, TrendingUp } from 'lucide-react';

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/subscriptions/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubscribing(planId);
    try {
      await api.post(`/subscriptions/subscribe/${planId}`);
      alert('Assinatura realizada com sucesso! Em breve você receberá instruções de pagamento.');
      navigate('/dashboard');
    } catch (error) {
      alert('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setSubscribing(null);
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
            <ul className="plan-features">
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
          <h4>O que acontece se eu ultrapassar o limite?</h4>
          <p>As consultas extras são cobradas separadamente ou você pode adquirir créditos adicionais.</p>
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
