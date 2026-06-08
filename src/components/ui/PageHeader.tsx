import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({ title, subtitle, action, breadcrumbs }: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-col gap-2 shrink-0 select-none pb-4 border-b border-white/5"
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-text-muted">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              <span className={idx === breadcrumbs.length - 1 ? "text-primary/95" : ""}>
                {bc.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight leading-tight uppercase font-sans">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1 leading-normal font-sans">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0 flex items-center">
            {action}
          </div>
        )}
      </div>
    </motion.div>
  );
}
