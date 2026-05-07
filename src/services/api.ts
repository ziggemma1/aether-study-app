import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
// Automatic retry for Network Errors (server still booting or slow network)
if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
  const retryCount = originalRequest._retryCount || 0;
  if (retryCount < 100) { // Extreme persistence
    originalRequest._retryCount = retryCount + 1;
    await new Promise(resolve => setTimeout(resolve, 3000));
    return api(originalRequest);
  }
}

if (error.response?.status === 503 && error.response?.data?.message?.includes('Database')) {
  window.dispatchEvent(new CustomEvent('app:db-error', { detail: error.response.data }));
  
  // If it's a 503 from DB, retry many times to cover cold start or slow provisioning
  const dbRetryCount = originalRequest._dbRetryCount || 0;
  if (dbRetryCount < 100) {
    originalRequest._dbRetryCount = dbRetryCount + 1;
    await new Promise(resolve => setTimeout(resolve, 5000));
    return api(originalRequest);
  }
}
    if (error.response?.status === 401) {
      // Clear user data but don't force redirect here, handle in components
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
    }
    
    if (error.response?.status === 500) {
      const serverError = error.response?.data;
      console.error('❌ API 500 ERROR:', {
        url: error.config?.url,
        fullData: serverError
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;
