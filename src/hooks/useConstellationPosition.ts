import { useMemo } from 'react';
import { createSeededRandom, ConstellationStar, buildConnections, ConstellationConnection } from '../lib/constellationUtils';

export interface StudyActivityItem {
  id: string;
  name: string;
  type: 'session' | 'upload' | 'score' | 'streak';
  score?: number;
  duration?: number;
  dateStr?: string;
}

export interface UseConstellationPositionProps {
  userId: string | undefined;
  activities: StudyActivityItem[];
}

export function useConstellationPosition({ userId, activities }: UseConstellationPositionProps) {
  return useMemo(() => {
    const seed = userId || 'anonymous-study-star-aether';
    const rng = createSeededRandom(seed);
    const stars: ConstellationStar[] = [];

    // Colors that match our minimal Aether tech aesthetic
    const colors = {
      session: '#6C5CE7', // Tech purple
      upload: '#00D2FF',  // Cyan space
      score: '#F1C40F',   // Amber gold stars for peak grades
      streak: '#E74C3C',  // Orange fire
    };

    // If there is very little or zero active user activity, generate a default constellation template
    // representing active satellite systems so that the background look is consistently beautiful.
    const itemsToProcess = activities.length > 0 ? activities : [
      { id: 'def-1', name: 'Initialization Node', type: 'streak' as const },
      { id: 'def-2', name: 'Curriculum Satellite', type: 'upload' as const },
      { id: 'def-3', name: 'Study Session Star', type: 'session' as const },
      { id: 'def-4', name: 'Peak Focus Orbit', type: 'score' as const },
      { id: 'def-5', name: 'Aether Calibration', type: 'session' as const },
      { id: 'def-6', name: 'Milestone Node', type: 'streak' as const },
      { id: 'def-7', name: 'Knowledge Grid', type: 'upload' as const },
      { id: 'def-8', name: 'Deep Work Beacon', type: 'score' as const },
    ];

    itemsToProcess.forEach((item, index) => {
      // Seeded random positions: (0 to 1 ratio)
      // Generates a beautiful scattering of stars
      let xRatio = rng.next();
      let yRatio = rng.next();

      // Ensure stars are distributed more toward margins and top/bottom edges, 
      // preventing cluttering behind critical textual centers:
      const dx = xRatio - 0.5;
      const dy = yRatio - 0.5;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);
      
      if (distToCenter < 0.25) {
        // Push outwards
        const angle = rng.next() * Math.PI * 2;
        xRatio = 0.5 + Math.cos(angle) * (0.25 + rng.next() * 0.25);
        yRatio = 0.5 + Math.sin(angle) * (0.25 + rng.next() * 0.25);
      }

      // Constrain inside viewport margins slightly
      xRatio = 0.05 + xRatio * 0.9;
      yRatio = 0.05 + yRatio * 0.9;

      let size = 1.2;
      let glow = false;
      let color = colors[item.type] || colors.session;

      if (item.type === 'score' && item.score && item.score > 90) {
        size = 3.2;
        glow = true;
      } else if (item.type === 'streak') {
        size = 2.4;
        glow = true;
      } else if (item.duration && item.duration > 30) {
        size = 2.8;
      } else if (rng.next() > 0.85) {
        // Random natural sparkling beacons
        size = 2;
        glow = true;
      }

      stars.push({
        id: item.id || `star-${index}`,
        xRatio,
        yRatio,
        size,
        color,
        title: item.name,
        type: item.type,
        glow
      });
    });

    const connections = buildConnections(stars);

    return {
      stars,
      connections
    };
  }, [userId, activities]);
}
