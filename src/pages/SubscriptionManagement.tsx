import React from 'react';
import { Check, Info, Sparkles, Layers, CheckCircle2, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn, formatTime } from '../lib/utils';
import { PageHeader } from '../components/ui/PageHeader';
import { useStudyTotals } from '../hooks/useStudyTotals';

/**
 * Plans.
 *
 * Billing is not implemented — there is no subscription endpoint, no payment
 * provider, and no code anywhere enforces a plan limit. The previous version of
 * this page did not say so. It showed:
 *   - three invoices ("Mar 25, 2024 · $9.99 · PAID") on an account that has
 *     never paid anything;
 *   - "Your next billing date is April 25, 2024" under a FREE plan;
 *   - "Materials 3 / 5" and "AI Quizzes 8 / 10", both hardcoded, on an account
 *     holding 43 materials;
 *   - "Manage Billing" and "Upgrade to Pro" buttons with no onClick.
 *
 * Fabricated payment records are the worst thing a page can show, so they are
 * gone rather than restyled. What is left is a real usage summary and an honest
 * preview of the plans, with Pro marked unavailable until billing actually
 * exists.
 */

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    tagline: 'Everything the app does today.',
    features: [
      'Unlimited materials',
      'AI summaries and notes',
      'Quizzes and flashcards',
      'Study planner',
      'Live rooms and leaderboard'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9.99',
    tagline: 'Planned. Not available yet.',
    features: [
      'Everything in Free',
      'Higher AI generation limits',
      'Longer study plans',
      'Priority support'
    ]
  }
];

export default function SubscriptionManagement() {
  const { user } = useAppContext();
  const plan = user?.plan || 'free';
  // Shared so this page and the Profile cannot report different totals.
  const totals = useStudyTotals();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full min-w-0 pb-24">
      <PageHeader
        title="Plans"
        subtitle="What Aether costs, and what you're using."
      />

      {/* Says the thing the old page went out of its way to imply the opposite
          of. Placed first so nobody reads the prices as live. */}
      <div className="flex items-start gap-3 p-4 rounded-[var(--radius-card)] bg-pastel-sky border border-border mb-6">
        <span className="shrink-0 mt-0.5 text-pastel-sky-ink"><Info size={18} /></span>
        <div>
          <p className="text-sm font-semibold text-pastel-sky-ink">Billing isn't switched on yet</p>
          <p className="text-sm text-pastel-sky-ink/85 mt-0.5 leading-relaxed">
            Every feature in Aether is free for everyone right now, with no caps.
            The plans below are a preview of what's planned — nothing here can
            charge you, and there is nothing to cancel.
          </p>
        </div>
      </div>

      {/* ---- Usage: real counts, no invented ceilings ---- */}
      <section className="rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-5 sm:p-6 mb-6">
        <h2 className="font-heading text-base font-bold text-text-main tracking-tight mb-1">
          Your usage
        </h2>
        <p className="text-xs text-text-muted mb-5">
          Everything you've used so far. Nothing is limited.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Usage icon={<Layers size={15} />} tone="mint" value={String(totals.materials)} label="Materials" />
          <Usage icon={<CheckCircle2 size={15} />} tone="sky" value={String(totals.quizzes)} label="Quizzes taken" />
          <Usage icon={<Clock size={15} />} tone="peach" value={formatTime(totals.minutes)} label="Time studied" />
          <Usage icon={<Sparkles size={15} />} tone="lavender" value={String(totals.sessions)} label="Sessions" />
        </div>
      </section>

      {/* ---- Plans ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PLANS.map((p) => {
          const isCurrent = p.id === plan;
          const isAvailable = p.id === 'free';
          return (
            <section
              key={p.id}
              className={cn(
                'rounded-[var(--radius-card)] bg-surface border shadow-[var(--shadow-card)] p-6 flex flex-col',
                isCurrent ? 'border-primary/40' : 'border-border'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-lg font-bold text-text-main tracking-tight">{p.name}</h3>
                  <p className="text-xs text-text-muted mt-0.5">{p.tagline}</p>
                </div>
                {isCurrent && (
                  <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                    Your plan
                  </span>
                )}
              </div>

              <p className="mt-4 mb-5">
                <span className="text-3xl font-bold text-text-main tracking-tight">${p.price}</span>
                <span className="text-sm text-text-muted ml-1">/month</span>
              </p>

              <ul className="space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-text-main">
                    <Check
                      size={16}
                      className={cn('shrink-0 mt-0.5', isAvailable ? 'text-accent' : 'text-text-muted')}
                    />
                    <span className={isAvailable ? undefined : 'text-text-muted'}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* No dead controls: the old "Upgrade to Pro" and "Manage Billing"
                  buttons looked live and did nothing at all when pressed. */}
              <div className="mt-6">
                {isCurrent ? (
                  <span className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-semibold min-h-[44px]">
                    <Check size={15} /> Active
                  </span>
                ) : (
                  <span
                    className="w-full inline-flex items-center justify-center py-2.5 rounded-xl bg-surface-alt border border-border text-text-muted text-sm font-semibold min-h-[44px] cursor-default"
                    title="Billing is not available yet"
                  >
                    Coming soon
                  </span>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-text-muted text-center mt-8 max-w-md mx-auto leading-relaxed">
        No payment details are stored and no invoices exist. When billing is
        switched on, this page will show your real plan and receipts.
      </p>
    </div>
  );
}

const TONES: Record<string, string> = {
  mint: 'bg-pastel-mint text-pastel-mint-ink',
  sky: 'bg-pastel-sky text-pastel-sky-ink',
  peach: 'bg-pastel-peach text-pastel-peach-ink',
  lavender: 'bg-pastel-lavender text-pastel-lavender-ink'
};

function Usage({ icon, tone, value, label }: { icon: React.ReactNode; tone: string; value: string; label: string }) {
  return (
    <div>
      <span className={cn('inline-flex w-8 h-8 rounded-lg items-center justify-center mb-2', TONES[tone])}>
        {icon}
      </span>
      <p className="text-xl font-bold text-text-main tabular-nums leading-none">{value}</p>
      <p className="text-[11px] text-text-muted mt-1">{label}</p>
    </div>
  );
}
