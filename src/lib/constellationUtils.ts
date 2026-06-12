export interface SeededRandom {
  next: () => number;
}

/**
 * Creates a deterministic pseudo-random number generator seeded with a string.
 * This ensures that a user's constellation stays consistent for their profile.
 */
export function createSeededRandom(seed: string): SeededRandom {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return {
    next() {
      h = Math.imul(h ^ h >>> 16, 2246822507) | 0;
      h = Math.imul(h ^ h >>> 13, 3266489909) | 0;
      h = (h ^= h >>> 16) >>> 0;
      return h / 4294967296;
    }
  };
}

export interface ConstellationStar {
  id: string;
  xRatio: number; // 0 to 1 coordinate
  yRatio: number; // 0 to 1 coordinate
  size: number;   // star rendering radius / magnitude
  color: string;  // color string hex or rgba
  title: string;  // user action label
  type: string;   // action category
  glow: boolean;  // whether it twinkles stronger or has glow
}

export interface ConstellationConnection {
  fromId: string;
  toId: string;
  tag?: string;
}

/**
 * Calculates distance between two normalized points
 */
export function getDistance(starA: { xRatio: number, yRatio: number }, starB: { xRatio: number, yRatio: number }, aspect: number = 1): number {
  const dx = (starA.xRatio - starB.xRatio) * aspect;
  const dy = starA.yRatio - starB.yRatio;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Connects nearest stars of related subjects or close spatial proximity
 */
export function buildConnections(stars: ConstellationStar[], maxDistance: number = 0.28): ConstellationConnection[] {
  const connections: ConstellationConnection[] = [];
  const connectedPairs = new Set<string>();

  // Helper to store unique connections
  const addConnection = (a: string, b: string) => {
    const pairId = [a, b].sort().join('-');
    if (!connectedPairs.has(pairId)) {
      connectedPairs.add(pairId);
      connections.push({ fromId: a, toId: b });
    }
  };

  for (let i = 0; i < stars.length; i++) {
    const starA = stars[i];
    
    // 1. Connect spatial proximity neighbors
    const neighbors = stars
      .map((starB, index) => ({ starB, index, dist: getDistance(starA, starB) }))
      .filter(item => item.starB.id !== starA.id && item.dist < maxDistance)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2); // Connect to closest 2 neighbors

    neighbors.forEach(({ starB }) => {
      addConnection(starA.id, starB.id);
    });

    // 2. Connect stars of matching study categories to build cohesive thematic constellations
    const matches = stars
      .filter(starB => starB.id !== starA.id && starB.type === starA.type)
      .slice(0, 1);

    matches.forEach(starB => {
      addConnection(starA.id, starB.id);
    });
  }

  return connections;
}
