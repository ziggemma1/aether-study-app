import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  accentColor?: string; // e.g. '#6C5CE7'
  icon?: React.ReactNode;
}

export function ProgressRing({ percentage, size = 64, strokeWidth = 5, accentColor = '#8B5CF6', icon }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const offset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center select-none shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track circle */}
        <circle
          className="text-[#1E293B]"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Active colored circle */}
        <motion.circle
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Centered label or content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {icon ? (
          <div className="text-text-main text-xs">{icon}</div>
        ) : (
          <span className="text-[10px] font-black leading-none text-text-main">
            {Math.round(clampedPercentage)}%
          </span>
        )}
      </div>
    </div>
  );
}
