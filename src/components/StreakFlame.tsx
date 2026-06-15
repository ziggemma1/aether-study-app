import React from 'react';

interface StreakFlameProps {
  days: number;
  studiedToday: boolean;
  size?: number | string;
  className?: string;
}

export default function StreakFlame({ days, studiedToday, size = 64, className = "" }: StreakFlameProps) {
  // Classification
  const isCold = !studiedToday;
  const isBlazing = studiedToday && days >= 3;
  const isWarm = studiedToday && days < 3;

  // Gradients definition key combinations to prevent conflicts in SVGs
  const outerGradId = `outer-flame-grad-${isCold ? 'cold' : 'warm'}`;
  const middleGradId = `middle-flame-grad-${isCold ? 'cold' : 'warm'}`;
  const innerGradId = `inner-flame-grad-${isCold ? 'cold' : 'warm'}`;

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      {/* Absolute glow ring beneath blazing hot flame */}
      {isBlazing && (
        <div className="absolute inset-0 bg-radial from-amber-500/20 via-red-500/5 to-transparent rounded-full filter blur-xl animate-pulse" />
      )}
      {/* Absolute glow ring beneath frozen cold flame */}
      {isCold && days > 0 && (
        <div className="absolute inset-0 bg-radial from-[#38BDF8]/10 to-transparent rounded-full filter blur-lg opacity-40" />
      )}

      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full transform-gpu ${
          isBlazing ? 'animate-flame-sway filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]' : ''
        } ${isCold ? 'filter drop-shadow-[0_2px_4px_rgba(148,163,184,0.15)] opacity-60' : ''} ${
          isWarm ? 'filter drop-shadow-[0_3px_6px_rgba(245,158,11,0.3)]' : ''
        }`}
      >
        <defs>
          {/* Outer Flame Gradients */}
          <linearGradient id="outer-flame-grad-warm" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="outer-flame-grad-cold" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#475569" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.2" />
          </linearGradient>

          {/* Middle Flame Gradients */}
          <linearGradient id="middle-flame-grad-warm" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#FCD34D" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="middle-flame-grad-cold" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0B3C5D" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#328CC1" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#D9B310" stopOpacity="0" />
          </linearGradient>

          {/* Inner Flame Gradients */}
          <linearGradient id="inner-flame-grad-warm" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="50%" stopColor="#FDE047" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="inner-flame-grad-cold" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* 1. Outer Flame Layer */}
        <path
          d="M50 92 C 18 92, 4 58, 44 14 C 47 10, 53 10, 56 14 C 96 58, 82 92, 50 92 Z"
          fill={`url(#${outerGradId})`}
        />

        {/* 2. Middle Flame Layer */}
        <path
          d="M50 88 C 26 88, 12 55, 46 26 C 48 23, 52 23, 54 26 C 88 55, 74 88, 50 88 Z"
          fill={`url(#${middleGradId})`}
          className={isBlazing ? 'animate-flame-inner' : ''}
          style={{ transformOrigin: '50px 88px' }}
        />

        {/* 3. Inner Core Flame Layer */}
        <path
          d="M50 84 C 33 84, 23 60, 48 40 C 49 38, 51 38, 52 40 C 77 60, 67 84, 50 84 Z"
          fill={`url(#${innerGradId})`}
          className={isBlazing ? 'animate-flame-inner' : ''}
          style={{ transformOrigin: '50px 84px', animationDelay: '0.4s' }}
        />
      </svg>
    </div>
  );
}
