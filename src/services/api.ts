import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Automatic retry for Network Errors (server still booting)
    if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn('Network error detected. Retrying in 3 seconds as the server may still be booting...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return api(originalRequest);
    }

    if (error.response?.status === 503 && error.response?.data?.message?.includes('Database')) {
      console.error('Database connection error detected.');
      window.dispatchEvent(new CustomEvent('app:db-error', { detail: error.response.data }));
      
      // If it's a 503 from DB, we also try a one-time retry after a delay
      if (!originalRequest._dbRetry) {
        originalRequest._dbRetry = true;
        console.warn('DB not ready. Retrying request in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return api(originalRequest);
      }
    }
    if (error.response?.status === 401) {
      // Clear user data and redirect to login if unauthorized
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
