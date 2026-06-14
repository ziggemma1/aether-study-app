import React, { useRef, useEffect, useState } from 'react';
import { FloatingBubble } from '../hooks/useBubbleData';

interface BubbleFieldProps {
  bubbles: FloatingBubble[];
}

export default function BubbleField({ bubbles: initialBubbles }: BubbleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Keep a local mutable replicate of positions to run fluid mutation physics
  const bubblesRef = useRef<FloatingBubble[]>([]);
  const hoverRef = useRef<string | null>(null);

  const [activeTooltip, setActiveTooltip] = useState<{
    subject: string;
    hours: number;
    avgScore: number;
    color: 'gold' | 'red';
    clientX: number;
    clientY: number;
  } | null>(null);

  // Sync initial bubbles
  useEffect(() => {
    if (Array.isArray(initialBubbles) && initialBubbles.length > 0) {
      bubblesRef.current = initialBubbles.map(b => ({ ...b }));
    }
  }, [initialBubbles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport level scaling handles
    const updateSize = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      ctx.scale(dpr, dpr);
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Handles interactive hovering collision
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const w = rect.width;
      const h = rect.height;

      let found: FloatingBubble | null = null;

      bubblesRef.current.forEach(b => {
        const bx = b.x * w;
        const by = b.y * h;
        const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
        
        if (dist < b.size + 15) {
          found = b;
        }
      });

      if (found) {
        hoverRef.current = found.id;
        setActiveTooltip({
          subject: found.subject,
          hours: found.hours,
          avgScore: found.avgScore,
          color: found.color,
          clientX: e.clientX,
          clientY: e.clientY
        });
      } else {
        hoverRef.current = null;
        setActiveTooltip(null);
      }
    };

    const handleMouseLeave = () => {
      hoverRef.current = null;
      setActiveTooltip(null);
    };

    const containerElement = containerRef.current;
    if (containerElement) {
      containerElement.addEventListener('mousemove', handleMouseMove, { passive: true });
      containerElement.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    // Canvas rendering loop
    const render = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // Deep dark premium clear
      ctx.clearRect(0, 0, w, h);

      const items = bubblesRef.current;

      items.forEach(b => {
        // Drift movement
        b.x += b.vx;
        b.y += b.vy;

        // Bouncing inside margin restrictions
        if (b.x < 0.05 || b.x > 0.95) b.vx *= -1;
        if (b.y < 0.1 || b.y > 0.9) b.vy *= -1;

        // Update pulse wave phase
        b.pulsePhase += b.pulseSpeed;

        const pulseScale = 1.0 + Math.sin(b.pulsePhase) * 0.05;
        const currentSize = b.size * pulseScale * (hoverRef.current === b.id ? 1.15 : 1.0);

        const bx = b.x * w;
        const by = b.y * h;

        // Establish Radial Gradient styles
        ctx.beginPath();
        ctx.arc(bx, by, currentSize, 0, Math.PI * 2);

        const grad = ctx.createRadialGradient(
          bx - currentSize * 0.2, by - currentSize * 0.2, currentSize * 0.1,
          bx, by, currentSize
        );

        const isHovered = hoverRef.current === b.id;

        if (b.color === 'gold') {
          // Vivid achievement gold
          const alphaCenter = isHovered ? 0.42 : 0.28;
          const alphaEdge = isHovered ? 0.18 : 0.08;
          grad.addColorStop(0, `rgba(255, 215, 0, ${alphaCenter})`);
          grad.addColorStop(0.5, `rgba(245, 176, 66, ${alphaCenter * 0.7})`);
          grad.addColorStop(1, `rgba(184, 134, 11, ${alphaEdge})`);
          ctx.shadowColor = 'rgba(245, 176, 66, 0.4)';
        } else {
          // Intense target red
          const alphaCenter = isHovered ? 0.38 : 0.26;
          const alphaEdge = isHovered ? 0.14 : 0.06;
          grad.addColorStop(0, `rgba(255, 94, 126, ${alphaCenter})`);
          grad.addColorStop(0.6, `rgba(230, 57, 70, ${alphaCenter * 0.7})`);
          grad.addColorStop(1, `rgba(155, 29, 44, ${alphaEdge})`);
          ctx.shadowColor = 'rgba(230, 57, 70, 0.45)';
        }

        ctx.fillStyle = grad;
        
        ctx.save();
        ctx.shadowBlur = isHovered ? 24 : 10;
        ctx.fill();
        ctx.restore();

        // Overlay a sharp premium contour border
        ctx.beginPath();
        ctx.arc(bx, by, currentSize, 0, Math.PI * 2);
        ctx.lineWidth = isHovered ? 1.6 : 0.8;
        ctx.strokeStyle = b.color === 'gold' 
          ? `rgba(255, 223, 100, ${isHovered ? 0.55 : 0.25})` 
          : `rgba(255, 120, 140, ${isHovered ? 0.5 : 0.22})`;
        ctx.stroke();

        // Draw human subject text key centrally (but extremely clean and transparent)
        ctx.fillStyle = b.color === 'gold' 
          ? 'rgba(255, 235, 180, 0.5)' 
          : 'rgba(255, 210, 215, 0.45)';
        ctx.font = `600 ${currentSize > 40 ? 10 : 8}px 'Poppins', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.subject.toUpperCase(), bx, by);
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
      if (containerElement) {
        containerElement.removeEventListener('mousemove', handleMouseMove);
        containerElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full pointer-events-auto overflow-hidden select-none z-0 opacity-80"
      id="subject-bubble-field-base"
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full"
        style={{ cursor: activeTooltip ? 'pointer' : 'default' }}
      />

      {/* Crisp High-Contrast HTML Overlay Tooltip */}
      {activeTooltip && (
        <div 
          className="fixed pointer-events-none z-50 px-3.5 py-2.5 bg-background/95 backdrop-blur-xl border rounded-2xl shadow-2xl flex flex-col gap-1 text-left transition-all duration-75"
          style={{
            left: `${activeTooltip.clientX + 16}px`,
            top: `${activeTooltip.clientY - 42}px`,
            borderColor: activeTooltip.color === 'gold' ? 'rgba(245, 176, 66, 0.4)' : 'rgba(230, 57, 70, 0.4)',
            boxShadow: activeTooltip.color === 'gold' 
              ? '0 10px 25px -5px rgba(245, 176, 66, 0.15)' 
              : '0 10px 25px -5px rgba(230, 57, 70, 0.15)'
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${activeTooltip.color === 'gold' ? 'bg-[#FFD700] shadow-[0_0_8px_#FFD700]' : 'bg-[#FF5E7E] shadow-[0_0_8px_#FF5E7E]'}`} />
            <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">
              {activeTooltip.color === 'gold' ? 'Academic Strength' : 'Opportunity Area'}
            </span>
          </div>
          <h4 className="text-sm font-black text-text-main mt-0.5 font-sans leading-none uppercase">
            {activeTooltip.subject}
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5 border-t border-border/10 pt-1.5 text-[10px] font-mono text-text-muted">
            <div>
              <span>STUDY TIME:</span>
              <p className="text-xs font-bold text-text-main mt-0.5">{activeTooltip.hours} hours</p>
            </div>
            <div>
              <span>AVG GRADE:</span>
              <p className={`text-xs font-bold mt-0.5 ${activeTooltip.color === 'gold' ? 'text-green-400' : 'text-rose-400'}`}>
                {activeTooltip.avgScore}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
