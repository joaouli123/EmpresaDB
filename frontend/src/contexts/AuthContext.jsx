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
      console.log('[AUTH] Verificando autenticação...');
      const response = await authAPI.getMe();
      console.log('[AUTH] Resposta /auth/me:', response.data);

      // Verificar se a resposta contém um erro
      if (response.data && response.data.error) {
        console.error('[AUTH] Backend retornou erro:', response.data.error);
        // Tentar usar dados do localStorage
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            console.log('[AUTH] ✅ Usando dados do cache:', parsedUser.username);
            return;
          } catch (e) {
            console.error('[AUTH] Erro ao parsear user do cache:', e);
          }
        }
        logout();
        return;
      }

      if (!response.data || !response.data.id) {
        console.error('[AUTH] Resposta inválida do /auth/me:', response.data);
        // Tentar usar dados do localStorage
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            console.log('[AUTH] ✅ Usando dados do cache:', parsedUser.username);
            return;
          } catch (e) {
            console.error('[AUTH] Erro ao parsear user do cache:', e);
          }
        }
        logout();
        return;
      }

      // Salvar no cache para uso futuro
      localStorage.setItem('user', JSON.stringify(response.data));
      setUser(response.data);
      console.log('[AUTH] ✅ Usuário autenticado:', response.data.username, '(role:', response.data.role + ')');
    } catch (error) {
      console.error('[AUTH] ❌ Erro ao verificar autenticação:', error);
      console.error('[AUTH] Erro detalhado:', error.response?.data);

      // Tentar usar dados do localStorage antes de fazer logout
      const cachedUser = localStorage.getItem('user');
      if (cachedUser && error.response?.status !== 401) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          console.log('[AUTH] ✅ Usando dados do cache após erro:', parsedUser.username);
          return;
        } catch (e) {
          console.error('[AUTH] Erro ao parsear user do cache:', e);
        }
      }

      // Fazer logout apenas em caso de 401 ou se não houver cache
      if (error.response?.status === 401) {
        console.warn('[AUTH] Token inválido. Fazendo logout...');
        logout();
      } else if (!cachedUser) {
        console.warn('[AUTH] Sem cache disponível. Fazendo logout...');
        logout();
      }
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