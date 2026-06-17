import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { LeaderboardUser } from '../components/leaderboard/LeaderboardCard';

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [topScore, setTopScore] = useState(0);
  const [weekEnding, setWeekEnding] = useState('4d 12h');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaderboard/top?limit=15'); // Using limit 15 for better list
      
      if (res.data.leaderboard) {
        setLeaderboard(res.data.leaderboard);
        setTotalUsers(res.data.totalUsers);
        setCurrentUserRank(res.data.currentUserRank);
        setTopScore(res.data.topScore);
        if (res.data.weekEnding) setWeekEnding(res.data.weekEnding);
      }
    } catch (err) {
      console.error('Leaderboard fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    totalUsers,
    currentUserRank,
    topScore,
    weekEnding,
    loading,
    refetch: fetchLeaderboard
  };
}
