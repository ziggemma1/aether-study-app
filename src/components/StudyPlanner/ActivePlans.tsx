import React from 'react';
import { CheckCircle2, Trash2, ChevronRight, CalendarDays, Loader2, Award } from 'lucide-react';
import { ClientStudyPlan } from '../../hooks/useStudyPlans';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface ActivePlansProps {
  plans: ClientStudyPlan[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export default function ActivePlans({ plans, loading, onDelete }: ActivePlansProps) {
  const navigate = useNavigate();

  const handleCardClick = (plan: ClientStudyPlan) => {
    const id = plan._id || plan.id;
    if (id) {
      navigate(`/plans/${id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent, plan: ClientStudyPlan) => {
    e.stopPropagation();
    const id = plan._id || plan.id;
    if (id) {
      onDelete(id);
    }
  };

  return (
    <div className="bg-[#141A24] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 shadow-xl">
      <h3 className="text-sm font-extrabold text-[#F0F3F8] flex items-center gap-2 mb-4 pb-3 border-b border-gray-800/65">
        <CheckCircle2 className="w-5 h-5 text-[#00E5A0]" />
        My Custom Roadmaps
      </h3>

      {loading && plans.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#6C5CE7] animate-spin mb-2" />
          <p className="text-xs text-[#8E9AAF]">Synchronizing syllabus roadmap database...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-[#0B0E14] border border-gray-800 rounded-xl p-6 text-center text-xs text-[#8E9AAF] min-h-[140px] flex flex-col justify-center items-center">
          <Award className="w-8 h-8 text-gray-700 mb-2" />
          <p className="font-bold text-gray-400">No active study plans yet.</p>
          <p className="mt-1 text-[11px] text-gray-500">
            Select files above, customize your schedule requirements, and click Assemble!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const planId = plan.id || plan._id;
            const completedDays = plan.days ? plan.days.filter((d) => d.completed).length : 0;
            const totalDays = plan.days ? plan.days.length : 1;
            const progress = Math.round((completedDays / totalDays) * 100);

            let dateRangeStr = 'Configuring dates';
            try {
              if (plan.startDate) {
                const sDate = new Date(plan.startDate);
                const eDate = plan.endDate ? new Date(plan.endDate) : sDate;
                dateRangeStr = `${format(sDate, 'MMM dd')} – ${format(eDate, 'MMM dd, yyyy')}`;
              }
            } catch (err) {
              // fallback
            }

            return (
              <div
                key={planId}
                onClick={() => handleCardClick(plan)}
                className="bg-[#0B0E14] border border-gray-800/60 hover:border-gray-700 hover:bg-[#141A24]/30 rounded-xl p-4.5 cursor-pointer relative group transition-all duration-200 active:scale-99 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-grow">
                      <h4 className="text-xs font-extrabold text-[#F0F3F8] line-clamp-1 group-hover:text-[#6C5CE7] transition-colors">
                        {plan.title || 'Personal Study Roadmap'}
                      </h4>
                      <p className="text-[11px] text-[#8E9AAF] font-semibold mt-0.5">
                        {plan.goal} • {plan.complexity} Level
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, plan)}
                      className="p-1.5 rounded-lg bg-gray-800/10 hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all min-h-[32px]"
                      title="Archive Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                      <span className="text-gray-400">Syllabus Progress</span>
                      <span className="text-[#00E5A0]">{progress}%</span>
                    </div>
                    {/* Horizontal progress bar */}
                    <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden border border-gray-900">
                      <div
                        className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00E5A0] rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4.5 pt-3 border-t border-gray-850 text-[11px] text-gray-500 font-semibold uppercase font-mono">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-[#6C5CE7]" />
                    {dateRangeStr}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400 group-hover:text-[#6C5CE7] transition-colors">
                    <span>{plan.dailyCommitment}m/Day</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
