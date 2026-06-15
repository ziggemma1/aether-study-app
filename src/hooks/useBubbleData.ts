import { useState, useEffect } from 'react';
import api from '../services/api';

export interface SubjectStats {
  subject: string;
  totalHours: number;
  avgScore: number;
  lastActive: string;
}

export interface FloatingBubble {
  id: string;
  subject: string;
  size: number; // Radius in pixels
  color: 'gold' | 'red';
  hours: number;
  avgScore: number;
  x: number; // Percentage coordinate (0 to 1)
  y: number; // Percentage coordinate (0 to 1)
  vx: number; // Drift velocity X
  vy: number; // Drift velocity Y
  pulsePhase: number;
  pulseSpeed: number;
}

export function useBubbleData() {
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        setLoading(true);
        const res = await api.get('/user/subject-stats');
        if (!active) return;

        const rawData: SubjectStats[] = res.data || [];

        // Distribute bubbles nicely across the screen
        const mapped: FloatingBubble[] = rawData.map((stat, idx) => {
          // 1. Determine size based on total hours spent studying
          let size = 30; // Small
          if (stat.totalHours >= 10) {
            size = 65; // Large
          } else if (stat.totalHours >= 3) {
            size = 45; // Medium
          } else {
            size = 28; // Small
          }

          // 2. Classify color based on academic performance threshold
          // Gold for high scores (representing strengths), Red for growth opportunities (scores needing improvement)
          const color: 'gold' | 'red' = stat.avgScore >= 60 ? 'gold' : 'red';

          // 3. Grid coordinates to prevent absolute crowding
          const x = 0.12 + (idx * 0.22) + (Math.random() * 0.08);
          const y = 0.2 + (Math.random() * 0.55);

          return {
            id: `bubble-${stat.subject.toLowerCase()}`,
            subject: stat.subject,
            size,
            color,
            hours: stat.totalHours,
            avgScore: stat.avgScore,
            x,
            y,
            vx: (Math.random() - 0.5) * 0.0012, // extremely slow drifting
            vy: (Math.random() - 0.5) * 0.0012,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.005 + Math.random() * 0.01
          };
        });

        setBubbles(mapped);
      } catch (err: any) {
        console.error('Failed to load bubble statistics:', err);
        setError('Could not retrieve subject analysis records.');
        
        // Solid local fallback dataset representing typical study subjects
        const fallbackData: SubjectStats[] = [
          { subject: 'Math', totalHours: 12.4, avgScore: 84, lastActive: new Date().toISOString() },
          { subject: 'Science', totalHours: 2.8, avgScore: 45, lastActive: new Date().toISOString() },
          { subject: 'History', totalHours: 1.5, avgScore: 52, lastActive: new Date().toISOString() },
          { subject: 'Literature', totalHours: 8.2, avgScore: 92, lastActive: new Date().toISOString() }
        ];

        const mappedFallback: FloatingBubble[] = fallbackData.map((stat, idx) => {
          let size = stat.totalHours >= 10 ? 65 : stat.totalHours >= 3 ? 45 : 28;
          const color: 'gold' | 'red' = stat.avgScore >= 60 ? 'gold' : 'red';
          const x = 0.15 + (idx * 0.21) + (Math.random() * 0.05);
          const y = 0.25 + (Math.random() * 0.45);

          return {
            id: `bubble-fallback-${stat.subject.toLowerCase()}`,
            subject: stat.subject,
            size,
            color,
            hours: stat.totalHours,
            avgScore: stat.avgScore,
            x,
            y,
            vx: (Math.random() - 0.5) * 0.0012,
            vy: (Math.random() - 0.5) * 0.0012,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.008 + Math.random() * 0.012
          };
        });

        setBubbles(mappedFallback);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, []);

  return { bubbles, loading, error };
}
