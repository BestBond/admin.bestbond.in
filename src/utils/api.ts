import axios, { isAxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor: add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect if it's the login request failing
      const isLoginRequest = error.config.url.includes('/auth/admin/otp/login');
      
      if (!isLoginRequest) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { isAxiosError };
export default api;
