import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  duration?: number;
  onComplete?: () => void;
}

export function ConfettiEffect({ duration = 1800, onComplete }: ConfettiEffectProps) {
  useEffect(() => {
    const end = Date.now() + duration;

    const frame = () => {
      // Fire left side burst
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.85 },
        colors: ['#8B5CF6', '#DDD6FE', '#10B981', '#3B82F6', '#FF55D2']
      });
      // Fire right side burst
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.85 },
        colors: ['#8B5CF6', '#DDD6FE', '#10B981', '#3B82F6', '#FF55D2']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else if (onComplete) {
        onComplete();
      }
    };

    frame();
  }, [duration, onComplete]);

  return null;
}
