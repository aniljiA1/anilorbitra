import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
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

// AUTH
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ITINERARIES
export const itineraryAPI = {
  upload: (formData, onUploadProgress) =>
    api.post('/itineraries/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min for large files
      onUploadProgress,
    }),
  getAll: (params) => api.get('/itineraries', { params }),
  getOne: (id) => api.get(`/itineraries/${id}`),
  getStatus: (id) => api.get(`/itineraries/${id}/status`),
  delete: (id) => api.delete(`/itineraries/${id}`),
  share: (id) => api.post(`/itineraries/${id}/share`),
  unshare: (id) => api.post(`/itineraries/${id}/unshare`),
  getShared: (token) => api.get(`/itineraries/shared/${token}`),
};

export default api;
