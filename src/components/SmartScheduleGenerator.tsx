import React, { useState } from 'react';
import { Sparkles, Loader2, CalendarRange, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmartScheduleGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI generation process
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
    }, 2000);
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Sparkles size={64} />
      </div>
      
      <div className="flex items-center gap-2 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
          <Sparkles size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-main">AI Schedule Generator</h3>
          <p className="text-[10px] text-text-muted">Optimize based on energy & deadlines</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key="generate-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            >
              {isGenerating ? (
                <><Loader2 size={14} className="animate-spin" /> Analyzing study patterns...</>
              ) : (
                <><Sparkles size={14} /> Generate Optimal Schedule</>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-col gap-2 relative z-10 mt-2"
          >
            <div className="bg-background/60 rounded-xl p-3 border border-border/30">
              <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5 mb-2">
                <CalendarRange size={12} className="text-primary" /> Recommended Weekly Flow
              </h4>
              <ul className="space-y-2">
                <li className="flex justify-between items-center text-[10px]">
                  <span className="text-text-muted">Deep Work (Sci/Math)</span>
                  <span className="font-medium text-text-main flex items-center gap-1"><Clock size={10} /> 8:00 AM - 11:00 AM</span>
                </li>
                <li className="flex justify-between items-center text-[10px]">
                  <span className="text-text-muted">Creative/Humanities</span>
                  <span className="font-medium text-text-main flex items-center gap-1"><Clock size={10} /> 2:00 PM - 4:00 PM</span>
                </li>
                <li className="flex justify-between items-center text-[10px]">
                  <span className="text-text-muted">Review & Flashcards</span>
                  <span className="font-medium text-text-main flex items-center gap-1"><Clock size={10} /> 8:00 PM - 9:00 PM</span>
                </li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-colors">
                Apply to Calendar
              </button>
              <button 
                onClick={() => setShowResult(false)}
                className="flex-1 py-2 bg-surface-alt text-text-main text-[10px] font-bold rounded-lg border border-border/50 hover:bg-surface transition-colors"
              >
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
