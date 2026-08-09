import React from 'react';
import { CheckCircle2, Trash2, ChevronRight, CalendarDays, Loader2, Award, AlertCircle } from 'lucide-react';
import { ClientStudyPlan } from '../../hooks/useStudyPlans';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface ActivePlansProps {
  plans: ClientStudyPlan[];
  loading: boolean;
  onDelete: (id: string) => void;
  /** Set when the request failed, so a fetch error stops masquerading as
   *  "you have no plans yet". */
  loadError?: string | null;
}

export default function ActivePlans({ plans, loading, onDelete, loadError }: ActivePlansProps) {
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
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-extrabold text-text-main flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <CheckCircle2 className="w-5 h-5 text-accent" />
        Your plans
      </h3>

      {loading && plans.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <p className="text-xs text-text-muted">Loading your plans…</p>
        </div>
      ) : loadError && plans.length === 0 ? (
        <div className="bg-background border border-border rounded-xl p-6 text-center min-h-[140px] flex flex-col justify-center items-center">
          <AlertCircle className="w-8 h-8 text-brand-pink mb-2" />
          <p className="text-sm font-semibold text-text-main">We couldn't load your plans</p>
          <p className="mt-1 text-xs text-text-muted max-w-sm">{loadError}</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-background border border-border rounded-xl p-6 text-center min-h-[140px] flex flex-col justify-center items-center">
          <Award className="w-8 h-8 text-text-muted mb-2" />
          <p className="text-sm font-semibold text-text-main">No plans yet</p>
          <p className="mt-1 text-xs text-text-muted max-w-sm">
            Choose your materials above, set how long you have, and create your first plan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const planId = plan.id || plan._id;
            const completedDays = plan.days ? plan.days.filter((d) => d.completed).length : 0;
            const totalDays = plan.days ? plan.days.length : 1;
            const progress = Math.round((completedDays / totalDays) * 100);

            let dateRangeStr = 'Dates unavailable';
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
                className="bg-background border border-border hover:border-border hover:bg-surface/30 rounded-xl p-4.5 cursor-pointer relative group transition-all duration-200 active:scale-[0.99] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-grow">
                      <h4 className="text-xs font-extrabold text-text-main line-clamp-1 group-hover:text-primary transition-colors">
                        {plan.title || 'Personal Study Roadmap'}
                      </h4>
                      <p className="text-[11px] text-text-muted font-semibold mt-0.5">
                        {plan.goal} • {plan.complexity} Level
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, plan)}
                      className="p-1.5 rounded-lg bg-surface/10 hover:bg-brand-pink/10 text-text-muted hover:text-brand-pink border border-transparent hover:border-brand-pink/20 transition-all min-h-[32px]"
                      title="Delete plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                      <span className="text-text-muted">Progress</span>
                      <span className="text-accent">{progress}%</span>
                    </div>
                    {/* Horizontal progress bar */}
                    <div className="w-full h-1.5 bg-[var(--ring-track)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4.5 pt-3 border-t border-border text-[11px] text-text-muted font-semibold uppercase font-mono">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" />
                    {dateRangeStr}
                  </span>
                  <div className="flex items-center gap-1 text-text-muted group-hover:text-primary transition-colors">
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
