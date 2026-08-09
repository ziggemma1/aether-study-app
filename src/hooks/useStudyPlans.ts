import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export interface DayActivity {
  day: number;
  date: string | Date;
  topic: string;
  activities: string[];
  estimatedTime: number; // in mins
  completed: boolean;
}

export interface ClientStudyPlan {
  id?: string;
  _id?: string;
  title: string;
  goal: string;
  complexity: string;
  dailyCommitment: number;
  startDate: string | Date;
  endDate: string | Date;
  days: DayActivity[];
  totalHours: number;
  materialIds?: string[];
  calendarSync?: boolean;
  /** False when both AI providers were unavailable and the schedule is the
   *  deterministic template. Only present on a freshly generated plan. */
  aiGenerated?: boolean;
}

export function useStudyPlans() {
  const [studyPlans, setStudyPlans] = useState<ClientStudyPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // `error` distinguishes "you have no plans" from "we could not load them".
  // Without it the list rendered a confident empty state on every failure.
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchStudyPlans = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await api.get('/study-plans');
      setStudyPlans(response.data || []);
      setError(null);
    } catch (e: any) {
      console.error('Failed to fetch study plans:', e);
      setError(e?.response?.data?.message || 'We could not load your study plans.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const getPlanById = useCallback(async (id: string): Promise<ClientStudyPlan | null> => {
    try {
      const response = await api.get(`/study-plans/${id}`);
      return response.data;
    } catch (e) {
      console.error(`Failed to get plan ${id}:`, e);
      return null;
    }
  }, []);

  const generatePlan = useCallback(async (settings: {
    materialIds: string[];
    startDate: string;
    duration: number;
    goal: string;
    complexity: string;
    dailyCommitment: number;
    preferredTime?: string;
    focusAreas?: string[];
    calendarSync?: boolean;
  }): Promise<ClientStudyPlan> => {
    // Throws instead of returning null. Swallowing the error here meant the
    // page could only ever say "Generation failed. Ensure system is connected."
    // — the server's actual reason (bad start date, rate limit, AI quota) was
    // discarded before anyone could show it.
    setLoading(true);
    try {
      const response = await api.post('/study-plans/generate', settings);
      setStudyPlans(prev => [response.data, ...prev]);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlan = useCallback(async (id: string, updates: Partial<ClientStudyPlan>): Promise<ClientStudyPlan | null> => {
    try {
      const response = await api.put(`/study-plans/${id}`, updates);
      setStudyPlans(prev => prev.map(p => {
        const pId = p.id || p._id;
        return (pId === id) ? response.data : p;
      }));
      return response.data;
    } catch (e) {
      console.error(`Failed to update plan ${id}:`, e);
      return null;
    }
  }, []);

  const deletePlan = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/study-plans/${id}`);
      setStudyPlans(prev => prev.filter(p => (p.id || p._id) !== id));
      return true;
    } catch (e) {
      console.error(`Failed to delete plan ${id}:`, e);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchStudyPlans();
  }, [fetchStudyPlans]);

  return {
    studyPlans,
    loading,
    error,
    fetchStudyPlans,
    getPlanById,
    generatePlan,
    updatePlan,
    deletePlan
  };
}
