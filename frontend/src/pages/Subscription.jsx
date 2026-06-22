import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  CreditCard,
  Check,
  X,
  TrendingUp,
  Eye,
  Trash2,
  AlertCircle,
} from 'lucide-react';

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
        api.get('/api/v1/subscriptions/my-subscription').catch((err) => {
          console.error('Erro ao buscar assinatura:', err);
          return { data: null };
        }),
        api.get('/api/v1/subscriptions/transactions').catch((err) => {
          console.error('Erro ao buscar transações:', err);
          return { data: [] };
        }),
        api.get('/api/v1/subscriptions/payment-methods').catch((err) => {
          console.error('Erro ao buscar métodos de pagamento:', err);
          return { data: [] };
        }),
      ]);

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
      alert('Assinatura cancelada com sucesso. Seu acesso continua até o final do período pago.');
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      alert('Erro ao cancelar assinatura. Tente novamente.');
    }
  };

  const handleViewSubscriptionDetails = async () => {
    try {
      const response = await api.post('/stripe/customer-portal', {
        return_url: `${window.location.origin}/subscription`,
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
      alert('Cartão removido com sucesso.');
    } catch (error) {
      console.error('Erro ao remover cartão:', error);
      alert('Erro ao remover cartão. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Carregando informações da assinatura...</p>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="pg">
        <div className="pcard">
          <div className="pempty">
            <AlertCircle size={34} className="ico" />
            <h3>Não foi possível carregar a assinatura</h3>
            <p>{error || 'Tente novamente em alguns instantes.'}</p>
            <button onClick={loadData} className="btn-flat primary">Tentar novamente</button>
          </div>
        </div>
      </div>
    );
  }

  const isFree = subscription.plan_name === 'Free';

  const statusMap = {
    active: { text: 'Ativo', cls: 'green' },
    cancelled: { text: 'Cancelado', cls: 'red' },
    expired: { text: 'Expirado', cls: 'gray' },
    pending: { text: 'Pendente', cls: 'blue' },
  };
  const statusBadge = statusMap[subscription.status] || { text: subscription.status, cls: 'gray' };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const total = subscription.total_limit || 0;
  const used = subscription.queries_used || 0;
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const barCls = pct >= 90 ? 'over' : pct >= 70 ? 'warn' : '';

  return (
    <div className="pg">
      <div className="pg-head">
        <div>
          <h1>Minha assinatura</h1>
          <p>Gerencie seu plano, pagamentos e histórico</p>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="pmsg success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} />
          <span>Assinatura realizada com sucesso. Sua conta já está ativa.</span>
        </div>
      )}

      {isFree && (
        <div className="upgrade-banner">
          <div>
            <h3>Aproveite mais com um plano pago</h3>
            <p>Desbloqueie milhares de consultas mensais e recursos exclusivos.</p>
          </div>
          <a href="/home#pricing" className="upgrade-banner-btn">Ver planos</a>
        </div>
      )}

      {/* Plano atual */}
      <div className="pcard">
        <div className="pcard-head">
          <div>
            <h2>Plano atual</h2>
            <p className="sub">Detalhes e consumo do ciclo</p>
          </div>
          <span className={`pbadge ${statusBadge.cls}`}>{statusBadge.text}</span>
        </div>
        <div className="pcard-body">
          <h3 className="plan-name">{subscription.plan_name}</h3>

          <div className="pmetrics">
            <div>
              <span className="k">Usado</span>
              <span className="v">{used.toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <span className="k">Restante</span>
              <span className="v">{(subscription.queries_remaining || 0).toLocaleString('pt-BR')}</span>
            </div>
            <div>
              <span className="k">Total</span>
              <span className="v">{total.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div>
            <div className="usage-head">
              <span><span className="uused">{used.toLocaleString('pt-BR')}</span> de {total.toLocaleString('pt-BR')} consultas</span>
              <span>{pct.toFixed(1)}%</span>
            </div>
            <div className="ubar">
              <div className={`ubar-fill ${barCls}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="dlist" style={{ marginTop: '20px' }}>
            <div className="dlist-row">
              <span className="k">Consultas mensais</span>
              <span className="v">{(subscription.monthly_limit || 0).toLocaleString('pt-BR')}</span>
            </div>
            <div className="dlist-row">
              <span className="k">Créditos extras</span>
              <span className="v">{(subscription.extra_credits || 0).toLocaleString('pt-BR')}</span>
            </div>
            <div className="dlist-row">
              <span className="k">{isFree ? 'Renovação' : 'Próxima renovação'}</span>
              <span className="v">{isFree ? 'Mensal (gratuito)' : formatDate(subscription.renewal_date)}</span>
            </div>
          </div>
        </div>
        <div className="pcard-foot">
          {isFree ? (
            <a href="/home#pricing" className="btn-flat primary" style={{ textDecoration: 'none' }}>
              <TrendingUp size={16} /> Fazer upgrade
            </a>
          ) : (
            <>
              <button className="btn-flat ghost" onClick={handleViewSubscriptionDetails}>
                <Eye size={16} /> Ver detalhes
              </button>
              {subscription.status === 'active' && (
                <button className="btn-flat danger" onClick={() => setShowCancelModal(true)}>
                  <X size={16} /> Cancelar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Formas de pagamento */}
      <div className="pcard">
        <div className="pcard-head">
          <h2>Formas de pagamento</h2>
        </div>
        <div className="pcard-body">
          {cards.length === 0 ? (
            <div className="pempty">
              <CreditCard size={30} className="ico" />
              <h3>Nenhum cartão cadastrado</h3>
              <p>A integração de pagamento será ativada em breve.</p>
            </div>
          ) : (
            cards.map((card) => (
              <div className="pay-row" key={card.id}>
                <div className="pay-brand"><CreditCard size={18} /></div>
                <div className="pay-info">
                  <span className="num">{(card.brand || '').toUpperCase()} •••• {card.last4}</span>
                  <span className="exp">Válido até {card.exp_month}/{card.exp_year}</span>
                </div>
                {card.is_default && <span className="pbadge gray">Padrão</span>}
                <button className="btn-icon del" onClick={() => handleRemoveCard(card.id)} aria-label="Remover cartão">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Histórico de transações */}
      <div className="pcard">
        <div className="pcard-head">
          <h2>Histórico de transações</h2>
        </div>
        <div className="pcard-body">
          {transactions.length === 0 ? (
            <div className="pempty">
              <CreditCard size={30} className="ico" />
              <h3>Nenhuma transação</h3>
              <p>Suas cobranças aparecerão aqui.</p>
            </div>
          ) : (
            <table className="ptable">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const tcls = t.status === 'paid' ? 'green' : t.status === 'pending' ? 'blue' : 'red';
                  const ttext = t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : 'Falhou';
                  return (
                    <tr key={t.id}>
                      <td>{formatDate(t.date)}</td>
                      <td>{t.description}</td>
                      <td><span className={`pbadge ${tcls}`}>{ttext}</span></td>
                      <td className="amount">{formatCurrency(t.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de cancelamento */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 10px' }}>Cancelar assinatura</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 18px', lineHeight: 1.6 }}>
              Tem certeza que deseja cancelar? Você perderá os benefícios do plano ao final do período de faturamento já pago.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-flat ghost" onClick={() => setShowCancelModal(false)}>Manter assinatura</button>
              <button className="btn-flat danger" onClick={handleCancelSubscription}>Confirmar cancelamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
