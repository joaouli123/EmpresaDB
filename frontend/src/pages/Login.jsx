import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Database, Mail, Lock, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const planParam = searchParams.get('plan');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin
        ? await login({ username: formData.username, password: formData.password })
        : await register(formData);

      if (result.success) {
        if (planParam && planParam !== 'free') {
          const planIds = {
            'start': 2,
            'growth': 3,
            'pro': 4
          };
          
          const planId = planIds[planParam];
          
          if (planId) {
            try {
              const checkoutResponse = await api.post('/stripe/create-checkout-session', {
                plan_id: planId,
                success_url: `${window.location.origin}/subscription?success=true`,
                cancel_url: `${window.location.origin}/pricing?canceled=true`
              });
              
              if (checkoutResponse.data.url) {
                window.location.href = checkoutResponse.data.url;
                return;
              }
            } catch (checkoutError) {
              console.error('Erro ao criar checkout:', checkoutError);
              setError('Erro ao iniciar pagamento. Redirecionando para dashboard...');
              setTimeout(() => navigate('/dashboard'), 2000);
              return;
            }
          }
        }
        
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const planNames = {
    'free': 'Free',
    'start': 'Start',
    'growth': 'Growth',
    'pro': 'Pro'
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Database size={48} className="login-logo" />
          <h1>Sistema CNPJ</h1>
          <p>Consulta e Gestão de Dados da Receita Federal</p>
        </div>

        {planParam && (
          <div style={{
            padding: '12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {planParam === 'free' 
              ? '🎉 Plano Free selecionado - Comece grátis agora!'
              : `✨ Plano ${planNames[planParam]} selecionado - Faça login para continuar o pagamento`
            }
          </div>
        )}

        <div className="login-tabs">
          <button
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Entrar
          </button>
          <button
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <div className="input-with-icon">
              <UserIcon size={18} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder={isLogin ? "Usuário ou e-mail" : "Usuário"}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="E-mail"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Senha"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
