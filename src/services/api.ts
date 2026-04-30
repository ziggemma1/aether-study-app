import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const authApi = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  getGoogleUrl: () => api.get('/auth/google'),
};

export const materialApi = {
  getAll: () => api.get('/materials'),
  getPublic: () => api.get('/materials/public'),
  create: (data: any) => api.post('/materials', data),
  update: (id: string, data: any) => api.patch(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
  togglePublic: (id: string) => api.patch(`/materials/${id}/public`),
  clone: (id: string) => api.post(`/materials/${id}/clone`),
};

export const userApi = {
  getProfiles: () => api.get('/users/profiles'),
  updateProfile: (data: any) => api.patch('/users/profile', data),
  sendFriendRequest: (receiverId: string) => api.post('/users/friend-request', { receiverId }),
  getFriendRequests: () => api.get('/users/friend-requests'),
  respondToFriendRequest: (requestId: string, status: 'accepted' | 'declined') => 
    api.post('/users/friend-request/respond', { requestId, status }),
};

export default api;
