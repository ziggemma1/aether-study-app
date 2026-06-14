import React, { useRef, useEffect } from 'react';
import { useConstellationPosition, StudyActivityItem } from '../hooks/useConstellationPosition';

interface StudyConstellationProps {
  userId: string | undefined;
  activities: StudyActivityItem[];
}

export default function StudyConstellation({ userId, activities }: StudyConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Grab the stable star layout coordinates
  const { stars, connections } = useConstellationPosition({ userId, activities });

  // Store interactive mouse positioning
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // Handle active shooting stars
  const shootingStarsRef = useRef<
    Array<{
      startX: number;
      startY: number;
      x: number;
      y: number;
      dx: number;
      dy: number;
      length: number;
      speed: number;
      life: number;
      maxLife: number;
    }>
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport-level sizing to prevent zero-height relative layout bugs
    const updateSize = () => {
      if (!canvas || !ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.scale(dpr, dpr);
    };

    updateSize();

    // Sizable orientation/window shift handles
    window.addEventListener('resize', updateSize, { passive: true });

    // Interactive mouse trackers anywhere on the viewport window
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
        mouseRef.current.active = true;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleMouseLeave, { passive: true });

    // Main Canvas animation render frame loop
    const render = () => {
      if (!canvas || !ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Clear the canvas completely so layout colors can blend beneath
      ctx.clearRect(0, 0, w, h);

      const time = performance.now() * 0.001; // exact elapsed time in seconds

      // 1. Chance to dynamically trigger high speed shooting stars
      if (Math.random() < 0.004 && shootingStarsRef.current.length < 2) {
        const side = Math.random() > 0.5;
        const startX = side ? Math.random() * w * 0.4 : Math.random() * w * 0.8;
        const startY = Math.random() * h * 0.3;
        const angle = Math.PI / 6 + Math.random() * (Math.PI / 12); // subtle angle downwards
        const speed = 10 + Math.random() * 12;
        shootingStarsRef.current.push({
          startX,
          startY,
          x: startX,
          y: startY,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          length: 50 + Math.random() * 70,
          speed,
          life: 0,
          maxLife: 25 + Math.random() * 25,
        });
      }

      // Update and Draw active shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((s) => {
        s.x += s.dx;
        s.y += s.dy;
        s.life += 1;

        if (s.life < s.maxLife) {
          ctx.beginPath();
          const grad = ctx.createLinearGradient(
            s.x - s.dx * 1.5,
            s.y - s.dy * 1.5,
            s.x,
            s.y
          );
          grad.addColorStop(0, 'rgba(0, 210, 255, 0)');
          grad.addColorStop(0.5, 'rgba(108, 92, 231, 0.4)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.moveTo(s.x - s.dx * 2, s.y - s.dy * 2);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
          return true;
        }
        return false;
      });

      // Map star list elements with scaled relative dimension ratios
      const renderedStars = stars.map((star, index) => {
        const x = star.xRatio * w;
        const y = star.yRatio * h;

        // Twinkling logic using non-blocking math wave offsets
        const offset = index * 4.3;
        const twinkleFreq = star.glow ? 2.5 : 1.25;
        const baseOpacity = 0.35;
        const deltaOpacity = star.glow ? 0.55 : 0.35;
        const opacity = baseOpacity + Math.sin(time * twinkleFreq + offset) * deltaOpacity;

        // Interactive mouse distance checks
        let interactionFactor = 1.0;
        if (mouseRef.current.active) {
          const mdx = mouseRef.current.x - x;
          const mdy = mouseRef.current.y - y;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 120) {
            interactionFactor = 1.0 + (1.0 - mDist / 120) * 1.8;
          }
        }

        return {
          id: star.id,
          x,
          y,
          size: star.size * Math.max(0.8, Math.min(2.5, interactionFactor)),
          color: star.color,
          opacity: Math.max(0.15, Math.min(1.0, opacity * (interactionFactor > 1.2 ? 1.4 : 1.0))),
          glow: star.glow || interactionFactor > 1.8,
        };
      });

      const starMap = new Map<string, typeof renderedStars[0]>();
      renderedStars.forEach((s) => starMap.set(s.id, s));

      // 2. Render Constellation Connection Lines
      ctx.lineWidth = 0.6;
      connections.forEach((conn) => {
        const from = starMap.get(conn.fromId);
        const to = starMap.get(conn.toId);
        if (from && to) {
          const lx = from.x - to.x;
          const ly = from.y - to.y;
          const dist = Math.sqrt(lx * lx + ly * ly);
          const drawDistLimit = 350;
          
          if (dist < drawDistLimit) {
            const opacityMultiplier = 1.0 - (dist / drawDistLimit);
            const lineOpacity = Math.min(from.opacity, to.opacity) * 0.35 * opacityMultiplier;
            
            ctx.beginPath();
            const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
            grad.addColorStop(0, `rgba(108, 92, 231, ${lineOpacity})`);
            grad.addColorStop(1, `rgba(0, 210, 255, ${lineOpacity})`);
            ctx.strokeStyle = grad;
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          }
        }
      });

      // 3. Render Stars with dynamic dual-layered glows and crisp cores
      renderedStars.forEach((star) => {
        ctx.save();
        
        // Soft glowing outer corona halo
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.8, 0, Math.PI * 2);
        const hasGlow = star.glow;
        const blurRadius = hasGlow ? 12 : 5;
        
        ctx.shadowBlur = blurRadius;
        ctx.shadowColor = star.color;
        
        const haloGrad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 2.8);
        haloGrad.addColorStop(0, star.color);
        haloGrad.addColorStop(0.3, star.color);
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = haloGrad;
        ctx.globalAlpha = star.opacity * 0.75;
        ctx.fill();
        
        // Bright crisp organic stellar core
        ctx.beginPath();
        ctx.arc(star.x, star.y, Math.max(0.7, star.size * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#FFFFFF';
        ctx.globalAlpha = star.opacity * 0.95;
        ctx.fill();
        
        ctx.restore();
      });

      // Continue frame pipeline
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      // Cleanup events & frame loops
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseLeave);
    };
  }, [stars, connections]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-screen h-screen pointer-events-none overflow-hidden select-none z-0 opacity-45"
      id="study-constellation-container"
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full pointer-events-none"
      />
    </div>
  );
}
