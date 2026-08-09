import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export type LeaderboardRange = 'week' | 'all';

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string | null;
  handle: string | null;
  points: number;
  streak: number;
  /** Minutes. Weekly view counts only sessions inside the window. */
  studyMinutes: number;
  quizzes: number;
  sessions: number;
}

const PAGE = 10;

export function useLeaderboard(range: LeaderboardRange) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardEntry | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [resetsAt, setResetsAt] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  // The old hook logged fetch failures to the console and left the list empty,
  // so a 500 or a dropped connection rendered as "nobody is on the board yet".
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (nextLimit: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/leaderboard/top', { params: { limit: nextLimit, range } });
      setLeaderboard(res.data.leaderboard || []);
      setCurrentUser(res.data.currentUser || null);
      setTotalUsers(res.data.totalUsers || 0);
      setTopScore(res.data.topScore || 0);
      setResetsAt(res.data.resetsAt || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "We couldn't load the leaderboard.");
      setLeaderboard([]);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  // Reset the page size when the range changes, or "show more" would carry an
  // expanded all-time list straight into a much shorter weekly one.
  useEffect(() => {
    setLimit(PAGE);
  }, [range]);

  useEffect(() => {
    fetchLeaderboard(limit);
  }, [fetchLeaderboard, limit]);

  return {
    leaderboard,
    currentUser,
    totalUsers,
    topScore,
    resetsAt,
    loading,
    error,
    hasMore: leaderboard.length < totalUsers,
    showMore: () => setLimit((l) => l + PAGE),
    refetch: () => fetchLeaderboard(limit)
  };
}
