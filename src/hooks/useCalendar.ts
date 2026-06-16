import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface CalendarEventData {
  _id?: string;
  title: string;
  description?: string;
  start: Date | string;
  end: Date | string;
  allDay?: boolean;
  type?: 'study' | 'deadline' | 'personal' | 'exam';
  subject?: string;
  color?: string;
  googleEventId?: string;
  synced?: boolean;
  completed?: boolean;
}

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{status: string, time: string | null}>({status: 'idle', time: null});

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/calendar/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching calendar events', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (event: CalendarEventData) => {
    try {
      const response = await api.post('/calendar/events', event);
      setEvents(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error creating event', error);
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEventData>) => {
    try {
      const response = await api.put(`/calendar/events/${id}`, updates);
      setEvents(prev => prev.map(e => e._id === id ? response.data : e));
      return response.data;
    } catch (error) {
      console.error('Error updating event', error);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.delete(`/calendar/events/${id}`);
      setEvents(prev => prev.filter(e => e._id !== id));
    } catch (error) {
      console.error('Error deleting event', error);
    }
  };

  const syncGoogleCalendar = async () => {
    try {
      setLoading(true);
      setSyncStatus({ status: 'syncing', time: syncStatus.time });
      await api.post('/calendar/sync');
      await fetchEvents();
      // Only set success if we actually fetched
      setSyncStatus({ status: 'synced', time: new Date().toLocaleTimeString() });
    } catch (error) {
      console.error('Error syncing Google Calendar', error);
      setSyncStatus({ status: 'error', time: syncStatus.time });
    } finally {
      setLoading(false);
    }
  };

  const aiSchedule = async (topics: string[], dailyCommitment: string) => {
    try {
      setLoading(true);
      await api.post('/calendar/ai-schedule', { topics, dailyCommitment });
      await fetchEvents();
    } catch (error) {
      console.error('Error generating AI schedule', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    events,
    loading,
    syncStatus,
    fetchEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    syncGoogleCalendar,
    aiSchedule
  };
}
