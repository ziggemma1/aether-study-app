import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

interface Topic {
  id: string;
  chapter: string;
  content: string;
}

interface SkillTreeViewProps {
  subject: string;
  topics: Topic[];
  onTopicSelect: (topic: Topic) => void;
}

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({ subject, topics, onTopicSelect }) => {
  const { user } = useAppContext();
  // We can track completed items from the user's progress. 
  // Let's pretend some are unlocked.
  // Actually, let's just make the first one un-locked, and conditionally unlock next.

  // Simulate progress logic based on some external metric or just index.
  // If no real progress is tracked, we can let user click any, but visualize it nicely.
  
  return (
    <div className="relative py-12 px-4 flex flex-col items-center">
      <h3 className="text-2xl font-bold mb-12 text-center text-text-main flex items-center gap-3">
        <Sparkles className="text-primary" /> {subject} Skill Tree
      </h3>
      
      <div className="relative w-full max-w-md">
        {/* Connection lines background */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1.5 -ml-[3px] bg-surface-alt rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]" />

        <div className="space-y-12 relative z-10 w-full flex flex-col items-center">
          {topics.map((topic, index) => {
            // For showcase, let's say index 0 is completed, index 1 is current, rest are locked
            // However, users should be able to click them for now if we don't have hard logic.
            const isCompleted = index === 0;
            const isCurrent = index === 1 || index === 0; // Just for visuals
            const isLocked = false; // index > 1; // Actually let them proceed since it's a demo, or strictly lock? We'll make it always clickable for now, but style to look RPG-like.

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, type: 'spring', bounce: 0.4 }}
                className={cn(
                  "relative group flex flex-col items-center",
                  // Alternate side for nodes?
                  // Try to do zigzag
                  index % 2 === 0 ? "self-start ml-4 sm:ml-12" : "self-end mr-4 sm:mr-12"
                )}
              >
                {/* Node Button */}
                <button
                  onClick={() => onTopicSelect(topic)}
                  className={cn(
                    "w-[calc(100vw-8rem)] sm:w-64 glass-card p-4 transition-all duration-300 relative border-2 text-left",
                    isLocked 
                      ? "opacity-60 grayscale hover:grayscale-0 cursor-not-allowed border-border" 
                      : "hover:border-primary/50 border-primary/20 shadow-lg shadow-primary/5 hover:scale-105"
                  )}
                >
                   <div className={cn(
                     "absolute -top-4 -left-4 w-12 h-12 rounded-full border-4 border-background flex items-center justify-center z-20 shadow-xl",
                     isCompleted ? "bg-green-500 text-white" : isLocked ? "bg-surface text-text-muted" : "bg-primary text-white animate-pulse"
                   )}>
                     {isCompleted ? <Check size={20} strokeWidth={3} /> : isLocked ? <Lock size={20} /> : <div className="w-3 h-3 bg-white rounded-full" />}
                   </div>

                   <div className="pl-6">
                     <h4 className="font-bold text-text-main leading-tight mb-1">{topic.chapter}</h4>
                     <p className="text-[10px] sm:text-xs text-text-muted line-clamp-2">{topic.content}</p>
                   </div>
                </button>
                
                {/* Connecting lines for zigzag pattern */}
                {index < topics.length - 1 && (
                  <svg className="absolute -bottom-12 w-full h-12 pointer-events-none z-[-1]">
                     {/* SVG path to draw a cool glowing line to next node could go here */}
                  </svg>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
