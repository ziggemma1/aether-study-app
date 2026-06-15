import { useState, useEffect } from 'react';
import api from '../services/api';

export function useReports(period: 'week' | 'month' | 'all') {
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get('/reports/summary').then(res => res.data),
      api.get(`/reports/trends?period=${period}`).then(res => res.data),
      api.get('/reports/subject-proficiency').then(res => res.data),
      api.get('/leaderboard/top?limit=5').then(res => res.data)
    ])
      .then(([summaryData, trendsData, subjectsData, leaderboardData]) => {
        if (!active) return;
        setSummary(summaryData);
        setTrends(trendsData);
        setSubjects(subjectsData?.subjects || []);
        setLeaderboard(leaderboardData);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        console.error('[USE_REPORTS_ERROR]', err);
        setError('Failed to load performance reports.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [period]);

  return { summary, trends, subjects, leaderboard, loading, error };
}
