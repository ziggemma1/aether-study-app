import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubjectFilterProps {
  subjects: string[];
  selectedSubject: string;
  onChange: (subject: string) => void;
}

export function SubjectFilter({ subjects, selectedSubject, onChange }: SubjectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full lg:w-auto">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        id="subject-dropdown-trigger"
        className="flex w-full lg:w-60 items-center justify-between gap-2.5 rounded-xl border border-border/10 bg-surface px-4 py-3 text-sm font-semibold text-text-main shadow-sm transition-all active:scale-[0.98] min-h-[44px] cursor-pointer"
      >
        <span className="flex items-center gap-2 text-text-muted">
          <BookOpen className="h-4 w-4" />
          <span className="text-text-muted text-xs font-medium uppercase tracking-wider">Subject:</span>
          <span className="text-text-main font-semibold truncate max-w-[120px]">{selectedSubject}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 right-0 sm:left-auto sm:right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-border/10 bg-surface p-1.5 shadow-[var(--shadow-card-hover)] min-w-48 scrollbar-thin"
          >
            {subjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  onChange(sub);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] truncate ${
                  selectedSubject === sub
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:bg-border/5 hover:text-text-main'
                }`}
              >
                {sub}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
