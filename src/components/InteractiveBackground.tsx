import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export default function InteractiveBackground() {
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

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#0a0c14]">
      {/* Optimized Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay will-change-transform" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }} />

      {/* Primary Deep Glow (Purple) - Optimized blur and will-change */}
      <motion.div 
        style={{ x: translateX1, y: translateY1 }}
        className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] opacity-25 will-change-transform"
      >
        <div className="w-full h-full bg-primary/30 rounded-full blur-[100px]" />
      </motion.div>

      {/* Secondary Glow (Indigo/Blue) */}
      <motion.div 
        style={{ x: translateX2, y: translateY2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] opacity-15 will-change-transform"
      >
        <div className="w-full h-full bg-indigo-500/20 rounded-full blur-[80px]" />
      </motion.div>

      {/* Accent Glow (Teal/Green) - Simplified constant animation */}
      <motion.div 
        animate={{ 
          x: [0, 15, -15, 0],
          y: [0, -15, 15, 0],
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[30%] right-[20%] w-[40%] h-[40%] opacity-5 will-change-transform"
      >
        <div className="w-full h-full bg-accent/15 rounded-full blur-[60px]" />
      </motion.div>

      {/* Global Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-transparent to-transparent opacity-60" />
    </div>
  );
}
