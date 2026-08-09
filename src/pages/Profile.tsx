import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, Calendar, Flame, MapPin, Pencil, Sparkles, Users, Clock,
  Target, Layers, ChevronRight, Trophy
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn, formatTime, pastelForCategory, pastelStyle } from '../lib/utils';
import { iconMap } from '../components/AchievementBadge';
import { FocusHeatmap } from '../components/profile/FocusHeatmap';
import { useStudyTotals } from '../hooks/useStudyTotals';

export default function Profile() {
  const { user, t, materials, studySessions, quizResults } = useAppContext();
  const navigate = useNavigate();
  // Same source as the Plans page — the two used to disagree.
  const totals = useStudyTotals();

  /**
   * Only badges that are actually unlocked, newest first.
   *
   * The old list rendered `user.achievements` wholesale under the heading
   * "Recent Achievements" — but that array holds all 25 badges with an
   * `isUnlocked` flag, and the page ignored the flag. So it credited the user
   * with "Month Master — Study 30 days in a row" and "Year Legend" on an
   * account whose streak was 0. When the array happened to be empty it went
   * further and invented badges outright ("First Upload", dated "Recently").
   */
  const unlocked = React.useMemo(() => {
    return (user?.achievements || [])
      .filter((a: any) => a.isUnlocked)
      .sort((a: any, b: any) => new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime());
  }, [user]);

  const totalBadges = (user?.achievements || []).length;

  /** Average progress per material type. Real numbers, honestly labelled. */
  const typeProgress = React.useMemo(() => {
    const byType: Record<string, { total: number; count: number }> = {};
    materials.forEach((m) => {
      const label = (m.type || 'other').charAt(0).toUpperCase() + (m.type || 'other').slice(1);
      if (!byType[label]) byType[label] = { total: 0, count: 0 };
      byType[label].total += m.progress || 0;
      byType[label].count += 1;
    });
    return Object.entries(byType)
      .map(([label, s]) => ({ label, progress: Math.round(s.total / s.count), count: s.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [materials]);

  /**
   * Quiz accuracy, computed from the results themselves.
   *
   * `user.avgQuizScore` used to be written as the raw number of correct answers
   * rather than a percentage (fixed in quizController), so accounts that last
   * took a quiz before that fix still hold a stale raw value — "2%" for someone
   * averaging 2 of 3. Deriving it here means the page is right immediately, and
   * it uses the same formula Reports does. The stored field is the fallback.
   */
  const quizAccuracy = React.useMemo(() => {
    const scored = (quizResults || []).filter((q) => q.totalQuestions > 0);
    if (scored.length === 0) {
      return { avg: user?.avgQuizScore ?? null, best: user?.highestQuizScore ?? null, count: 0 };
    }
    const pcts = scored.map((q) => (q.score / q.totalQuestions) * 100);
    return {
      avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
      best: Math.round(Math.max(...pcts)),
      count: scored.length
    };
  }, [quizResults, user]);

  const joined = user?.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full min-w-0 pb-24 space-y-6">
      {/* ---------------- Header ---------------- */}
      <section className="rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
          <div className="shrink-0 mx-auto sm:mx-0">
            {/* The green check badge that used to sit on this avatar implied a
                verification the app does not have and never checked anything. */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-pastel-lavender text-pastel-lavender-ink border border-border overflow-hidden flex items-center justify-center text-3xl font-bold">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : (user?.name?.charAt(0)?.toUpperCase() || '?')}
            </div>
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-main tracking-tight truncate">
                  {user?.name}
                </h1>
                <p className="text-sm text-text-muted mt-0.5">
                  @{user?.handle || user?.name?.toLowerCase()?.replace(/\s+/g, '_')}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-xs text-text-muted">
                  {user?.location && (
                    <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {user.location}</span>
                  )}
                  {joined && !isNaN(joined.getTime()) && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} />
                      Joined {joined.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* This route always renders the SIGNED-IN user, so the actions
                  here used to be wrong outright: "Add Friend" sent a request to
                  yourself, and the message button had no onClick at all. */}
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  onClick={() => navigate('/settings')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors cursor-pointer min-h-[44px]"
                >
                  <Pencil size={15} /> Edit profile
                </button>
                <button
                  onClick={() => navigate('/community')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-alt border border-border text-text-main hover:border-primary/30 text-sm font-semibold transition-colors cursor-pointer min-h-[44px]"
                >
                  <Users size={15} /> Find friends
                </button>
              </div>
            </div>

            {/* The stats a study app should lead with. Followers and points were
                the only three numbers here before — social counts on a page
                that never showed how much the person had studied. */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border">
              <Stat icon={<Flame size={14} />} tone="peach" label="Day streak" value={`${user?.streak || 0}`} />
              <Stat icon={<Clock size={14} />} tone="sky" label="Studied" value={formatTime(totals.minutes)} />
              <Stat icon={<Layers size={14} />} tone="mint" label="Materials" value={`${materials.length}`} />
              <Stat icon={<Trophy size={14} />} tone="lavender" label="Points" value={(user?.aetherPoints || 0).toLocaleString()} />
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-5 mt-4 text-sm">
              <Link to="/community" className="text-text-muted hover:text-primary transition-colors">
                <span className="font-bold text-text-main">{user?.followersCount || 0}</span> {t('followers')}
              </Link>
              <Link to="/community" className="text-text-muted hover:text-primary transition-colors">
                <span className="font-bold text-text-main">{user?.friendsCount || 0}</span> {t('friends')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ---------------- Left ---------------- */}
        <div className="lg:col-span-4 space-y-6">
          <Card title={t('about_me')}>
            <p className="text-sm text-text-muted leading-relaxed">
              {user?.bio || "No bio yet — add one in Settings so people know what you're studying."}
            </p>
            {/* Only tags that come from the account. The old row appended
                "#Learning", "#Student" and "#PowerUser"/"#Newcomer" — three
                decorative labels the user never chose and cannot change. */}
            {(user?.curriculum || user?.country) && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {[user?.curriculum, user?.country].filter(Boolean).map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-surface-alt border border-border rounded-lg text-[11px] font-medium text-text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {!user?.bio && (
              <Link to="/settings" className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary hover:underline">
                Add a bio <ChevronRight size={13} />
              </Link>
            )}
          </Card>

          <Card title="Study record">
            <dl className="space-y-3">
              <Row label="Longest streak" value={`${user?.longestStreak || 0} ${user?.longestStreak === 1 ? 'day' : 'days'}`} />
              <Row
                label="Average quiz score"
                value={quizAccuracy.avg !== null && quizAccuracy.avg !== undefined ? `${quizAccuracy.avg}%` : 'No quizzes yet'}
              />
              <Row
                label="Best quiz score"
                value={quizAccuracy.best !== null && quizAccuracy.best !== undefined ? `${quizAccuracy.best}%` : '—'}
              />
              <Row label="Quizzes taken" value={`${quizAccuracy.count || quizResults?.length || 0}`} />
              <Row label="Sessions logged" value={`${totals.sessions}`} />
            </dl>
          </Card>
        </div>

        {/* ---------------- Right ---------------- */}
        <div className="lg:col-span-8 space-y-6">
          <Card
            title="Focus contributions"
            icon={<Calendar size={16} className="text-pastel-sky-ink" />}
          >
            <FocusHeatmap sessions={studySessions || []} />
          </Card>

          <Card
            title="Badges"
            icon={<Sparkles size={16} className="text-pastel-peach-ink" />}
            action={
              <Link to="/achievements" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
                See all <ChevronRight size={13} />
              </Link>
            }
          >
            {unlocked.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-alt/40 py-8 px-6 text-center">
                <span className="inline-flex w-11 h-11 rounded-xl bg-pastel-peach text-pastel-peach-ink items-center justify-center">
                  <Award size={20} />
                </span>
                <p className="text-sm font-semibold text-text-main mt-3">No badges yet</p>
                <p className="text-xs text-text-muted mt-1">
                  {totalBadges > 0
                    ? `There are ${totalBadges} to earn. Finish a study session to start.`
                    : 'Finish a study session to earn your first one.'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-text-muted mb-3">
                  {unlocked.length} of {totalBadges} earned
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {unlocked.slice(0, 6).map((a: any) => {
                    // The icon is stored as a NAME. The old card checked
                    // `typeof icon === 'string'` and rendered the string, so
                    // badges literally displayed the words "Calendar", "Zap"
                    // and "Trophy" instead of their icons.
                    const Icon = iconMap[a.icon] || Award;
                    const tone = pastelForCategory(a.category);
                    const at = a.unlockedAt ? new Date(a.unlockedAt) : null;
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-surface-alt/60 border border-border"
                      >
                        <span
                          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
                          style={pastelStyle(tone)}
                        >
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-text-main truncate">{a.title}</h4>
                          <p className="text-xs text-text-muted leading-snug">{a.description}</p>
                          {/* Was printing the raw ISO string, e.g.
                              "2026-08-05T17:25:04.039Z". */}
                          {at && !isNaN(at.getTime()) && (
                            <p className="text-[11px] text-text-muted mt-1">
                              {at.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          <Card
            title="Progress by material type"
            icon={<Target size={16} className="text-pastel-mint-ink" />}
          >
            {typeProgress.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface-alt/40 py-8 px-6 text-center">
                <p className="text-sm font-semibold text-text-main">Nothing uploaded yet</p>
                <p className="text-xs text-text-muted mt-1">Add a material and its progress will show here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {typeProgress.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-baseline text-sm mb-1.5">
                      <span className="font-medium text-text-main">
                        {item.label}
                        <span className="text-text-muted font-normal ml-1.5 text-xs">
                          {item.count} {item.count === 1 ? 'item' : 'items'}
                        </span>
                      </span>
                      <span className="text-text-muted tabular-nums text-xs">{item.progress}%</span>
                    </div>
                    <div className="h-2 bg-[var(--ring-track)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const TONES: Record<string, string> = {
  peach: 'bg-pastel-peach text-pastel-peach-ink',
  sky: 'bg-pastel-sky text-pastel-sky-ink',
  mint: 'bg-pastel-mint text-pastel-mint-ink',
  lavender: 'bg-pastel-lavender text-pastel-lavender-ink'
};

function Stat({ icon, tone, label, value }: { icon: React.ReactNode; tone: keyof typeof TONES | string; label: string; value: string }) {
  return (
    <div className="text-center sm:text-left">
      <span className={cn('inline-flex w-7 h-7 rounded-lg items-center justify-center mb-1.5', TONES[tone])}>
        {icon}
      </span>
      <p className="text-lg font-bold text-text-main tabular-nums leading-none">{value}</p>
      <p className="text-[11px] text-text-muted mt-1">{label}</p>
    </div>
  );
}

function Card({ title, icon, action, children }: {
  title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-base font-bold text-text-main tracking-tight flex items-center gap-2">
          {icon} {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-semibold text-text-main tabular-nums">{value}</dd>
    </div>
  );
}
