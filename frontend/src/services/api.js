import axios from 'axios';

// Em produção (deployment), usa a mesma origem
// Em desenvolvimento, usa proxy do Vite
const baseURL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || '');

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Requisição com token:', config.method.toUpperCase(), config.url);
    } else {
      console.warn('[API] Requisição SEM token:', config.method.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('[API] Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('[API] ✅ Resposta recebida:', response.config.method.toUpperCase(), response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('[API] ❌ Erro na requisição:', error.config?.method?.toUpperCase(), error.config?.url);
    console.error('[API] Status:', error.response?.status, 'Erro:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.warn('[API] Token inválido ou expirado. Redirecionando para login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

const API_V1 = '/api/v1';

export const cnpjAPI = {
  search: (params) => api.get(`${API_V1}/search`, { params }),
  getByCNPJ: (cnpj) => api.get(`${API_V1}/cnpj/${cnpj}`),
  getStats: () => api.get(`${API_V1}/stats`),
  getSocios: (cnpj) => api.get(`${API_V1}/cnpj/${cnpj}/socios`),
  getCNAEs: (search) => api.get(`${API_V1}/cnaes`, { params: { search } }),
  getMunicipios: (uf) => api.get(`${API_V1}/municipios/${uf}`),
};

export const etlAPI = {
  startETL: () => api.post(`${API_V1}/etl/start`),
  stopETL: () => api.post(`${API_V1}/etl/stop`),
  getStatus: () => api.get(`${API_V1}/etl/status`),
  checkUpdates: () => api.get(`${API_V1}/etl/check-updates`),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getAPIKeys: () => api.get('/user/api-keys'),
  createAPIKey: (data) => api.post('/user/api-keys', data),
  deleteAPIKey: (id) => api.delete(`/user/api-keys/${id}`),
  getUsage: () => api.get('/user/usage'),
};

export const emailLogsAPI = {
  getEmailLogs: (params) => api.get('/admin/email-logs', { params }),
  getFollowupTracking: (params) => api.get('/admin/followup-tracking', { params }),
  getUsageNotifications: (params) => api.get('/admin/usage-notifications', { params }),
};

export const subscriptionAPI = {
  getMySubscription: () => api.get('/api/v1/subscriptions/my-subscription'),
  getPlans: () => api.get('/api/v1/subscriptions/plans'),
  getUsage: () => api.get('/api/v1/subscriptions/usage'),
};

// Exportar api para uso em outros componentes
export { api };
export default api;