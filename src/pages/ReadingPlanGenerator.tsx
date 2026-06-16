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
import { cn } from '../lib/utils';
import { format, startOfToday } from 'date-fns';

// Import our cohesive modular components
import MaterialSelector from '../components/StudyPlanner/MaterialSelector';
import SettingsForm from '../components/StudyPlanner/SettingsForm';
import PlanSummary from '../components/StudyPlanner/PlanSummary';
import ActivePlans from '../components/StudyPlanner/ActivePlans';

export default function ReadingPlanGenerator() {
  const navigate = useNavigate();
  const { materials, showToast } = useAppContext();
  const { 
    studyPlans, 
    loading: loadingPlans, 
    generatePlan, 
    deletePlan 
  } = useStudyPlans();

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

  // Handle plan generation trigger
  const handleGeneratePlanSubmit = async () => {
    setIsGenerating(true);
    try {
      const parsedDuration = parseInt(duration as any, 10) || 7;
      const response = await generatePlan({
        materialIds: selectedMaterials,
        startDate,
        duration: parsedDuration,
        goal,
        complexity,
        dailyCommitment: commitment,
        preferredTime,
        focusAreas,
        calendarSync
      });

      if (response && (response.id || response._id)) {
        showToast('Roadmap generated dynamically!', 'success');
        navigate(`/plans/${response.id || response._id}`);
      } else {
        showToast('Generation failed. Ensure system is connected.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Study Plan generation failed.', 'error');
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
    <div className="relative min-h-screen bg-transparent text-[#F0F3F8] pb-24 font-sans px-4 sm:px-6 lg:px-8">
      {/* Centered Main Page Container */}
      <div className="max-w-7xl mx-auto pt-6">
        
        {/* Navigation & Header Banner */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 flex items-center justify-center bg-[#141A24] border border-gray-800 rounded-xl active:scale-95 transition-transform cursor-pointer hover:border-gray-700"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <span className="text-xs font-bold text-[#6C5CE7] tracking-wider uppercase font-mono bg-[#6C5CE7]/15 px-3 py-1 rounded-full border border-[#6C5CE7]/20">
            Aether pedagogical Engine
          </span>
          <div className="w-10 h-10 bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#6C5CE7]" />
          </div>
        </div>

        {/* Title Block */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F0F3F8] tracking-tight flex items-center gap-1.5">
            📅 AI Study Planner
          </h1>
          <p className="text-xs sm:text-sm text-[#8E9AAF] mt-1 pr-12 max-w-2xl">
            Auto-generate day-by-day customized learning roadmaps structured natively around your syllabus or uploaded materials.
          </p>
        </div>

        {/* 2-Column Responsive Layout (≥1024px grid, ≤768px single stacked column) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-6">
          
          {/* Column 1: Material Selection */}
          <div className="flex flex-col h-full">
            <MaterialSelector
              materials={materials}
              selectedMaterialIds={selectedMaterials}
              onChange={setSelectedMaterials}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          {/* Column 2: Configurations and Settings */}
          <div className="flex flex-col h-full">
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
        <div className="mt-8 border-t border-gray-800/80 pt-6">
          <ActivePlans
            plans={studyPlans}
            loading={loadingPlans}
            onDelete={handleDeletePlanAction}
          />
        </div>

      </div>

      {/* MODAL: SYLLABUS STRUCTURE PREVIEW */}
      <AnimatePresence>
        {isPreviewModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#141A24] border border-gray-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-900 hover:bg-gray-850 cursor-pointer text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4">
                <h3 className="text-base font-extrabold text-[#F0F3F8] flex items-center gap-1.5">
                  <Lightbulb className="w-5 h-5 text-[#00E5A0]" />
                  Roadmap Structure Preview
                </h3>
                <p className="text-[11px] text-[#8E9AAF] mt-0.5">
                  Here is an illustrative output structure compiled by our pedagogical prompt template.
                </p>
              </div>

              {/* Box illustrating JSON format / bullet points */}
              <div className="bg-[#0B0E14] border border-gray-950 p-4 rounded-xl space-y-3.5 max-h-[350px] overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold text-[#6C5CE7] uppercase font-mono">Day 1: Theoretical Axioms</h4>
                  <p className="text-[11px] text-gray-500 font-medium">Est. study review: {commitment} minutes</p>
                  <ul className="text-xs text-gray-300 mt-1.5 space-y-1 list-disc pl-4.5 font-medium leading-relaxed">
                    <li>Analyze chapters introducing set operators and Cartesian spaces.</li>
                    <li>Conduct interactive 5-minute quiz testing nomenclature comprehension.</li>
                  </ul>
                </div>

                <div className="border-t border-gray-900 pt-3">
                  <h4 className="text-xs font-bold text-[#6C5CE7] uppercase font-mono">Day 2: Union & Relations mapping</h4>
                  <p className="text-[11px] text-gray-500 font-medium font-semibold">Est. study review: {commitment} minutes</p>
                  <ul className="text-xs text-gray-300 mt-1.5 space-y-1 list-disc pl-4.5 font-medium leading-relaxed">
                    <li>Run custom practice questions on material subset partitions.</li>
                    <li>Read flashcards reviewing subset exclusions.</li>
                  </ul>
                </div>

                <div className="border-t border-gray-900 pt-3">
                  <h4 className="text-xs font-bold text-[#6C5CE7] uppercase font-mono">Day 3: Practice Problem Matrices</h4>
                  <p className="text-[11px] text-gray-500 font-medium font-semibold">Est. study review: {commitment} minutes</p>
                  <ul className="text-xs text-gray-300 mt-1.5 space-y-1 list-disc pl-4.5 font-medium leading-relaxed">
                    <li>Complete complex active-recall inquiries centered on target chapters.</li>
                    <li>Listen to synthesized study voice summaries.</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="w-full bg-[#6C5CE7] text-white text-xs font-extrabold py-3.5 rounded-xl mt-5 shadow-lg active:scale-98 cursor-pointer min-h-[44px]"
              >
                Close Preview
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
