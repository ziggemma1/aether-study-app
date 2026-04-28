import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { cn } from '../lib/utils';

export default function InteractiveBackground() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Sharper, faster springs for immediate response
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position between -0.4 and 0.4 for slightly tighter movement
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 0.8);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 0.8);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Transform mouse movement to subtle translations
  const translateX1 = useTransform(smoothX, [ -0.4, 0.4 ], [ -30, 30 ]);
  const translateY1 = useTransform(smoothY, [ -0.4, 0.4 ], [ -30, 30 ]);
  
  const translateX2 = useTransform(smoothX, [ -0.4, 0.4 ], [ 20, -20 ]);
  const translateY2 = useTransform(smoothY, [ -0.4, 0.4 ], [ 20, -20 ]);

  if (isLandingPage) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-background">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay will-change-transform" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />

      {/* The "Note Page" Gradient Effect (atmosphere-bg) */}
      <div className="atmosphere-bg scale-110" />

      {/* Interactive Glow Layers for extra depth */}
      <motion.div 
        style={{ x: translateX1, y: translateY1 }}
        className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] opacity-20 will-change-transform"
      >
        <div className="w-full h-full bg-primary/20 rounded-full blur-[120px]" />
      </motion.div>

      <motion.div 
        style={{ x: translateX2, y: translateY2 }}
        className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] opacity-15 will-change-transform"
      >
        <div className="w-full h-full bg-secondary/20 rounded-full blur-[100px]" />
      </motion.div>
    </div>
  );
}
