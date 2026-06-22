import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  Check, 
  X,
  TrendingUp,
  DollarSign,
  Clock,
  Eye,
  Trash2
} from 'lucide-react';
import './Subscription.css';

const Subscription = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      setShowSuccessMessage(true);
      searchParams.delete('success');
      setSearchParams(searchParams);
      setTimeout(() => setShowSuccessMessage(false), 8000);
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, transRes, cardsRes] = await Promise.all([
        api.get('/api/v1/subscriptions/my-subscription').catch(err => {
          console.error('Erro ao buscar assinatura:', err);
          return { data: null };
        }),
        api.get('/api/v1/subscriptions/transactions').catch(err => {
          console.error('Erro ao buscar transações:', err);
          return { data: [] };
        }),
        api.get('/api/v1/subscriptions/payment-methods').catch(err => {
          console.error('Erro ao buscar métodos de pagamento:', err);
          return { data: [] };
        })
      ]);
      
      // Verificar se retornou erro 404
      if (subRes.data && subRes.data.error) {
        setError('Não foi possível carregar informações da assinatura. Tente novamente.');
        setSubscription(null);
      } else {
        setSubscription(subRes.data);
      }
      
      setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar informações da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await api.post('/stripe/cancel-subscription');
      setShowCancelModal(false);
      loadData();
      alert('Assinatura cancelada com sucesso! Seu acesso continuará até o final do período pago.');
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      alert('Erro ao cancelar assinatura. Tente novamente.');
    }
  };

  const handleViewSubscriptionDetails = async () => {
    try {
      const response = await api.post('/stripe/customer-portal', {
        return_url: `${window.location.origin}/subscription`
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Erro ao abrir portal:', error);
      alert('Erro ao abrir portal de gerenciamento. Tente novamente.');
    }
  };

  const handleRemoveCard = async (cardId) => {
    if (!confirm('Deseja remover este cartão?')) return;
    
    try {
      await api.delete(`/api/v1/subscriptions/payment-methods/${cardId}`);
      loadData();
      alert('Cartão removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover cartão:', error);
      alert('Erro ao remover cartão. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando informações da assinatura...</p>
      </div>
    );
  }

  const renderSuccessMessage = () => {
    if (!showSuccessMessage) return null;
    
    return (
      <div className="pmsg success" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Check size={18} />
        <span>Assinatura realizada com sucesso. Sua conta já está ativa.</span>
      </div>
    );
  };

  if (error) {
    return (
      <div className="subscription-empty">
        <AlertCircle size={64} />
        <h2>Erro ao Carregar</h2>
        <p>{error}</p>
        <button onClick={loadData} className="btn-primary">Tentar Novamente</button>
      </div>
    );
  }

  // Não remover este bloco - usuários sempre terão subscription (Free ou paga)
  if (!subscription) {
    return (
      <div className="subscription-empty">
        <AlertCircle size={64} />
        <h2>Erro ao Carregar Assinatura</h2>
        <p>Não foi possível carregar suas informações de assinatura.</p>
        <button onClick={loadData} className="btn-primary">Tentar Novamente</button>
      </div>
    );
  }

  const isFree = subscription.plan_name === 'Free';

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Ativo', className: 'status-active' },
      cancelled: { text: 'Cancelado', className: 'status-cancelled' },
      expired: { text: 'Expirado', className: 'status-expired' },
      pending: { text: 'Pendente', className: 'status-pending' }
    };
    return badges[status] || { text: status, className: 'status-unknown' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statusBadge = getStatusBadge(subscription.status);

  return (
    <div className="subscription-page">
      <div className="page-header">
        <h1>Minha Assinatura</h1>
        <p>Gerencie seu plano, pagamentos e histórico</p>
      </div>

      {renderSuccessMessage()}

      {/* Banner de Upgrade para usuários Free */}
      {isFree && (
        <div className="upgrade-banner">
          <div>
            <h3>Aproveite mais com um plano pago</h3>
            <p>Desbloqueie milhares de consultas mensais e recursos exclusivos.</p>
          </div>
          <a href="/home#pricing" className="upgrade-banner-btn">Ver planos</a>
        </div>
      )}

      {/* Plano Ativo */}
      <div className="subscription-card">
        <div className="card-header">
          <h2>Plano Atual</h2>
          <span className={`status-badge ${statusBadge.className}`}>
            {statusBadge.text}
          </span>
        </div>
        
        <div className="plan-details">
          <div className="plan-main-info">
            <h3>{subscription.plan_name}</h3>
            <div className="plan-limits">
              <div className="limit-item">
                <TrendingUp size={20} />
                <div>
                  <span className="limit-label">Consultas Mensais</span>
                  <span className="limit-value">{subscription.monthly_limit.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="limit-item">
                <DollarSign size={20} />
                <div>
                  <span className="limit-label">Créditos Extras</span>
                  <span className="limit-value">{subscription.extra_credits}</span>
                </div>
              </div>
              {!isFree && (
                <div className="limit-item">
                  <Calendar size={20} />
                  <div>
                    <span className="limit-label">Próxima Renovação</span>
                    <span className="limit-value">{formatDate(subscription.renewal_date)}</span>
                  </div>
                </div>
              )}
              {isFree && (
                <div className="limit-item">
                  <Clock size={20} />
                  <div>
                    <span className="limit-label">Renovação</span>
                    <span className="limit-value">Mensal (Gratuito)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="usage-info">
            <div className="usage-stats">
              <div className="stat">
                <span className="stat-value">{subscription.queries_used}</span>
                <span className="stat-label">Usado</span>
              </div>
              <div className="stat">
                <span className="stat-value">{subscription.queries_remaining}</span>
                <span className="stat-label">Restante</span>
              </div>
              <div className="stat">
                <span className="stat-value">{subscription.total_limit}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
            <div className="usage-bar">
              <div 
                className="usage-bar-fill" 
                style={{ 
                  width: `${(subscription.queries_used / subscription.total_limit * 100).toFixed(1)}%` 
                }}
              />
            </div>
            <span className="usage-percentage">
              {((subscription.queries_used / subscription.total_limit) * 100).toFixed(1)}% utilizado
            </span>
          </div>
        </div>

        <div className="plan-actions">
          {isFree ? (
            <a 
              href="/home#pricing" 
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <TrendingUp size={18} />
              Fazer Upgrade do Plano
            </a>
          ) : (
            <>
              <button 
                className="btn-secondary"
                onClick={handleViewSubscriptionDetails}
              >
                <Eye size={18} />
                Ver Detalhes da Assinatura
              </button>
              {subscription.status === 'active' && (
                <button 
                  className="btn-danger"
                  onClick={() => setShowCancelModal(true)}
                >
                  <X size={18} />
                  Cancelar Assinatura
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cartões Cadastrados */}
      <div className="subscription-card">
        <div className="card-header">
          <h2>Formas de Pagamento</h2>
        </div>
        
        {cards.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} />
            <p>Nenhum cartão cadastrado</p>
            <p className="demo-note">
              <AlertCircle size={16} />
              Demo: Configure o Stripe para adicionar cartões reais
            </p>
          </div>
        ) : (
          <div className="cards-list">
            {cards.map((card) => (
              <div key={card.id} className={`payment-card ${card.is_default ? 'default' : ''}`}>
                <div className="card-icon">
                  <CreditCard size={32} />
                </div>
                <div className="card-info">
                  <div className="card-brand">{card.brand.toUpperCase()}</div>
                  <div className="card-number">•••• •••• •••• {card.last4}</div>
                  <div className="card-expiry">Válido até {card.exp_month}/{card.exp_year}</div>
                </div>
                {card.is_default && (
                  <span className="default-badge">Padrão</span>
                )}
                <button 
                  className="btn-icon-danger"
                  onClick={() => handleRemoveCard(card.id)}
                  title="Remover cartão"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <button className="btn-primary" style={{ marginTop: '1rem' }}>
          <CreditCard size={18} />
          Adicionar Novo Cartão
        </button>
        <p className="demo-note" style={{ marginTop: '0.5rem' }}>
          <AlertCircle size={14} />
          Demo: Integração com Stripe será ativada em breve
        </p>
      </div>

      {/* Histórico de Transações */}
      <div className="subscription-card">
        <div className="card-header">
          <h2>Histórico de Transações</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="transactions-table">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.date)}</td>
                    <td>{transaction.description}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(transaction.status).className}`}>
                        {transaction.status === 'paid' ? (
                          <><Check size={14} /> Pago</>
                        ) : transaction.status === 'pending' ? (
                          <><Clock size={14} /> Pendente</>
                        ) : (
                          <><X size={14} /> Falhou</>
                        )}
                      </span>
                    </td>
                    <td className="amount">{formatCurrency(transaction.amount)}</td>
                    <td>
                      <button className="btn-link">Ver Recibo</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancelar Assinatura</h3>
              <button onClick={() => setShowCancelModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja cancelar sua assinatura?</p>
              <p className="warning-text">
                <AlertCircle size={16} />
                Você perderá acesso aos benefícios do plano atual ao final do período de faturamento.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                Manter Assinatura
              </button>
              <button className="btn-danger" onClick={handleCancelSubscription}>
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
