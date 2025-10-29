
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Database, Mail, Lock, User as UserIcon, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const Login = () => {
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  const [isLogin, setIsLogin] = useState(planParam !== 'free');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [validations, setValidations] = useState({
    username: { valid: null, message: '' },
    email: { valid: null, message: '' },
    password: { valid: null, message: '' },
    confirmPassword: { valid: null, message: '' },
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const activatedParam = searchParams.get('activated');

  useEffect(() => {
    if (activatedParam === 'true') {
      setSuccess('Conta ativada com sucesso! Faça login para continuar.');
      setIsLogin(true);
    }
  }, [activatedParam]);

  // Validações em tempo real
  useEffect(() => {
    if (!isLogin) {
      validateField('username', formData.username);
      validateField('email', formData.email);
      validateField('password', formData.password);
      if (formData.confirmPassword) {
        validateField('confirmPassword', formData.confirmPassword);
      }
    }
  }, [formData, isLogin]);

  const validateField = (field, value) => {
    const newValidations = { ...validations };

    switch (field) {
      case 'username':
        if (!value) {
          newValidations.username = { valid: null, message: '' };
        } else if (value.length < 3) {
          newValidations.username = { valid: false, message: 'Mínimo 3 caracteres' };
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newValidations.username = { valid: false, message: 'Apenas letras, números e _' };
        } else {
          newValidations.username = { valid: true, message: 'Username válido' };
        }
        break;

      case 'email':
        if (!value) {
          newValidations.email = { valid: null, message: '' };
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newValidations.email = { valid: false, message: 'Email inválido' };
        } else {
          newValidations.email = { valid: true, message: 'Email válido' };
        }
        break;

      case 'password':
        if (!value) {
          newValidations.password = { valid: null, message: '' };
        } else if (value.length < 6) {
          newValidations.password = { valid: false, message: 'Mínimo 6 caracteres' };
        } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) {
          newValidations.password = { valid: false, message: 'Precisa de letras e números' };
        } else {
          newValidations.password = { valid: true, message: 'Senha forte' };
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newValidations.confirmPassword = { valid: null, message: '' };
        } else if (value !== formData.password) {
          newValidations.confirmPassword = { valid: false, message: 'Senhas não coincidem' };
        } else {
          newValidations.confirmPassword = { valid: true, message: 'Senhas coincidem' };
        }
        break;
    }

    setValidations(newValidations);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const result = await login({ username: formData.username, password: formData.password });
        
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
                  cancel_url: `${window.location.origin}/home#pricing`
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
      } else {
        // REGISTRO - validar campos antes
        if (!validations.username.valid || !validations.email.valid || 
            !validations.password.valid || !validations.confirmPassword.valid) {
          setError('Por favor, corrija os erros no formulário');
          setLoading(false);
          return;
        }

        try {
          const response = await api.post('/auth/register', {
            username: formData.username,
            email: formData.email,
            password: formData.password
          });
          
          if (response.data.message && response.data.email) {
            setSuccess(`✅ Conta criada com sucesso! Enviamos um email para ${response.data.email} com o link de ativação. Verifique sua caixa de entrada (e spam).`);
            setIsLogin(true);
            setFormData({
              username: '',
              email: '',
              password: '',
              confirmPassword: '',
            });
            setValidations({
              username: { valid: null, message: '' },
              email: { valid: null, message: '' },
              password: { valid: null, message: '' },
              confirmPassword: { valid: null, message: '' },
            });
          }
        } catch (registerError) {
          if (registerError.response?.data?.detail) {
            setError(registerError.response.data.detail);
          } else {
            setError('Erro ao criar conta. Tente novamente.');
          }
        }
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');

    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      setResetMessage('✅ Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.');
      setResetEmail('');
    } catch (err) {
      setResetMessage('❌ Erro ao solicitar redefinição de senha. Tente novamente.');
    } finally {
      setResetLoading(false);
    }
  };

  const planNames = {
    'free': 'Free',
    'start': 'Start',
    'growth': 'Growth',
    'pro': 'Pro'
  };

  const getInputClassName = (field) => {
    if (!isLogin && validations[field]) {
      if (validations[field].valid === true) return 'input-valid';
      if (validations[field].valid === false) return 'input-invalid';
    }
    return '';
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
          <div className="plan-banner">
            {planParam === 'free' 
              ? '🎉 Plano Free selecionado - Comece grátis agora!'
              : `✨ Plano ${planNames[planParam]} selecionado - Faça login para continuar o pagamento`
            }
          </div>
        )}

        {showResetPassword ? (
          <form onSubmit={handleResetPassword} className="login-form">
            <p style={{color: 'var(--gray)', marginBottom: '20px', textAlign: 'center'}}>
              Digite seu email para receber instruções de redefinição de senha.
            </p>

            {resetMessage && (
              <div className={`message ${resetMessage.includes('❌') ? 'error-message' : 'success-message'}`}>
                <span>{resetMessage}</span>
              </div>
            )}

            <div className="form-group">
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="Seu e-mail cadastrado"
                  autoComplete="email"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={resetLoading}>
              {resetLoading ? (
                <>
                  <span className="spinner"></span>
                  Enviando...
                </>
              ) : (
                'Enviar Link de Redefinição'
              )}
            </button>

            <div className="toggle-mode">
              <p>
                Lembrou da senha?{' '}
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  setShowResetPassword(false);
                  setResetMessage('');
                  setResetEmail('');
                }}>
                  Voltar para Login
                </a>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="message error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="message success-message">
                <CheckCircle size={20} />
                <span>{success}</span>
              </div>
            )}

            <div className="form-group">
            <div className={`input-with-icon ${getInputClassName('username')}`}>
              <UserIcon size={18} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder={isLogin ? "Usuário ou E-mail" : "Nome de Usuário"}
                autoComplete="username"
              />
              {!isLogin && validations.username.valid === true && <CheckCircle size={18} className="icon-success" />}
              {!isLogin && validations.username.valid === false && <AlertCircle size={18} className="icon-error" />}
            </div>
            {!isLogin && validations.username.message && (
              <small className={validations.username.valid ? 'text-success' : 'text-error'}>
                {validations.username.message}
              </small>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <div className={`input-with-icon ${getInputClassName('email')}`}>
                <Mail size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="E-mail"
                  autoComplete="email"
                />
                {validations.email.valid === true && <CheckCircle size={18} className="icon-success" />}
                {validations.email.valid === false && <AlertCircle size={18} className="icon-error" />}
              </div>
              {validations.email.message && (
                <small className={validations.email.valid ? 'text-success' : 'text-error'}>
                  {validations.email.message}
                </small>
              )}
            </div>
          )}

          <div className="form-group">
            <div className={`input-with-icon ${getInputClassName('password')}`}>
              <Lock size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={isLogin ? "Senha" : "Senha (mínimo 6 caracteres)"}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!isLogin && validations.password.message && (
              <small className={validations.password.valid ? 'text-success' : 'text-error'}>
                {validations.password.message}
              </small>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <div className={`input-with-icon ${getInputClassName('confirmPassword')}`}>
                <Lock size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirmar Senha"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {validations.confirmPassword.valid === true && <CheckCircle size={18} className="icon-success" />}
                {validations.confirmPassword.valid === false && <AlertCircle size={18} className="icon-error" />}
              </div>
              {validations.confirmPassword.message && (
                <small className={validations.confirmPassword.valid ? 'text-success' : 'text-error'}>
                  {validations.confirmPassword.message}
                </small>
              )}
            </div>
          )}

          {isLogin && !showResetPassword && (
            <div className="forgot-password-link">
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setShowResetPassword(true);
                setError('');
                setSuccess('');
                setResetMessage('');
              }}>
                Esqueceu sua senha?
              </a>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                {isLogin ? 'Entrando...' : 'Criando conta...'}
              </>
            ) : (
              isLogin ? 'Entrar' : 'Cadastrar'
            )}
          </button>

          <div className="toggle-mode">
            {isLogin ? (
              <p>
                Não tem uma conta?{' '}
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  setIsLogin(false);
                  setError('');
                  setSuccess('');
                }}>
                  Cadastre-se
                </a>
              </p>
            ) : (
              <p>
                Já tem uma conta?{' '}
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  setIsLogin(true);
                  setError('');
                  setSuccess('');
                }}>
                  Entrar
                </a>
              </p>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default Login;
