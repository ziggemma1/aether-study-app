import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function TruncatedText({ text, maxLength = 12, className = "" }: TruncatedTextProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isTooLong = text.length > maxLength;

  const displayText = isTooLong ? `${text.slice(0, maxLength)}...` : text;

  if (!isTooLong) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span 
      className={`relative inline-block cursor-help ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <span>{displayText}</span>
      <AnimatePresence>
        {showTooltip && (
          <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 bg-surface text-text-main text-[11px] font-bold px-2 py-1 rounded-lg z-50 border border-border/20 shadow-2xl pointer-events-none whitespace-normal min-w-[120px] max-w-[200px]"
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
