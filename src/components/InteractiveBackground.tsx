import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

export default function InteractiveBackground() {
  const { theme, timeTheme } = useAppContext();
  const location = useLocation();
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 40, stiffness: 100, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize between -1 and 1
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Subtle interactive floating
  const translateX1 = useTransform(smoothX, [-1, 1], [-250, 250]);
  const translateY1 = useTransform(smoothY, [-1, 1], [-250, 250]);
  
  const translateX2 = useTransform(smoothX, [-1, 1], [200, -200]);
  const translateY2 = useTransform(smoothY, [-1, 1], [200, -200]);

  const translateX3 = useTransform(smoothX, [-1, 1], [-100, 100]);
  const translateY3 = useTransform(smoothY, [-1, 1], [-100, 100]);

  const isNotesPage = location.pathname.includes('/notes') || location.pathname.includes('/explore');

  if (location.pathname === '/') return null;

  return (
    <div className={cn("fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background bg-transition", theme, timeTheme)}>
      
      {/* 1. Underlying Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} 
      />

      {isNotesPage && (
        <>
          {/* 2. Interactive Aurora Glows */}
          <motion.div 
            style={{ x: translateX1, y: translateY1 }}
            className="absolute top-[-20%] left-[-15%] w-[80%] h-[80%] blur-[120px] rounded-full will-change-transform mix-blend-screen opacity-50 dark:opacity-[0.35]"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-full h-full bg-primary rounded-full transition-colors duration-1000" />
          </motion.div>

          <motion.div 
            style={{ x: translateX2, y: translateY2 }}
            className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] blur-[120px] rounded-full will-change-transform mix-blend-screen opacity-40 dark:opacity-30"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          >
            <div className="w-full h-full bg-secondary rounded-full transition-colors duration-1000" />
          </motion.div>

          {/* 3. Slow Rotating Central Core */}
          <motion.div 
            style={{ x: translateX3, y: translateY3 }}
            className="absolute top-[20%] left-[20%] w-[60%] h-[60%] blur-[140px] rounded-full mix-blend-screen opacity-30 dark:opacity-[0.25]"
            animate={{ 
              rotate: [0, 360],
              scale: [0.9, 1.1, 0.9]
            }}
            transition={{ 
              duration: 30, 
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="w-full h-full bg-accent rounded-full transition-colors duration-1000" />
          </motion.div>

          {/* 4. Deep Vignette to Keep Edges Professional */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_100%)] opacity-80" />
          
          {/* 5. Top and Bottom Fades for readability of navbars */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent opacity-80" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent opacity-80" />
        </>
      )}
    </div>
  );
}
