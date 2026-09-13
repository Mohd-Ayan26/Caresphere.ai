// src/services/api.js — Axios Instance with Auth Interceptors
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL:         process.env.REACT_APP_API_URL || '/api',
  timeout:         30000,
  headers:         { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cs_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait a moment.');
    }
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export default api;
