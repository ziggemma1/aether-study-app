import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({ title, subtitle, action, breadcrumbs }: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      /* border-border was invisible on paper — a rule that only existed in dark mode */
      className="mb-6 flex flex-col gap-2 shrink-0 select-none pb-4 border-b border-border"
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-text-muted">
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
          {/* Title case, matching Library's "Your Learning Hub". Page titles
              were uppercase here and title case there — two systems for the
              same level of heading. */}
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-main tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <div className="text-xs text-text-muted mt-1 leading-normal font-sans">
              {subtitle}
            </div>
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
