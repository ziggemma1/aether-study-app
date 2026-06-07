import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  left: string;
  duration: number;
  delay: number;
  opacity: number;
  size: number;
}

export function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Keep count to about 18 to optimize on mobile displays
    const generated = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * 8,
      opacity: 0.05 + Math.random() * 0.15,
      size: 1.5 + Math.random() * 2
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="particles-container absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle bg-gradient-to-t from-primary/30 to-cyan-500/20 rounded-full"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            animationName: 'float-particle',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite'
          }}
        />
      ))}
    </div>
  );
}
