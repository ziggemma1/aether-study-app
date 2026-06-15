import React from 'react';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface Subject {
  name: string;
  proficiency: number;
  quizCount: number;
}

interface SubjectProficiencyProps {
  subjects: Subject[];
}

export default function SubjectProficiency({ subjects }: SubjectProficiencyProps) {
  const hasQuizzes = subjects.some(s => s.quizCount > 0);

  return (
    <div className="bg-surface border border-border/10 rounded-2xl p-5 space-y-6" id="subject-proficiency-block">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Domain Mastery</span>
          <h2 className="text-sm font-black text-main uppercase tracking-tight mt-0.5">Subject Proficiency</h2>
        </div>
        <span className="text-[9px] font-black uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
          Live Tracker
        </span>
      </div>

      <div className="space-y-4">
        {subjects.map((sub, i) => {
          // Calculate color style depending on mastery score
          let progressColor = "from-primary to-violet-400"; // high
          let textStatusColor = "text-primary";
          let statusLabel = "ADVANCING";

          if (sub.proficiency < 40) {
            progressColor = "from-red-500 to-orange-400";
            textStatusColor = "text-red-400";
            statusLabel = "KINDLING";
          } else if (sub.proficiency < 70) {
            progressColor = "from-amber-400 to-amber-500";
            textStatusColor = "text-amber-500";
            statusLabel = "COMPETENT";
          } else if (sub.proficiency >= 85) {
            progressColor = "from-[#00E5A0] to-[#00D2FF]";
            textStatusColor = "text-[#00E5A0]";
            statusLabel = "ELEVATED";
          }

          return (
            <div key={`${sub.name}-${i}`} className="space-y-1.5" id={`subject-prof-row-${i}`}>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-surface-alt border border-border/10 flex items-center justify-center text-text-muted/80">
                    <BookOpen size={10} />
                  </div>
                  <span className="font-bold text-text-main truncate max-w-[130px]">{sub.name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-black text-[10px] tracking-wider text-right">
                  <span className={textStatusColor}>{sub.proficiency}%</span>
                  <span className="text-[8px] text-text-muted/60">({sub.quizCount || 0} reps)</span>
                </div>
              </div>

              {/* High Fidelity custom progress track */}
              <div className="h-3 w-full bg-surface-alt border border-border/5 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${sub.proficiency || 2}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${progressColor} rounded-full`}
                />
              </div>

              {/* Status footer for each item */}
              <div className="flex items-center justify-between text-[7px] font-black text-text-muted/50 tracking-widest uppercase">
                <span>Subject Level</span>
                <span className={statusLabel !== 'KINDLING' ? textStatusColor : ''}>{statusLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!hasQuizzes && (
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-center">
          <p className="text-[9px] text-primary font-black uppercase tracking-wider">
            ⚡ PRO TIP: Complete notes quizzes to accelerate proficiency percentages!
          </p>
        </div>
      )}
    </div>
  );
}
