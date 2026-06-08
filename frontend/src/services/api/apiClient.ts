import axios from 'axios';
import { APP_CONFIG, API_CONFIG } from '../../utils/constants';

export const apiClient = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена авторизации
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор для повторных попыток
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only retry on server errors (5xx) and if we have a valid request config
    if (error.response?.status >= 500 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      for (let i = 0; i < API_CONFIG.RETRY_ATTEMPTS; i++) {
        try {
          await new Promise(resolve => 
            setTimeout(resolve, API_CONFIG.RETRY_DELAY * (i + 1))
          );
          return apiClient(originalRequest);
        } catch (retryError) {
          if (i === API_CONFIG.RETRY_ATTEMPTS - 1) {
            throw retryError;
          }
        }
      }
    }
    
    throw error;
  }
);