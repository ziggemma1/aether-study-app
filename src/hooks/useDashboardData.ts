import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  joinDate: string;
  streak: number;
  /** Best streak ever reached, for "what you stand to lose" context. */
  longestStreak: number;
  totalStudyTime: number;
  averageQuizScore: number;
  /** How many scored quizzes the average is drawn from. */
  quizCount: number;
  rank: number;
  totalLearners: number;
}

export interface WeeklyStudyDay {
  day: string;
  minutes: number;
}

export interface StudyStats {
  weeklyData: WeeklyStudyDay[];
  peak: number;
  floor: number;
  average: number;
}

export interface RecentMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'quiz' | 'note' | 'flashcard';
  uploadDate: string;
  thumbnail: string | null;
  progress: number;
}

export function useDashboardData() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<RecentMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, statsRes, materialsRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/user/study-stats'),
        api.get('/materials/recent')
      ]);

      setUser(profileRes.data);
      setStats(statsRes.data);
      setRecentMaterials(materialsRes.data?.materials || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    user,
    stats,
    recentMaterials,
    loading,
    error,
    refetch: fetchData
  };
}
