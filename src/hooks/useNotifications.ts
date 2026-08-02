import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export interface NotificationItem {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type:
    | 'friend_request'
    | 'friend_accepted'
    | 'achievement'
    | 'nudge'
    | 'streak_milestone'
    | 'quiz_complete'
    | 'general';
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const hasSeededRef = useRef(false);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (showLoading) setLoading(true);
    
    try {
      // Writes the welcome notification for a new account. It's a no-op once
      // any notification exists, so it only needs to run on the first fetch —
      // not on every 30s poll for the life of the session.
      if (!hasSeededRef.current) {
        hasSeededRef.current = true;
        await api.post('/notifications/seed').catch(() => {});
      }

      const response = await api.get('/notifications/unread');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const markAsRead = useCallback(async (notificationId?: string) => {
    try {
      await api.post('/notifications/mark-read', { notificationId });
      
      // Update local state optimizing for lag-free instant response
      if (notificationId) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking notification(s) as read:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    
    // Poll for notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refetch: () => fetchNotifications(false)
  };
}
