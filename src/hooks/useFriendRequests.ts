import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

export interface FriendRequest {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    avatar: string;
    streak: number;
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export function useFriendRequests() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/friend-requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendRequest = async (receiverId: string) => {
    try {
      const res = await api.post('/users/friend-request', { receiverId });
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to send request' };
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const res = await api.post('/users/friend-request/respond', { requestId, status });
      setRequests(prev => prev.filter(r => r._id !== requestId));
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to respond' };
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    sendRequest,
    respondToRequest,
    refresh: fetchRequests
  };
}
