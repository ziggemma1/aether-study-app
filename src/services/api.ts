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
if (error.code === 'ERR_NETWORK') {
  const retryCount = originalRequest._retryCount || 0;
  if (retryCount < 20) {
    originalRequest._retryCount = retryCount + 1;
    console.warn(`Network error detected. Retry ${originalRequest._retryCount}/20 in 3 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    return api(originalRequest);
  }
}

if (error.response?.status === 503 && error.response?.data?.message?.includes('Database')) {
  console.error('Database connection error detected.');
  window.dispatchEvent(new CustomEvent('app:db-error', { detail: error.response.data }));
  
  // If it's a 503 from DB, retry many times to cover cold start (approx 2 mins)
  const dbRetryCount = originalRequest._dbRetryCount || 0;
  if (dbRetryCount < 20) {
    originalRequest._dbRetryCount = dbRetryCount + 1;
    console.warn(`DB not ready. Retry ${originalRequest._dbRetryCount}/20 in 5 seconds...`);
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
