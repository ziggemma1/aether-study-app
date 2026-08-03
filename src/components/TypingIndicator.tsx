import React from 'react';

export function TypingIndicator() {
  return (
    <div className="typing-indicator flex items-center gap-1 bg-surface-alt border border-border/10 py-1.5 px-3 rounded-2xl w-fit">
      <div className="typing-dot bg-primary"></div>
      <div className="typing-dot bg-primary"></div>
      <div className="typing-dot bg-primary"></div>
      <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-1.5">
        AI Tutor is analyzing...
      </span>
    </div>
  );
}
