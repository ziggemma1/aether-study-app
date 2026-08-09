import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Eye, 
  X, 
  ChevronRight, 
  BookOpen, 
  Sliders, 
  Clock, 
  Lightbulb 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useStudyPlans } from '../hooks/useStudyPlans';
import api from '../services/api';
import { cn } from '../lib/utils';
import { format, startOfToday } from 'date-fns';

// Import our cohesive modular components
import MaterialSelector from '../components/StudyPlanner/MaterialSelector';
import SettingsForm from '../components/StudyPlanner/SettingsForm';
import PlanSummary from '../components/StudyPlanner/PlanSummary';
import ActivePlans from '../components/StudyPlanner/ActivePlans';

export default function ReadingPlanGenerator() {
  const navigate = useNavigate();
  const { materials, showToast, dbError } = useAppContext();
  const {
    studyPlans,
    loading: loadingPlans,
    error: plansError,
    generatePlan,
    deletePlan
  } = useStudyPlans();

  // Materials are loaded by AppContext, which swallows per-endpoint failures,
  // so dbError is the signal available here. Only treated as an error when the
  // list is genuinely empty — a stale cached list is better than an error box.
  const materialsError = materials.length === 0 ? dbError : null;

  // Material Selector States
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Configuration States
  const [startDate, setStartDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [duration, setDuration] = useState(7);
  const [goal, setGoal] = useState('Exam Prep');
  const [complexity, setComplexity] = useState('Intermediate');
  const [commitment, setCommitment] = useState(60); // default to 60m
  const [preferredTime, setPreferredTime] = useState('Afternoon');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [calendarSync, setCalendarSync] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Sample days for the "See an example" modal, built from the settings on
  // screen and the user's own first selected material, so the preview reflects
  // what they are about to generate.
  const previewDays = React.useMemo(() => {
    const first = materials.find((m) => selectedMaterials.includes(m.id));
    const subject = first?.title || 'your material';
    return [
      { day: 1, topic: `Get oriented in ${subject}`, activities: ['Skim the whole thing to see its shape', 'Read the opening section closely and note key terms'] },
      { day: 2, topic: 'Work the core ideas', activities: ['Re-read the parts you flagged yesterday', 'Write the main ideas from memory, then check'] },
      { day: 3, topic: 'Test yourself', activities: ['Take a quiz on what you have covered', 'Revisit anything you got wrong'] },
    ].slice(0, Math.max(1, Math.min(3, duration)));
  }, [materials, selectedMaterials, duration]);

  /**
   * Push the generated schedule into Google Calendar.
   *
   * The `calendarSync` switch used to be a dead control: the flag was sent,
   * stored on the document, and then read by nothing at all — no calendar
   * entry was ever created. The /calendar/google/sync endpoint already existed,
   * so this now actually calls it, and reports honestly when the account has
   * no Google Calendar connected instead of silently doing nothing.
   */
  const syncPlanToCalendar = async (plan: any) => {
    const sessions = (plan.days || []).map((d: any) => {
      const startTime = new Date(d.date);
      const endTime = new Date(startTime.getTime() + (d.estimatedTime || 60) * 60000);
      return {
        title: `Study: ${d.topic}`,
        description: (d.activities || []).join('\n'),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
    });
    if (sessions.length === 0) return;

    try {
      const { data } = await api.post('/calendar/google/sync', { sessions });
      showToast(`Added ${data?.syncedCount ?? sessions.length} sessions to your calendar.`, 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      showToast(
        msg === 'Google Calendar not connected'
          ? 'Plan saved. Connect Google Calendar in Settings to sync it.'
          : 'Plan saved, but syncing to your calendar failed.',
        'error'
      );
    }
  };

  // Handle plan generation trigger
  const handleGeneratePlanSubmit = async () => {
    setIsGenerating(true);
    try {
      const plan = await generatePlan({
        materialIds: selectedMaterials,
        startDate,
        duration,
        goal,
        complexity,
        dailyCommitment: commitment,
        preferredTime,
        focusAreas,
        calendarSync
      });

      const planId = plan.id || plan._id;

      // Says what actually happened. "Roadmap generated dynamically!" told the
      // user nothing, and claimed an AI plan even when both providers were down
      // and the schedule came from the deterministic template.
      showToast(
        plan.aiGenerated === false
          ? `Plan built from a standard ${duration}-day template — AI was unavailable.`
          : `Your ${duration}-day plan is ready.`,
        plan.aiGenerated === false ? 'error' : 'success'
      );

      if (calendarSync) {
        await syncPlanToCalendar(plan);
      }

      if (planId) navigate(`/plans/${planId}`);
    } catch (err: any) {
      console.error(err);
      showToast(
        err?.response?.data?.message || 'We could not build your plan. Please try again.',
        'error'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePlanAction = async (id: string) => {
    if (confirm('Are you sure you want to delete this study plan?')) {
      const ok = await deletePlan(id);
      if (ok) {
        showToast('Plan deleted successfully.', 'success');
      }
    }
  };

  return (
    <div className="relative min-h-full bg-transparent text-text-main pb-24 font-sans px-4 sm:px-6 lg:px-8">
      {/* Centered Main Page Container */}
      <div className="max-w-7xl mx-auto pt-6">
        
        {/* Header. Was a back arrow, an "AETHER PEDAGOGICAL ENGINE" badge and a
            purely decorative sparkle box — two of the three said nothing. The
            emoji in the H1 is gone too; the app has a real icon set. */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-main transition-colors cursor-pointer mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>

          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-main tracking-tight">
            Study Planner
          </h1>
          <p className="text-sm text-text-muted mt-1.5 max-w-2xl leading-relaxed">
            Pick what you need to cover and how long you have. You'll get a
            day-by-day schedule you can tick off as you go.
          </p>
        </div>

        {/* Two columns from lg. `items-start` rather than `items-stretch`: the
            two cards hold unrelated content of genuinely different length, and
            stretching the shorter one just produced a tall empty box beside a
            full one. Each now ends where its content ends. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-6">

          {/* Column 1: Material Selection */}
          <div className="flex flex-col">
            <MaterialSelector
              materials={materials}
              selectedMaterialIds={selectedMaterials}
              onChange={setSelectedMaterials}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loadError={materialsError}
            />
          </div>

          {/* Column 2: Configurations and Settings */}
          <div className="flex flex-col">
            <SettingsForm
              startDate={startDate}
              setStartDate={setStartDate}
              duration={duration}
              setDuration={setDuration}
              goal={goal}
              setGoal={setGoal}
              complexity={complexity}
              setComplexity={setComplexity}
              commitment={commitment}
              setCommitment={setCommitment}
              preferredTime={preferredTime}
              setPreferredTime={setPreferredTime}
              focusAreas={focusAreas}
              setFocusAreas={setFocusAreas}
              calendarSync={calendarSync}
              setCalendarSync={setCalendarSync}
            />
          </div>

        </div>

        {/* Summary Card (Full Width) */}
        <div className="mb-6">
          <PlanSummary
            duration={duration}
            commitment={commitment}
            selectedMaterialsCount={selectedMaterials.length}
            goal={goal}
            complexity={complexity}
            isGenerating={isGenerating}
            onGenerate={handleGeneratePlanSubmit}
            onPreviewExample={() => setIsPreviewModalOpen(true)}
          />
        </div>

        {/* Active Plans List (Full Width) */}
        <div className="mt-8 border-t border-border/80 pt-6">
          <ActivePlans
            plans={studyPlans}
            loading={loadingPlans}
            loadError={plansError}
            onDelete={handleDeletePlanAction}
          />
        </div>

      </div>

      {/* Example-plan modal. The sample used to be three fixed days of set
          theory ("Theoretical Axioms", "Cartesian spaces") regardless of what
          the user had selected, which made the preview useless for anyone not
          studying maths. It now previews the settings actually chosen, and
          names the user's own first material when one is selected. */}
      <AnimatePresence>
        {isPreviewModalOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsPreviewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Example plan"
              className="w-full max-w-lg bg-surface border border-border rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card-hover)] relative"
            >
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                aria-label="Close example"
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-alt cursor-pointer text-text-muted hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <h3 className="font-heading text-base font-bold text-text-main flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  What you'll get
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  An example of the shape of your plan — {duration} day{duration === 1 ? '' : 's'},
                  about {commitment} minutes each.
                </p>
              </div>

              <div className="bg-background border border-border p-4 rounded-xl space-y-3.5 max-h-[350px] overflow-y-auto">
                {previewDays.map((d, i) => (
                  <div key={d.day} className={i > 0 ? 'border-t border-border pt-3' : undefined}>
                    <h4 className="text-xs font-semibold text-text-main">
                      Day {d.day} · {d.topic}
                    </h4>
                    <p className="text-[11px] text-text-muted mt-0.5">About {commitment} minutes</p>
                    <ul className="text-xs text-text-muted mt-1.5 space-y-1 list-disc pl-4.5 leading-relaxed">
                      {d.activities.map((a) => <li key={a}>{a}</li>)}
                    </ul>
                  </div>
                ))}
                {duration > previewDays.length && (
                  <p className="text-[11px] text-text-muted italic pt-1">
                    …and {duration - previewDays.length} more day{duration - previewDays.length === 1 ? '' : 's'}.
                  </p>
                )}
              </div>

              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-full bg-primary text-white text-sm font-semibold py-3.5 rounded-xl mt-5 hover:bg-primary/90 transition-colors cursor-pointer min-h-[44px]"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
