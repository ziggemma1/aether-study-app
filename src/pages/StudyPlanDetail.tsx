import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Clock, 
  Check, 
  Edit3, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  RotateCcw, 
  Share2, 
  Printer, 
  FileText,
  Loader2,
  X,
  Sliders
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import { useStudyPlans, ClientStudyPlan, DayActivity } from '../hooks/useStudyPlans';
import { cn } from '../lib/utils';

export default function StudyPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAppContext();
  const { getPlanById, updatePlan } = useStudyPlans();

  const [plan, setPlan] = useState<ClientStudyPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Inline Editors states
  const [editingDayIdx, setEditingDayIdx] = useState<number | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editMinutes, setEditMinutes] = useState(60);
  const [editActivities, setEditActivities] = useState<string[]>([]);
  const [newActivityInput, setNewActivityInput] = useState('');

  // Reschedule Settings Modal State
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleCommitment, setRescheduleCommitment] = useState(60);

  // Load plan details from backend
  const loadPlanDetails = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getPlanById(id);
    if (data) {
      setPlan(data);
      setRescheduleDate(data.startDate ? format(new Date(data.startDate), 'yyyy-MM-dd') : '');
      setRescheduleCommitment(data.dailyCommitment || 60);
    } else {
      showToast('Plan not found.', 'error');
      navigate('/plans');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPlanDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-text-muted text-sm">Parsing roadmap milestones...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background text-text-main p-6 text-center">
        <p className="text-sm text-text-muted mb-4">Study plan not found or deleted.</p>
        <button onClick={() => navigate('/plans')} className="btn-primary min-h-[44px]">Back to Planner</button>
      </div>
    );
  }

  // Calculate Progress values
  const completedDays = plan.days ? plan.days.filter(d => d.completed).length : 0;
  const totalDays = plan.days ? plan.days.length : 1;
  const progressPercentage = Math.round((completedDays / totalDays) * 100);

  // Toggle day completed status
  const handleToggleDayComplete = async (idxOfChanged: number) => {
    if (!plan.days) return;
    const modelId = plan.id || plan._id;
    if (!modelId) return;

    try {
      const updatedDays = plan.days.map((day, i) => 
        i === idxOfChanged ? { ...day, completed: !day.completed } : day
      );
      
      const res = await updatePlan(modelId, { days: updatedDays });
      if (res) {
        setPlan(res);
        showToast(
          updatedDays[idxOfChanged].completed ? 'Well done! Day complete!' : 'Day marked active.', 
          'success'
        );
      }
    } catch (err) {
      showToast('Failed to update progress.', 'error');
    }
  };

  // Open inline editor for a day
  const handleStartEditDay = (dayIndex: number, currentDay: DayActivity) => {
    setEditingDayIdx(dayIndex);
    setEditTopic(currentDay.topic);
    setEditMinutes(currentDay.estimatedTime || plan.dailyCommitment || 60);
    setEditActivities(currentDay.activities || []);
  };

  const handleSaveDayEdit = async () => {
    if (editingDayIdx === null || !plan.days) return;
    const modelId = plan.id || plan._id;
    if (!modelId) return;

    try {
      const updatedDays = plan.days.map((day, i) => {
        if (i === editingDayIdx) {
          return {
            ...day,
            topic: editTopic,
            estimatedTime: editMinutes,
            activities: editActivities
          };
        }
        return day;
      });

      const res = await updatePlan(modelId, { days: updatedDays });
      if (res) {
        setPlan(res);
        setEditingDayIdx(null);
        showToast('Day details updated!', 'success');
      }
    } catch (err) {
      showToast('Failed to save changes.', 'error');
    }
  };

  // Activities list modifiers in editor
  const handleAddEditActivity = () => {
    if (newActivityInput.trim()) {
      setEditActivities(prev => [...prev, newActivityInput.trim()]);
      setNewActivityInput('');
    }
  };

  const handleRemoveEditActivity = (aIdx: number) => {
    setEditActivities(prev => prev.filter((_, idx) => idx !== aIdx));
  };

  // Reordering days (Swap items up/down)
  const handleSwapDays = async (dayIndex: number, direction: 'up' | 'down') => {
    if (!plan.days) return;
    const modelId = plan.id || plan._id;
    if (!modelId) return;

    const targetIdx = direction === 'up' ? dayIndex - 1 : dayIndex + 1;
    if (targetIdx < 0 || targetIdx >= plan.days.length) return;

    try {
      const reordered = [...plan.days];
      
      // Swap content except keeping their Day index sequence
      const tempTopic = reordered[dayIndex].topic;
      const tempActivities = reordered[dayIndex].activities;
      const tempEstimatedTime = reordered[dayIndex].estimatedTime;
      const tempCompleted = reordered[dayIndex].completed;

      reordered[dayIndex].topic = reordered[targetIdx].topic;
      reordered[dayIndex].activities = reordered[targetIdx].activities;
      reordered[dayIndex].estimatedTime = reordered[targetIdx].estimatedTime;
      reordered[dayIndex].completed = reordered[targetIdx].completed;

      reordered[targetIdx].topic = tempTopic;
      reordered[targetIdx].activities = tempActivities;
      reordered[targetIdx].estimatedTime = tempEstimatedTime;
      reordered[targetIdx].completed = tempCompleted;

      const res = await updatePlan(modelId, { days: reordered });
      if (res) {
        setPlan(res);
        showToast('Schedule reordered.', 'success');
      }
    } catch (e) {
      showToast('Failed to swap days.', 'error');
    }
  };

  // Complete plan settings reschedule
  const handleReschedulePlan = async () => {
    const modelId = plan.id || plan._id;
    if (!modelId) return;

    try {
      const res = await updatePlan(modelId, {
        startDate: new Date(rescheduleDate),
        dailyCommitment: rescheduleCommitment
      });
      if (res) {
        setPlan(res);
        setIsRescheduleOpen(false);
        showToast('Study schedule relocated!', 'success');
      }
    } catch (e) {
      showToast('Rescheduling failed.', 'error');
    }
  };

  // Share action link
  const handleSharePlan = () => {
    const shareUrl = `${window.location.origin}/plans/${plan.id || plan._id}`;
    if (navigator.share) {
      navigator.share({
        title: plan.title,
        text: `Check out my custom study plan: ${plan.title}`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Share link copied to clipboard!', 'success');
    }
  };

  // Export as PDF action (or Print layout)
  const handlePrintPlan = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-text-main pb-24 font-sans print:bg-white print:text-black">
      <div className="max-w-md mx-auto px-4 pt-6 print:max-w-none print:pt-0">
        
        {/* Detail Header */}
        <div className="flex items-center justify-between mb-5 print:hidden">
          <button 
            onClick={() => navigate('/plans')}
            className="w-10 h-10 flex items-center justify-center bg-surface-alt border border-border rounded-xl active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <span className="text-xs font-semibold text-primary tracking-wider uppercase font-mono">
            Roadmap Detail
          </span>
          <div className="w-10 h-10 bg-surface-alt border border-border rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#00D2FF]" />
          </div>
        </div>

        {/* PLAN MAIN CARDBOXAL */}
        <div className="bg-surface-alt border border-border rounded-3xl p-5 mb-5 shadow-2xl print:border-none print:shadow-none print:p-0">
          <h1 className="text-xl font-extrabold text-text-main tracking-tight line-clamp-2 print:text-black print:text-2xl">
            {plan.title || 'Modular Syllabus Roadmap'}
          </h1>
          <p className="text-xs text-text-muted mt-1 print:text-gray-600">
            {plan.goal} • {plan.complexity} difficulty level
          </p>

          {/* Timeline details */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-medium text-text-muted">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>
                {plan.startDate ? format(new Date(plan.startDate), 'MMM dd') : 'N/A'} - {plan.endDate ? format(new Date(plan.endDate), 'MMM dd') : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Clock className="w-4 h-4 text-[#00D2FF]" />
              <span>{plan.dailyCommitment} mins/day</span>
            </div>
          </div>

          {/* Interactive Progress Indicators */}
          <div className="space-y-2 mt-5 bg-background border border-border/60 p-3.5 rounded-2xl print:border-none">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-text-muted flex items-center gap-1">
                Completed {completedDays} of {totalDays} milestones
              </span>
              <span className="text-[#00E5A0] font-mono">{progressPercentage}%</span>
            </div>
            {/* Horizontal progress bar */}
            <div className="w-full h-2 bg-surface-alt rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-[#00E5A0] rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Actions grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/80 print:hidden">
            <button 
              onClick={() => setIsRescheduleOpen(true)}
              className="flex flex-col items-center gap-1.5 py-2.5 bg-surface-alt/40 rounded-xl hover:bg-surface-alt text-[10px] font-bold text-text-muted min-h-[44px]"
            >
              <Sliders className="w-4 h-4 text-[#00D2FF]" />
              <span>Reschedule</span>
            </button>
            <button 
              onClick={handleSharePlan}
              className="flex flex-col items-center gap-1.5 py-2.5 bg-surface-alt/40 rounded-xl hover:bg-surface-alt text-[10px] font-bold text-text-muted min-h-[44px]"
            >
              <Share2 className="w-4 h-4 text-primary" />
              <span>Share</span>
            </button>
            <button 
              onClick={handlePrintPlan}
              className="flex flex-col items-center gap-1.5 py-2.5 bg-surface-alt/40 rounded-xl hover:bg-surface-alt text-[10px] font-bold text-text-muted min-h-[44px]"
            >
              <Printer className="w-4 h-4 text-[#00E5A0]" />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>

        {/* DAY BY DAY SCHEDULE */}
        <h3 className="text-sm font-bold text-text-main mb-3.5 px-1.5 print:mt-10 print:text-black">
          📅 Day-by-Day Syllabus Sequence
        </h3>

        <div className="space-y-4 print:space-y-6">
          {plan.days?.map((day, idx) => {
            const isEditing = editingDayIdx === idx;
            const formattedDayDate = day.date 
              ? format(new Date(day.date), 'EEEE, MMM dd') 
              : `Day ${day.day}`;

            return (
              <div 
                key={idx}
                className={cn(
                  "border rounded-3xl p-4.5 transition-all relative overflow-hidden print:border-gray-300 print:shadow-none",
                  day.completed 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-surface-alt border-border hover:border-border"
                )}
              >
                {/* Visual day complete status indicator */}
                {day.completed && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full flex items-center justify-center pointer-events-none">
                    <Check className="w-4 h-4 text-primary translate-x-1.5 -translate-y-1.5" />
                  </div>
                )}

                {/* Day Header */}
                <div className="flex items-start justify-between gap-3 mb-2 pb-2.5 border-b border-border/55 print:border-gray-200">
                  <div className="flex items-center gap-2.5">
                    {/* Tick Checkbox */}
                    <button
                      onClick={() => handleToggleDayComplete(idx)}
                      className={cn(
                        "w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer min-h-[36px] min-w-[36px]",
                        day.completed 
                          ? "bg-primary border-primary text-white" 
                          : "border-border hover:border-primary"
                      )}
                    >
                      {day.completed && <Check className="w-4 h-4" />}
                    </button>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-primary uppercase">
                        Day {day.day}
                      </h4>
                      <p className="text-[10px] text-text-muted font-medium">
                        {formattedDayDate}
                      </p>
                    </div>
                  </div>

                  {/* Swap/Controls Area */}
                  <div className="flex items-center gap-1.5 print:hidden">
                    <button
                      onClick={() => handleSwapDays(idx, 'up')}
                      disabled={idx === 0}
                      className="w-8 h-8 rounded-full hover:bg-surface-alt/80 disabled:opacity-20 text-text-muted flex items-center justify-center min-h-[32px]"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSwapDays(idx, 'down')}
                      disabled={idx === plan.days.length - 1}
                      className="w-8 h-8 rounded-full hover:bg-surface-alt/80 disabled:opacity-20 text-text-muted flex items-center justify-center min-h-[32px]"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleStartEditDay(idx, day)}
                      className="w-8 h-8 rounded-full hover:bg-surface-alt text-[#00D2FF] flex items-center justify-center min-h-[32px] ml-1"
                      title="Edit Session"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day content and tasks */}
                {isEditing ? (
                  /* INLINE CARD EDITOR */
                  <div className="space-y-3 pt-2 text-xs">
                    <div>
                      <label className="block text-text-muted font-bold mb-1">Session Topic</label>
                      <input 
                        type="text" 
                        value={editTopic}
                        onChange={(e) => setEditTopic(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary min-h-[38px]"
                      />
                    </div>

                    <div>
                      <label className="block text-text-muted font-bold mb-1">Estimated Time (mins)</label>
                      <input 
                        type="number" 
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(parseInt(e.target.value, 10) || 60)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary min-h-[38px]"
                      />
                    </div>

                    <div>
                      <label className="block text-text-muted font-bold mb-1">Activities List</label>
                      
                      <div className="space-y-1.5 max-h-32 overflow-y-auto mb-2">
                        {editActivities.map((act, aIdx) => (
                          <div key={aIdx} className="flex items-center justify-between bg-surface-alt/60 px-2.5 py-1.5 rounded-lg border border-border/40">
                            <span className="text-[11px] font-medium text-text-muted">{act}</span>
                            <button onClick={() => handleRemoveEditActivity(aIdx)} className="p-1">
                              <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex bg-background border border-border rounded-xl overflow-hidden px-1 py-1 min-h-[40px]">
                        <input 
                          type="text" 
                          placeholder="Add new study activities..."
                          value={newActivityInput}
                          onChange={(e) => setNewActivityInput(e.target.value)}
                          className="flex-grow bg-transparent text-[11px] text-text-main outline-none px-2 placeholder-gray-700"
                        />
                        <button 
                          onClick={handleAddEditActivity}
                          className="bg-primary/20 hover:bg-primary/30 text-primary text-[11px] px-3.5 rounded-lg font-bold"
                        >
                          Plus
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-2">
                      <button
                        onClick={handleSaveDayEdit}
                        className="flex-grow bg-primary text-white text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1 shadow-lg cursor-pointer min-h-[38px]"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingDayIdx(null)}
                        className="bg-surface-alt/60 hover:bg-surface-alt text-text-muted border border-border text-xs px-4 py-2 rounded-xl font-bold min-h-[38px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* CHRONOLOGICAL VIEW CARD */
                  <div className="pt-1.5">
                    <p className="text-xs font-extrabold text-text-main line-clamp-2 print:text-black">
                      {day.topic || 'Subject Studies review'}
                    </p>

                    {/* Time estimate */}
                    <div className="flex items-center gap-1 text-[10px] text-text-muted font-mono mt-1.5">
                      <Clock className="w-3 h-3 text-[#00D2FF]" />
                      <span>{day.estimatedTime || plan.dailyCommitment || 60} minutes study review</span>
                    </div>

                    {/* List of subtasks */}
                    {day.activities && day.activities.length > 0 && (
                      <div className="mt-3.5 space-y-1.5 pl-0.5">
                        {day.activities.map((act, actIdx) => (
                          <div 
                            key={actIdx} 
                            className="flex items-start gap-2 text-xs text-text-muted print:text-gray-700"
                          >
                            <span className="text-[#00E5A0] font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{act}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MODAL: RESCHEDULE/RELOCATE PLAN */}
        <AnimatePresence>
          {isRescheduleOpen && (
            <div className="fixed inset-0 bg-black/75 flex items-end justify-center z-50 p-4 pb-12 print:hidden">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="w-full max-w-sm bg-surface-alt border border-border rounded-t-3xl p-6 shadow-2xl relative"
              >
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setIsRescheduleOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-text-muted" />
                  </button>
                </div>

                <div className="mb-5">
                  <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#00D2FF]" />
                    Reschedule Studies Project
                  </h3>
                  <p className="text-[10px] text-text-muted mt-1">
                    Relocate dates or commitment structure smoothly.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-semibold text-text-muted">
                  <div>
                    <label className="block text-text-muted text-xs font-semibold mb-1.5">New Start Date</label>
                    <input 
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-text-main outline-none min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-text-muted text-xs font-semibold mb-1.5">Daily Commitment (mins)</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[30, 60, 120, 240].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setRescheduleCommitment(mins)}
                          className={cn(
                            "py-2 rounded-xl border text-center font-bold text-xs cursor-pointer min-h-[40px]",
                            rescheduleCommitment === mins
                              ? "bg-primary border-primary text-white shadow-primary/20 shadow-md"
                              : "bg-background border-border text-text-muted"
                          )}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReschedulePlan}
                  className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-extrabold py-3.5 rounded-xl shadow-lg mt-6 active:scale-98 cursor-pointer min-h-[44px]"
                >
                  Apply Rescheduled Schedule
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
