import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  accentColor?: string; // Tailwind color e.g. text-primary or text-amber-500
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, description, accentColor = 'text-primary', icon }: StatsCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-surface border border-border/10 rounded-2xl flex items-center justify-between gap-4 select-none relative"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
          {title}
        </p>
        <h3 className={`text-xl font-black tracking-tight mt-1 leading-none ${accentColor}`}>
          {value}
        </h3>
        {description && (
          <p className="text-[10px] text-text-muted mt-1 truncate leading-tight">
            {description}
          </p>
        )}
      </div>

      {icon && (
        <div className={`w-10 h-10 rounded-xl bg-surface-alt flex items-center justify-center shrink-0 border border-border/5 text-primary/80`}>
          {icon}
        </div>
      )}
    </motion.div>
  );
}
