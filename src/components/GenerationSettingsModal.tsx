import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Zap, Sparkles, Brain, Layers, BarChart } from 'lucide-react';
import { cn } from '../lib/utils';

interface GenerationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (settings: {
    count: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    complexity: 'Basic' | 'Standard' | 'Comprehensive';
  }) => void;
  type: 'Quiz' | 'Flashcards';
}

export const GenerationSettingsModal: React.FC<GenerationSettingsModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  type
}) => {
  const [count, setCount] = useState(type === 'Quiz' ? 10 : 15);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [complexity, setComplexity] = useState<'Basic' | 'Standard' | 'Comprehensive'>('Standard');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-surface w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl border border-border/10 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main">Customize {type}</h3>
                <p className="text-xs text-text-muted">Set your preferences for AI generation</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-alt rounded-full text-text-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8">
            {/* Count Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-text-main">
                  <Layers size={16} className="text-primary" />
                  Number of {type === 'Quiz' ? 'Questions' : 'Cards'}
                </label>
                <span className="text-lg font-black text-primary">{count}</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max={type === 'Quiz' ? 30 : 50} 
                step="5"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full h-2 bg-surface-alt rounded-full appearance-none cursor-pointer accent-primary border border-border/50"
              />
              <div className="flex justify-between text-[11px] font-bold text-text-muted uppercase tracking-widest px-1">
                <span>5</span>
                <span>{type === 'Quiz' ? '30' : '50'}</span>
              </div>
            </div>

            {/* Difficulty Selector (Only for Quiz) */}
            {type === 'Quiz' && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-text-main mb-1">
                  <BarChart size={16} className="text-secondary" />
                  Challenge Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={cn(
                        "py-3 px-4 rounded-xl text-xs font-bold transition-all border-2",
                        difficulty === level 
                          ? "bg-secondary/10 border-secondary text-secondary shadow-lg shadow-secondary/5" 
                          : "bg-surface-alt border-border text-text-muted hover:border-secondary/30"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Complexity Selector (Only for Quiz) */}
            {type === 'Quiz' && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-text-main mb-1">
                  <Brain size={16} className="text-accent" />
                  Depth of Detail
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Basic', 'Standard', 'Comprehensive'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setComplexity(level)}
                      className={cn(
                        "py-3 px-2 rounded-xl text-[11px] font-bold transition-all border-2",
                        complexity === level 
                          ? "bg-accent/10 border-accent text-accent shadow-lg shadow-accent/5" 
                          : "bg-surface-alt border-border text-text-muted hover:border-accent/30"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => onGenerate({ count, difficulty, complexity })}
              className="w-full flex items-center justify-center gap-3 p-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all group mt-4"
            >
              <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
              Generate Customized {type}
              <Zap size={18} className="fill-white" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
