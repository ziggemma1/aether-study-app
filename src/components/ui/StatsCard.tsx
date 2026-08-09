import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  accentColor?: string; // Tailwind color e.g. text-primary or text-brand-orange
  icon?: React.ReactNode;
}

/**
 * Fills the height of its grid cell. It used to be a short horizontal strip
 * sitting beside a much taller chart, which left a large empty gap under it in
 * the dashboard's right column. Filling the row turns that dead space into the
 * card's own breathing room, and gives the progress ring space to be legible
 * instead of a 36px dot.
 */
export function StatsCard({ title, value, description, accentColor = 'text-text-main', icon }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full p-5 bg-surface border border-border/10 rounded-[var(--radius-card)] shadow-[var(--shadow-card)] flex flex-col select-none relative"
    >
      <p className="text-[11px] font-black uppercase tracking-widest text-text-muted">
        {title}
      </p>

      {icon && (
        <div className="flex-1 flex items-center justify-center py-5 min-h-[96px]">
          {icon}
        </div>
      )}

      <div className={icon ? '' : 'mt-3'}>
        <h3 className={`text-3xl font-black tracking-tight leading-none ${accentColor}`}>
          {value}
        </h3>
        {description && (
          <p className="text-[11px] text-text-muted mt-1.5 leading-snug">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
