import React, { useRef, useEffect, useState } from 'react';
import { colorPalettes, SubjectType } from '../lib/colorPalettes';

interface LearningNebulaProps {
  subject: SubjectType;
  streak: number;
}

export default function LearningNebula({ subject, streak }: LearningNebulaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Track palette transition to prevent harsh color jumps
  const currentPalette = colorPalettes[subject] || colorPalettes.default;
  const [activePalette, setActivePalette] = useState(currentPalette);

  // Blend colors smoothly when subject changes
  useEffect(() => {
    setActivePalette(currentPalette);
  }, [subject, currentPalette]);

  // Trigger streak burst animation on mount/streak updates
  const [burstActive, setBurstActive] = useState(false);
  const lastStreakRef = useRef(streak);

  useEffect(() => {
    if (streak > 0 && streak !== lastStreakRef.current) {
      // Trigger a magnificent celestial star burst on streak milestones (or standard growth)
      setBurstActive(true);
      const timer = setTimeout(() => {
        setBurstActive(false);
      }, 4000); // 4-second burst transition
      lastStreakRef.current = streak;
      return () => clearTimeout(timer);
    }
  }, [streak]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect mobile viewport to restrict rendering load for better device efficiency
    const isMobile = window.innerWidth < 768;
    const maxParticles = isMobile ? 25 : 55;
    const fpsLimit = isMobile ? 20 : 35;
    const frameInterval = 1000 / fpsLimit;

    // Fluid canvas scaling
    const updateSize = () => {
      if (!canvas || !ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap at 1.5 for performance
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });

    // Initialize custom drifting floating particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      baseAlpha: number;
      pulseSpeed: number;
      colorIndex: 'primary' | 'secondary' | 'tertiary';
    }> = [];

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: 1 + Math.random() * 3,
        baseAlpha: 0.15 + Math.random() * 0.3,
        alpha: 0,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        colorIndex: i % 3 === 0 ? 'primary' : i % 3 === 1 ? 'secondary' : 'tertiary'
      });
    }

    // Interactive shift markers
    let timeAngle = 0;

    // Main animation ticker loop
    const animate = (timestamp: number) => {
      if (!canvas || !ctx) return;

      // Throttle frame rates to preserve mobile battery
      const elapsed = timestamp - lastTimeRef.current;
      if (elapsed < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTimeRef.current = timestamp - (elapsed % frameInterval);

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Reset transforms
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      ctx.scale(dpr, dpr);

      // Clear layout
      ctx.clearRect(0, 0, w, h);

      timeAngle += 0.0035; // speed of shifting nebula gas clouds
      const shiftX1 = w * 0.5 + Math.cos(timeAngle) * (w * 0.22);
      const shiftY1 = h * 0.5 + Math.sin(timeAngle * 0.7) * (h * 0.22);
      
      const shiftX2 = w * 0.5 + Math.sin(timeAngle * 1.2) * (w * 0.26);
      const shiftY2 = h * 0.5 + Math.cos(timeAngle * 0.8) * (h * 0.26);

      // Render flowing radial backdrop cloud 1
      const grad1 = ctx.createRadialGradient(
        shiftX1, shiftY1, 10,
        shiftX1, shiftY1, Math.max(w, h) * 0.85
      );
      
      // Compute dynamic alpha bounds celebrating active streak bursts
      const baseNebulaAlpha = burstActive ? 0.35 : 0.18;
      const highlightNebulaAlpha = burstActive ? 0.25 : 0.12;

      grad1.addColorStop(0, hexToRgba(activePalette.primary, baseNebulaAlpha));
      grad1.addColorStop(0.4, hexToRgba(activePalette.tertiary, highlightNebulaAlpha));
      grad1.addColorStop(1, 'rgba(11, 14, 20, 0)'); // seamlessly blend into dark backdrop

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      // Render secondary crossing backdrop cloud 2 for deep visual intersection
      const grad2 = ctx.createRadialGradient(
        shiftX2, shiftY2, 5,
        shiftX2, shiftY2, Math.max(w, h) * 0.65
      );
      grad2.addColorStop(0, hexToRgba(activePalette.secondary, baseNebulaAlpha * 0.8));
      grad2.addColorStop(0.5, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);

      // Render drifting stellar particles
      particles.forEach(p => {
        // Boost velocity during active streak bursts
        const speedMultiplier = burstActive ? 4.5 : 1.0;
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Wrap around screen boundaries cleanly
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Soft natural pulse twinkling
        const twinkle = Math.sin(timestamp * 0.001 * p.pulseSpeed);
        p.alpha = Math.max(0.05, p.baseAlpha + twinkle * 0.15);

        if (burstActive) {
          // Glow intensity boost
          p.alpha = Math.min(1.0, p.alpha * 2.2);
        }

        const colorHex = activePalette[p.colorIndex] || activePalette.primary;

        ctx.beginPath();
        const pSize = burstActive ? p.size * 1.6 : p.size;
        ctx.arc(p.x, p.y, pSize, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(colorHex, p.alpha);
        ctx.fill();
        
        if (p.size > 2.5 || burstActive) {
          ctx.save();
          ctx.shadowBlur = burstActive ? 15 : 6;
          ctx.shadowColor = colorHex;
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = p.alpha * 0.8;
          ctx.fill();
          ctx.restore();
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', updateSize);
    };
  }, [activePalette, burstActive]);

  // Utility to convert hex strings safely inside native canvas gradients
  function hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r || 108}, ${g || 92}, ${b || 231}, ${alpha})`;
  }

  return (
    <div 
      className="fixed inset-0 w-screen h-screen pointer-events-none overflow-hidden select-none z-0 opacity-40 bg-transparent transition-opacity duration-1000"
      id="learning-nebula-vessel"
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full pointer-events-none"
      />
    </div>
  );
}
