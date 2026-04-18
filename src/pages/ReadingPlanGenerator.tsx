import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  ArrowLeft, 
  Zap, 
  Target, 
  BarChart3,
  Save,
  RotateCcw,
  Edit2,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { format, addDays, startOfToday } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { generateStudyPlan } from '../services/geminiService';

import { PlanSession, SavedPlan } from '../types';

export default function ReadingPlanGenerator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Read multi-materials from URL
  const materialIdStr = searchParams.get('materials') || searchParams.get('materialId');
  const materialIds = materialIdStr ? materialIdStr.split(',') : [];
  
  const { materials, savedPlans, setSavedPlans, showToast, t } = useAppContext();
  const selectedMaterials = materials.filter(m => materialIds.includes(m.id));

  // Form States
  const [startDate, setStartDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [duration, setDuration] = useState(7);
  const [complexity, setComplexity] = useState('Intermediate');
  const [commitment, setCommitment] = useState('1h');
  const [goal, setGoal] = useState('Exam Prep');
  
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<PlanSession[]>([]);
  const [view, setView] = useState<'generator' | 'saved'>('generator');
  
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Auto-load plan if planId is provided in search params
  useEffect(() => {
    const planId = searchParams.get('planId');
    if (planId && savedPlans.length > 0) {
      const existingPlan = savedPlans.find(p => p.id === planId);
      if (existingPlan) {
        setPlan(existingPlan.sessions);
        setIsGenerated(true);
        setView('generator');
      }
    }
  }, [searchParams, savedPlans]);

  const handleGenerate = async () => {
    if (selectedMaterials.length === 0) {
      showToast('Please select at least one material first.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const generatedPlan = await generateStudyPlan(
        selectedMaterials,
        startDate,
        duration,
        goal,
        complexity,
        commitment
      );
      
      const planWithIds = generatedPlan.map(session => ({
        ...session,
        id: session.id || Math.random().toString(36).substr(2, 9)
      }));

      setPlan(planWithIds);
      setIsGenerated(true);
      setView('generator');
      showToast('Your personalized study plan is ready!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to generate study plan. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = () => {
    const planTitle = selectedMaterials.length === 1 
      ? `${duration}-Day ${goal} Plan for ${selectedMaterials[0].title}`
      : `${duration}-Day Combined ${goal} Plan`;

    const newSavedPlan = {
      id: Math.random().toString(36).substr(2, 9),
      title: planTitle,
      date: format(new Date(), 'MMM d, yyyy'),
      progress: progress,
      sessions: [...plan]
    };
    setSavedPlans(prev => [newSavedPlan, ...prev]);
    setView('saved');
    showToast('Plan saved to your Study Roadmaps!', 'success');
  };

  const toggleComplete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlan(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const toggleEdit = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlan(prev => prev.map(s => s.id === id ? { ...s, isEditing: !s.isEditing } : s));
  };

  const updateTopic = (id: string, newTopic: string) => {
    setPlan(prev => prev.map(s => s.id === id ? { ...s, topic: newTopic } : s));
  };

  const toggleExpand = (id: string) => {
    setExpandedSessionId(prev => prev === id ? null : id);
  };

  const completedCount = plan.filter(s => s.completed).length;
  const progress = plan.length > 0 ? Math.round((completedCount / plan.length) * 100) : 0;

  const upcomingPlans = savedPlans.filter(p => p.progress < 100);
  const completedPlans = savedPlans.filter(p => p.progress === 100);

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-6xl mx-auto">
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl"
          >
            <div className="max-w-md w-full glass-card p-10 flex flex-col items-center text-center space-y-8 shadow-[0_0_50px_rgba(139,92,246,0.3)] border-primary/20">
              <div className="relative">
                <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary animate-pulse">
                  <Zap size={40} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-surface border-4 border-background rounded-full flex items-center justify-center text-secondary">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-extrabold text-text-main tracking-tight">
                  {t('crafting_roadmap')}
                </h2>
                <p className="text-text-muted text-sm leading-relaxed">
                  {t('crafting_roadmap_desc')}
                </p>
                <div className="flex flex-col gap-2 pt-4">
                  <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    <span>Analyzing content</span>
                    <span className="text-primary">In progress</span>
                  </div>
                  <div className="w-full bg-border/30 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 15, repeat: Infinity }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-text-muted italic">
                Aether Study: Intelligence optimized for focus.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> {t('search')}
        </button>
        
        {savedPlans.length > 0 && (
          <button 
            onClick={() => setView(view === 'saved' ? 'generator' : 'saved')}
            className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2"
          >
            {view === 'saved' ? <Zap size={14} /> : <Save size={14} />}
            {view === 'saved' ? t('back_to_generator') : `${t('view_saved_plans')} (${savedPlans.length})`}
          </button>
        )}
      </div>

      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            {view === 'saved' ? <Save size={20} /> : <Zap size={20} />}
          </div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">
            {view === 'saved' ? t('my_saved_plans') : t('ai_study_planner')}
          </h1>
        </div>
        <p className="text-text-muted">
          {view === 'saved' 
            ? t('my_saved_plans_desc') 
            : t('ai_study_planner_desc')}
        </p>
      </header>

      {view === 'saved' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Upcoming Plans */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-primary rounded-full" />
              <h2 className="text-xl font-bold text-text-main">{t('upcoming_plans')}</h2>
            </div>
            
            {upcomingPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingPlans.map(p => (
                  <div key={p.id} className="glass-card p-6 border-border/40 hover:border-primary/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <CalendarIcon size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{p.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-main mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-grow h-1.5 bg-surface-alt rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-primary">{p.progress}%</span>
                    </div>
                    <button 
                      onClick={() => {
                        setPlan(p.sessions);
                        setIsGenerated(true);
                        setView('generator');
                      }}
                      className="w-full py-2.5 bg-surface-alt hover:bg-primary/10 text-text-main hover:text-primary rounded-xl text-xs font-bold transition-all"
                    >
                      {t('continue_studying')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-border/30">
                <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center text-text-muted mb-4 opacity-50">
                  <CalendarIcon size={32} />
                </div>
                <p className="text-text-muted font-medium">{t('no_upcoming_plans')}</p>
                <button onClick={() => setView('generator')} className="text-primary text-sm font-bold mt-2 hover:underline">{t('create_one_now')}</button>
              </div>
            )}
          </section>

          {/* Completed Plans */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-green-500 rounded-full" />
              <h2 className="text-xl font-bold text-text-main">{t('done')}</h2>
            </div>
            
            {completedPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedPlans.map(p => (
                  <div key={p.id} className="glass-card p-6 border-border/40 opacity-80 grayscale-[0.5]">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{p.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-main mb-2">{p.title}</h3>
                    <div className="flex items-center gap-2 text-green-500 text-xs font-bold">
                      <Check size={14} /> Plan Completed
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-border/30">
                <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center text-text-muted mb-4 opacity-50">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-text-muted font-medium">{t('no_completed_plans')}</p>
              </div>
            )}
          </section>
        </motion.div>
      ) : !isGenerated ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 lg:p-10 border-border/40 shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column: Basic Info */}
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold mb-3 text-text-main flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" /> Selected Material(s)
                </label>
                <div className="p-4 bg-surface-alt/50 rounded-2xl border border-border flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                    <BookOpen size={20} />
                  </div>
                  <span className="font-bold text-text-main">
                    {selectedMaterials.length > 1 
                      ? `${selectedMaterials.length} Materials Combined`
                      : selectedMaterials[0]?.title || 'Select a material from Library'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-3 text-text-main flex items-center gap-2">
                    <CalendarIcon size={16} className="text-primary" /> {t('start_date')}
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border focus:ring-2 focus:ring-primary/20 outline-none bg-surface-alt/50 text-text-main transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-3 text-text-main flex items-center gap-2">
                    <Clock size={16} className="text-primary" /> {t('duration_days')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={duration || ''}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-2xl border border-border focus:ring-2 focus:ring-primary/20 outline-none bg-surface-alt/50 text-text-main transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 text-text-main flex items-center gap-2">
                  <Target size={16} className="text-primary" /> {t('learning_goal')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Exam Prep', 'Deep Dive', 'Quick Review'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={cn(
                        "py-3 rounded-xl text-xs font-bold border transition-all",
                        goal === g 
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                          : "bg-surface-alt/30 border-border text-text-muted hover:border-primary/30"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Personalization */}
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold mb-3 text-text-main flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary" /> {t('complexity_level')}
                </label>
                <div className="flex p-1 bg-surface-alt/50 rounded-2xl border border-border">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setComplexity(level)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
                        complexity === level ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-text-main"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 text-text-main flex items-center gap-2">
                  <Clock size={16} className="text-primary" /> {t('daily_commitment')}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {['30m', '1h', '2h', '4h+'].map((time) => (
                    <button
                      key={time}
                      onClick={() => setCommitment(time)}
                      className={cn(
                        "py-3 rounded-xl text-xs font-bold border transition-all",
                        commitment === time 
                          ? "bg-secondary text-primary border-secondary shadow-sm" 
                          : "bg-surface-alt/30 border-border text-text-muted hover:border-secondary/30"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleGenerate} 
                  className={cn(
                    "w-full btn-primary py-4 flex items-center justify-center gap-3 text-lg relative overflow-hidden",
                    isGenerating && "opacity-80 cursor-not-allowed"
                  )}
                  disabled={selectedMaterials.length === 0 || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {t('generating_plan')}
                    </>
                  ) : (
                    <>
                      <Zap size={20} /> {t('generate_plan')}
                    </>
                  )}
                  {isGenerating && (
                    <motion.div 
                      initial={{ left: '-100%' }}
                      animate={{ left: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="absolute top-0 bottom-0 w-1/2 bg-white/20 skew-x-[45deg]"
                    />
                  )}
                </button>
                {selectedMaterials.length === 0 && !isGenerating && (
                  <p className="text-red-400 text-xs text-center mt-2">Please select materials from the Library first.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Plan Header Stats */}
          <div className="glass-card p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-border/40">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <BarChart3 size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-main mb-1">Your {duration}-Day {goal} Plan</h2>
                <p className="text-sm text-text-muted flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-surface-alt/50 rounded-md border border-border text-[10px] font-bold uppercase tracking-wider">{complexity}</span>
                  <span>Target: {plan[plan.length - 1]?.date}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Commitment</p>
                <p className="text-lg font-bold text-text-main">{commitment}/day</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Progress</p>
                  <p className="text-2xl font-bold text-primary">{progress}%</p>
                </div>
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-border"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 - (175.9 * progress) / 100}
                      className="text-primary transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-main">
                    {completedCount}/{plan.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Table */}
          <div className="glass-card overflow-hidden border-border/40 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-alt/50 border-b border-border">
                    <th className="px-6 py-4 w-10"></th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Day</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Study Topic</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Duration</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                {plan.map((session) => (
                  <tbody key={session.id} className="border-b border-border/50 last:border-0">
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => toggleExpand(session.id)}
                      className={cn(
                        "group transition-colors cursor-pointer",
                        session.completed ? "bg-surface-alt/10" : "hover:bg-surface-alt/30"
                      )}
                    >
                      <td className="px-4 py-4 text-text-muted">
                        {expandedSessionId === session.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary font-bold text-xs">
                          {session.day}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-text-main">{session.date}</span>
                      </td>
                      <td className="px-6 py-4 min-w-[240px]">
                        {session.isEditing ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={session.topic}
                              onChange={(e) => updateTopic(session.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-grow bg-surface border border-primary/30 rounded-lg px-3 py-1.5 text-sm text-text-main outline-none focus:ring-2 focus:ring-primary/20"
                              autoFocus
                            />
                            <button 
                              onClick={(e) => toggleEdit(session.id, e)}
                              className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-bold transition-all",
                              session.completed ? "text-text-muted line-through" : "text-text-main"
                            )}>
                              {session.topic}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-text-muted flex items-center gap-1.5">
                          <Clock size={12} /> {session.duration}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={(e) => toggleComplete(session.id, e)}
                          className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                            session.completed 
                              ? "bg-secondary border-secondary text-primary" 
                              : "border-border text-text-muted hover:border-primary hover:text-primary"
                          )}
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => toggleEdit(session.id, e)}
                            className="p-2 hover:bg-primary/10 rounded-lg text-text-muted hover:text-primary transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => e.stopPropagation()} 
                            className="p-2 hover:bg-red-500/10 rounded-lg text-text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    <AnimatePresence>
                      {expandedSessionId === session.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-surface-alt/5 overflow-hidden"
                        >
                          <td colSpan={7} className="px-8 py-6 border-t border-border/50">
                            <div className="max-w-4xl space-y-6">
                              <div className="glass-card p-6 border-l-4 border-l-primary bg-primary/5">
                                <h4 className="text-sm font-bold text-primary mb-2 uppercase tracking-wide">Daily Summary</h4>
                                <p className="text-text-main leading-relaxed">{session.dailySummary}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-secondary mb-3 uppercase tracking-wide">Detailed Notes & Tasks</h4>
                                <div className="glass-card p-6 prose prose-sm max-w-none prose-p:text-text-muted prose-headings:text-text-main prose-strong:text-text-main prose-ul:text-text-muted prose-li:marker:text-primary">
                                  <ReactMarkdown>{session.detailedNotes || ''}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                ))}
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleSavePlan}
              className="w-full sm:w-auto btn-primary px-10 py-4 flex items-center justify-center gap-3"
            >
              <Save size={20} /> {t('save_study_plan')}
            </button>
            <button 
              onClick={() => setIsGenerated(false)} 
              className="w-full sm:w-auto btn-outline px-10 py-4 flex items-center justify-center gap-3"
            >
              <RotateCcw size={20} /> {t('start_over')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
