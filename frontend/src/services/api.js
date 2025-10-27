import axios from 'axios';

// Em desenvolvimento no Replit, usar a URL do workspace
const baseURL = import.meta.env.VITE_API_URL || (
  window.location.hostname.includes('replit.dev') 
    ? `https://${window.location.hostname.split('-')[0]}-00-${window.location.hostname.split('-00-')[1].split('.')[0]}.${window.location.hostname.split('.').slice(-2).join('.')}:8000`
    : 'http://localhost:8000'
);
console.log('[API] Base URL configurada:', baseURL);

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
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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

export const cnpjAPI = {
  search: (params) => api.get('/search', { params }),
  getByCNPJ: (cnpj) => api.get(`/cnpj/${cnpj}`),
  getStats: () => api.get('/stats'),
  getSocios: (cnpj) => api.get(`/cnpj/${cnpj}/socios`),
  getCNAEs: (search) => api.get('/cnaes', { params: { search } }),
  getMunicipios: (uf) => api.get(`/municipios/${uf}`),
};

export const etlAPI = {
  startETL: () => api.post('/etl/start'),
  stopETL: () => api.post('/etl/stop'),
  getStatus: () => api.get('/etl/status'),
  checkUpdates: () => api.get('/etl/check-updates'),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getAPIKeys: () => api.get('/user/api-keys'),
  createAPIKey: (data) => api.post('/user/api-keys', data),
  deleteAPIKey: (id) => api.delete(`/user/api-keys/${id}`),
  getUsage: () => api.get('/user/usage'),
};

// Exportar api para uso em outros componentes
export { api };
export default api;