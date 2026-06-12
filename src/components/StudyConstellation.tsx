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

    // High DPI canvas scaling setup
    const updateSize = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      ctx.scale(dpr, dpr);
    };

    updateSize();

    // Setup ResizeObserver to prevent redraw flickers
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Interactive mouse trackers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.touches[0].clientX - rect.left;
        mouseRef.current.y = e.touches[0].clientY - rect.top;
        mouseRef.current.active = true;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const containerElement = containerRef.current;
    if (containerElement) {
      containerElement.addEventListener('mousemove', handleMouseMove);
      containerElement.addEventListener('mouseleave', handleMouseLeave);
      containerElement.addEventListener('touchmove', handleTouchMove);
      containerElement.addEventListener('touchend', handleMouseLeave);
    }

    // Main Canvas animation render frame loop
    const render = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // Clear with elegant translucent black to enable dark depth trail blends
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
          grad.addColorStop(1, 'rgba(0, 210, 255, 0.95)');
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
        const baseOpacity = 0.25;
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
          opacity: Math.max(0.1, Math.min(1.0, opacity * (interactionFactor > 1.2 ? 1.4 : 1.0))),
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
          // Connections fade out if they stretch too far on window expand
          const lx = from.x - to.x;
          const ly = from.y - to.y;
          const dist = Math.sqrt(lx * lx + ly * ly);
          const drawDistLimit = 300;
          
          if (dist < drawDistLimit) {
            const opacityMultiplier = 1.0 - (dist / drawDistLimit);
            const lineOpacity = Math.min(from.opacity, to.opacity) * 0.3 * opacityMultiplier;
            
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

      // 3. Render Stars
      renderedStars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        
        ctx.save();
        if (star.glow) {
          // Apply a glowing backdrop layer
          ctx.shadowBlur = 8;
          ctx.globalAlpha = star.opacity;
        } else {
          ctx.globalAlpha = star.opacity;
        }
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
      resizeObserver.disconnect();
      if (containerElement) {
        containerElement.removeEventListener('mousemove', handleMouseMove);
        containerElement.removeEventListener('mouseleave', handleMouseLeave);
        containerElement.removeEventListener('touchmove', handleTouchMove);
        containerElement.removeEventListener('touchend', handleMouseLeave);
      }
    };
  }, [stars, connections]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0 opacity-25"
      id="study-constellation-container"
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full pointer-events-auto"
        style={{ cursor: 'crosshair' }}
      />
    </div>
  );
}
