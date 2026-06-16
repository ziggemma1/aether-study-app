import React, { useState } from 'react';
import { useCalendar } from '../../hooks/useCalendar';
import { Sparkles, CalendarCheck, Clock, BookOpen, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SmartSchedule({ isInsideSidebar }: { isInsideSidebar?: boolean }) {
  const { aiSchedule, events, syncStatus } = useCalendar();
  const [topics, setTopics] = useState('Math, Science, History');
  const [dailyCommitment, setDailyCommitment] = useState('1h');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSlots, setGeneratedSlots] = useState<{start: string, end: string, topic: string}[] | null>(null);

  const handleSmartSchedule = async () => {
    setIsGenerating(true);
    // Call AI scheduling backend
    await aiSchedule(topics.split(',').map(t => t.trim()), dailyCommitment);
    
    // Simulate returned slots for display logic as part of the prompt
    // In a real app the api would return these specifically
    setTimeout(() => {
      setGeneratedSlots([
        { start: '10:00 AM', end: '11:00 AM', topic: 'Math' },
        { start: '2:30 PM', end: '3:30 PM', topic: 'Science' },
        { start: '7:00 PM', end: '8:00 PM', topic: 'History' },
      ]);
      setIsGenerating(false);
    }, 1200);
  };

  const wrapperClass = isInsideSidebar
    ? "flex flex-col relative w-full shrink-0"
    : "bg-[#141A24] rounded-2xl p-6 border border-white/5 shadow-[0_0_15px_rgba(108,92,231,0.05)] w-full shrink-0 flex flex-col relative overflow-hidden";

  return (
    <div className={wrapperClass}>
      {!isInsideSidebar && <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6C5CE7]/10 rounded-full blur-2xl pointer-events-none" />}
      
      <div className="bg-[#0B0E14] rounded-xl p-4 border border-[rgba(255,255,255,0.06)] flex flex-col relative overflow-hidden">
        {isInsideSidebar && <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6C5CE7]/10 rounded-full blur-2xl pointer-events-none" />}
        <div className="flex flex-col gap-1 mb-4 relative z-10">
          <h3 className="text-[#F0F3F8] font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            🤖 Smart Scheduler
          </h3>
          <p className="text-xs text-[#8E9AAF] mt-1">
            AI will analyze your calendar and find optimal study periods.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4 relative z-10">
        <div>
          <label className="block text-xs text-[#8E9AAF] mb-1 font-medium">Topics to cover (comma separated):</label>
          <input 
            type="text" 
            value={topics}
            onChange={e => setTopics(e.target.value)}
            className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C5CE7] transition-colors"
            placeholder="e.g. Math, Science"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[#8E9AAF] font-medium">Daily Commitment:</label>
          <select 
            value={dailyCommitment}
            onChange={e => setDailyCommitment(e.target.value)}
            className="bg-[#0B0E14] border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-[#6C5CE7] transition-colors"
          >
            <option value="1h">1h</option>
            <option value="2h">2h</option>
            <option value="4h">4h</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSmartSchedule}
          disabled={isGenerating}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex justify-center items-center gap-2 ${
            isGenerating ? 'bg-[#2D3748] text-gray-400 cursor-not-allowed' : 'bg-[#6C5CE7] hover:bg-[#5B4CDB] text-white shadow-lg shadow-[#6C5CE7]/20'
          }`}
        >
          {isGenerating ? 'Analyzing...' : '🔮 Generate Optimal Schedule'}
        </motion.button>

        {generatedSlots && !isGenerating && (
          <div className="mt-2 pt-4 border-t border-white/5">
            <p className="text-sm font-medium text-[#F0F3F8] mb-3">Found {generatedSlots.length} available slots today:</p>
            <div className="space-y-2">
              {generatedSlots.map((slot, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#0B0E14] border border-white/5">
                  <span className="flex items-center gap-2 text-[#8E9AAF]"><Clock className="w-3 h-3 text-[#6C5CE7]" /> {slot.start} - {slot.end}</span>
                  <span className="text-[#F0F3F8] font-medium">→ {slot.topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
