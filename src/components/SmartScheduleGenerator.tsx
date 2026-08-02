import React, { useState } from 'react';
import { Sparkles, Loader2, CalendarRange, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';

interface RecommendedBlock {
  hour: number;
  label: string;
}

const formatHourRange = (hour: number) => {
  const start = new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { hour: 'numeric' });
  const end = new Date(0, 0, 0, (hour + 1) % 24).toLocaleTimeString('en-US', { hour: 'numeric' });
  return `${start} - ${end}`;
};

const labelForHour = (hour: number) => {
  if (hour < 12) return 'Deep Focus Block';
  if (hour < 17) return 'Active Review Block';
  return 'Wind-Down Review';
};

// Generic starter suggestion for accounts without enough history yet — kept
// clearly separate from the personalized branch below so the UI can be
// honest about which one it's showing.
const STARTER_BLOCKS: RecommendedBlock[] = [
  { hour: 9, label: 'Deep Focus Block' },
  { hour: 15, label: 'Active Review Block' },
  { hour: 20, label: 'Wind-Down Review' }
];

export default function SmartScheduleGenerator() {
  const { studySessions, setStudySessions, showToast } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [applied, setApplied] = useState(false);
  const [blocks, setBlocks] = useState<RecommendedBlock[]>([]);
  const [isPersonalized, setIsPersonalized] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setApplied(false);

    // Derived from the user's own logged sessions, not an LLM call — real
    // signal (their actual most-productive hours) rather than a fabricated
    // recommendation with no basis in their data.
    setTimeout(() => {
      const studyOnly = studySessions.filter(s => s.type === 'study');
      const minutesByHour = new Array(24).fill(0);
      studyOnly.forEach(s => {
        const hour = new Date(s.startTime).getHours();
        minutesByHour[hour] += s.durationMinutes || 0;
      });

      const ranked = minutesByHour
        .map((mins, hour) => ({ hour, mins }))
        .filter(h => h.mins > 0)
        .sort((a, b) => b.mins - a.mins);

      const picked: { hour: number }[] = [];
      for (const h of ranked) {
        if (picked.length >= 3) break;
        if (picked.every(p => Math.abs(p.hour - h.hour) >= 3)) picked.push(h);
      }
      picked.sort((a, b) => a.hour - b.hour);

      if (picked.length >= 2) {
        setBlocks(picked.map(p => ({ hour: p.hour, label: labelForHour(p.hour) })));
        setIsPersonalized(true);
      } else {
        setBlocks(STARTER_BLOCKS);
        setIsPersonalized(false);
      }

      setIsGenerating(false);
      setShowResult(true);
    }, 900);
  };

  const handleApply = async () => {
    if (isApplying || blocks.length === 0) return;
    setIsApplying(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const created = await Promise.all(blocks.map(block => {
        const startTime = new Date(tomorrow);
        startTime.setHours(block.hour, 0, 0, 0);
        return api.post('/sessions', {
          title: block.label,
          startTime: startTime.toISOString(),
          durationMinutes: 60,
          type: 'study',
          completed: false
        });
      }));

      setStudySessions(prev => [
        ...prev,
        ...created.map(res => ({ ...res.data, id: res.data._id || res.data.id }))
      ]);

      setApplied(true);
      showToast(`Added ${blocks.length} sessions to tomorrow's calendar!`);
    } catch (err) {
      console.error('Failed to apply schedule:', err);
      showToast('Failed to add sessions to calendar', 'error');
    } finally {
      setIsApplying(false);
    }
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
          <h3 className="text-sm font-bold text-text-main">Smart Schedule</h3>
          <p className="text-[10px] text-text-muted">Based on your own study history</p>
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
                <><Sparkles size={14} /> Suggest Study Blocks</>
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
                <CalendarRange size={12} className="text-primary" />
                {isPersonalized ? 'Your Most Productive Hours' : 'Starter Suggestion'}
              </h4>
              {!isPersonalized && (
                <p className="text-[9px] text-text-muted mb-2">
                  Not enough session history yet for a personalized flow — here's a sensible starting point.
                </p>
              )}
              <ul className="space-y-2">
                {blocks.map((block, i) => (
                  <li key={i} className="flex justify-between items-center text-[10px]">
                    <span className="text-text-muted">{block.label}</span>
                    <span className="font-medium text-text-main flex items-center gap-1">
                      <Clock size={10} /> {formatHourRange(block.hour)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleApply}
                disabled={isApplying || applied}
                className="flex-1 py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isApplying ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : applied ? (
                  <><CheckCircle2 size={12} /> Added</>
                ) : (
                  'Apply to Tomorrow'
                )}
              </button>
              <button
                onClick={() => { setShowResult(false); setApplied(false); }}
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
