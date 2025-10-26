import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('[AUTH] Tentando login com:', credentials.username);
      const response = await authAPI.login(credentials);
      console.log('[AUTH] Resposta completa:', response);
      console.log('[AUTH] Response data:', response.data);
      const { access_token, user } = response.data;
      console.log('[AUTH] Token:', access_token);
      console.log('[AUTH] User:', user);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(access_token);
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('[AUTH] Erro no login:', error);
      console.error('[AUTH] Erro response:', error.response);
      console.error('[AUTH] Erro response data:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(access_token);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
