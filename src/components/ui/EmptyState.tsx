import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center p-8 bg-surface-alt/40 border border-dashed border-border/10 rounded-3xl my-4"
    >
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary/80 mb-4 shadow-inner ring-1 ring-primary/20">
        {icon || <Sparkles size={24} />}
      </div>
      
      <h3 className="text-sm font-bold text-text-main mb-1.5 uppercase tracking-wider">
        {title}
      </h3>
      <p className="text-xs text-text-muted max-w-sm mb-5 leading-normal">
        {message}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary flex items-center gap-2 text-xs py-2.5 px-5 font-black uppercase tracking-wider btn-ripple border border-primary/40 focus:outline-none"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
