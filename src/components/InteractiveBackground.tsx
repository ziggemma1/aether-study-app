import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export default function InteractiveBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for cursor movement
  const springConfig = { damping: 40, stiffness: 100 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse position between -0.5 and 0.5
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Transform mouse movement to subtle translations for each gradient layer
  const translateX1 = useTransform(smoothX, [ -0.5, 0.5 ], [ -40, 40 ]);
  const translateY1 = useTransform(smoothY, [ -0.5, 0.5 ], [ -40, 40 ]);
  
  const translateX2 = useTransform(smoothX, [ -0.5, 0.5 ], [ 30, -30 ]);
  const translateY2 = useTransform(smoothY, [ -0.5, 0.5 ], [ 30, -30 ]);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#0a0c14]">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />

      {/* Primary Deep Glow (Purple) */}
      <motion.div 
        style={{ x: translateX1, y: translateY1 }}
        className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] opacity-30 dark:opacity-25"
      >
        <div className="w-full h-full bg-primary/40 rounded-full blur-[160px]" />
      </motion.div>

      {/* Secondary Glow (Indigo/Blue) */}
      <motion.div 
        style={{ x: translateX2, y: translateY2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] opacity-20 dark:opacity-15"
      >
        <div className="w-full h-full bg-indigo-500/30 rounded-full blur-[140px]" />
      </motion.div>

      {/* Accent Glow (Teal/Green) */}
      <motion.div 
        animate={{ 
          x: [0, 20, -10, 0],
          y: [0, -10, 20, 0],
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[30%] right-[20%] w-[40%] h-[40%] opacity-10"
      >
        <div className="w-full h-full bg-accent/20 rounded-full blur-[120px]" />
      </motion.div>

      {/* Global Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-transparent to-transparent opacity-80" />
    </div>
  );
}
