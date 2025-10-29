import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Database, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Token de redefinição não fornecido.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token: token,
        new_password: formData.password
      });

      setSuccess(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao redefinir senha. O token pode estar expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!tokenValid) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Database size={48} className="login-logo" />
            <h1>DB Empresas</h1>
          </div>

          <div className="message error-message">
            <AlertCircle size={20} />
            <span>Token inválido ou não fornecido. Solicite um novo reset de senha.</span>
          </div>

          <button
            className="btn-primary"
            onClick={() => navigate('/login')}
            style={{marginTop: '20px'}}
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Database size={48} className="login-logo" />
          <h1>Redefinir Senha</h1>
          <p>Digite sua nova senha</p>
        </div>

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
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Nova senha (mínimo 6 caracteres)"
                autoComplete="new-password"
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
          </div>

          <div className="form-group">
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirmar nova senha"
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
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Redefinindo...
              </>
            ) : (
              'Redefinir Senha'
            )}
          </button>

          <div className="toggle-mode">
            <p>
              Lembrou da senha?{' '}
              <a href="#" onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}>
                Voltar para Login
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
