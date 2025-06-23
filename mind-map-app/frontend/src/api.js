// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/mind-map-app/api',
  withCredentials: true, // Esto es crucial para enviar cookies/tokens
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirigir a login o manejar sesión expirada
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;