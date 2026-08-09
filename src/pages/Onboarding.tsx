import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Check, Loader2, BookOpen, Upload, Sparkles,
  Radio, Trophy, Clock, CalendarClock, Play
} from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import {
  subjectsForCountry, findSubject, buildStarterMaterial, SubjectOption
} from '../lib/onboardingSamples';

/**
 * First-run onboarding.
 *
 * Signup used to drop straight onto an empty dashboard — no material, no
 * session, every counter at zero. This runs once per account (gated on
 * `user.onboardingCompletedAt`) and exists to make sure the first dashboard a
 * user sees has real content on it.
 *
 * Nothing here fabricates data. The starter pack is real curriculum text that
 * already ships in src/data/curriculum.json, and the streak of 1 is earned the
 * ordinary way — POST /sessions calls touchStreak() like it does for any other
 * session.
 */

const DURATIONS = [10, 15, 25];

type StepId = 'subject' | 'material' | 'session' | 'social';
const STEPS: StepId[] = ['subject', 'material', 'session', 'social'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshUser, fetchAppData, setMaterials, showToast } = useAppContext();

  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');

  // Step 2
  const [createdMaterial, setCreatedMaterial] = useState<{ id: string; title: string } | null>(null);

  // Step 3
  const [duration, setDuration] = useState(15);
  const [scheduledFor, setScheduledFor] = useState('');
  const [sessionDone, setSessionDone] = useState<'started' | 'scheduled' | null>(null);

  const step = STEPS[stepIndex];
  const options = useMemo(() => subjectsForCountry(user?.country), [user?.country]);
  const chosenOption: SubjectOption | null = useMemo(
    () => (subject ? findSubject(subject) : null),
    [subject]
  );
  const effectiveSubject = subject || customSubject.trim();

  const goNext = () => setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex(i => Math.max(i - 1, 0));

  /** Marks onboarding done server-side, then leaves. Used by finish and skip. */
  const leave = async (to: string) => {
    setBusy(true);
    setError('');
    try {
      await api.post('/users/onboarding/complete');
      // refreshUser is one call and carries the completion date plus the new
      // streak, so it is worth waiting for — the route gate reads it.
      await refreshUser();
      navigate(to, { replace: true });
      // fetchAppData fans out across every collection and took long enough to
      // stall the button. Kick it off unawaited so the session and material we
      // just created land in context a beat after the dashboard paints,
      // instead of the user staring at a spinner.
      void fetchAppData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not save your progress. Please try again.');
      setBusy(false);
    }
  };

  const saveSubject = async () => {
    if (!effectiveSubject) return;
    setBusy(true);
    setError('');
    try {
      // `curriculum` is the existing field for "what the user studies" — the
      // profile page and curriculum library both already read it.
      await api.put('/users/profile', { curriculum: effectiveSubject });
      goNext();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not save your subject.');
    } finally {
      setBusy(false);
    }
  };

  const createStarterPack = async () => {
    if (!chosenOption) return;
    setBusy(true);
    setError('');
    try {
      const payload = buildStarterMaterial(chosenOption);
      const res = await api.post('/materials', payload);
      const created = res.data;
      const id = created.id || created._id;
      setCreatedMaterial({ id, title: created.title });
      // Keep the library in sync so the dashboard does not need a full refetch.
      setMaterials(prev => [{ ...created, id }, ...prev]);
      goNext();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not add the starter pack.');
    } finally {
      setBusy(false);
    }
  };

  const createSession = async (mode: 'now' | 'later') => {
    setBusy(true);
    setError('');
    try {
      const startTime = mode === 'now' ? new Date().toISOString() : new Date(scheduledFor).toISOString();
      await api.post('/sessions', {
        title: createdMaterial ? `Study: ${createdMaterial.title}` : `Study: ${effectiveSubject}`,
        startTime,
        durationMinutes: duration,
        type: 'study',
        priority: 'medium',
        completed: false
      });
      setSessionDone(mode === 'now' ? 'started' : 'scheduled');
      goNext();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not create your session.');
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    await leave('/dashboard');
    showToast("You're all set. Welcome to Aether.", 'success');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ---- Header: progress + skip ---- */}
      <header className="w-full border-b border-border bg-surface">
        <div className="max-w-3xl mx-auto w-full px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-heading font-bold text-text-main tracking-tight">Getting started</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= stepIndex ? 'w-6 bg-primary' : 'w-3 bg-border'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => leave('/dashboard')}
              disabled={busy}
              className="text-xs font-semibold text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        </div>
      </header>

      {/* ---- Body ---- */}
      <main className="flex-grow w-full max-w-3xl mx-auto px-5 py-8 sm:py-12">
        {error && (
          <div className="mb-6 p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-2xl text-brand-pink text-sm font-medium">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {/* ------------------------------ STEP 1 ------------------------------ */}
            {step === 'subject' && (
              <section>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Step 1 of 4</p>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight mb-2">
                  What are you studying{user?.name ? `, ${user.name.split(' ')[0]}` : ''}?
                </h1>
                <p className="text-sm text-text-muted mb-6">
                  This shapes the material we suggest and the quizzes Aether writes for you. You can change it any time in Settings.
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {options.map(opt => {
                    const active = subject === opt.subject;
                    return (
                      <button
                        key={`${opt.country}-${opt.exam}-${opt.subject}`}
                        onClick={() => { setSubject(opt.subject); setCustomSubject(''); }}
                        className={`px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
                          active
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-text-main border-border hover:border-primary/30'
                        }`}
                      >
                        {opt.subject}
                        <span className={`ml-2 text-xs font-medium ${active ? 'text-white/70' : 'text-text-muted'}`}>
                          {opt.exam}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <label className="block text-sm font-bold text-text-muted mb-2">
                  Or tell us in your own words
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => { setCustomSubject(e.target.value); setSubject(''); }}
                  placeholder="e.g. A-Level Chemistry"
                  className="w-full px-4 py-3 bg-surface-alt border border-border rounded-2xl text-text-main placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />

                <div className="flex justify-end mt-8">
                  <button onClick={saveSubject} disabled={!effectiveSubject || busy} className="btn-primary inline-flex items-center gap-2">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            )}

            {/* ------------------------------ STEP 2 ------------------------------ */}
            {step === 'material' && (
              <section>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Step 2 of 4</p>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight mb-2">
                  Add your first material
                </h1>
                <p className="text-sm text-text-muted mb-6">
                  Aether turns whatever you give it into summaries, flashcards and quizzes. Start with your own notes, or take a ready-made pack.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {chosenOption && chosenOption.chapters.length > 0 && (
                    <button
                      onClick={createStarterPack}
                      disabled={busy}
                      className="soft-card-interactive p-5 text-left flex flex-col gap-3 disabled:opacity-60"
                    >
                      <span className="w-11 h-11 rounded-xl bg-pastel-mint text-pastel-mint-ink flex items-center justify-center">
                        <Sparkles size={20} />
                      </span>
                      <span className="font-heading font-bold text-text-main">
                        Start with the {chosenOption.subject} pack
                      </span>
                      <span className="text-sm text-text-muted">
                        {chosenOption.chapters.length} {chosenOption.chapters.length === 1 ? 'topic' : 'topics'} from the {chosenOption.exam} syllabus, ready to study now.
                      </span>
                      <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 mt-auto pt-1">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Add to my library
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => leave('/upload')}
                    disabled={busy}
                    className="soft-card-interactive p-5 text-left flex flex-col gap-3 disabled:opacity-60"
                  >
                    <span className="w-11 h-11 rounded-xl bg-pastel-lavender text-pastel-lavender-ink flex items-center justify-center">
                      <Upload size={20} />
                    </span>
                    <span className="font-heading font-bold text-text-main">Upload my own</span>
                    <span className="text-sm text-text-muted">
                      A PDF, a photo of your notes, or a link. We'll take you straight to the uploader.
                    </span>
                    <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 mt-auto pt-1">
                      Go to upload <ArrowRight size={14} />
                    </span>
                  </button>
                </div>

                {!chosenOption && (
                  <p className="text-xs text-text-muted mt-4">
                    We don't carry a ready-made pack for "{effectiveSubject}" yet — upload something of your own and Aether will build from it.
                  </p>
                )}

                <div className="flex justify-between items-center mt-8">
                  <button onClick={goBack} disabled={busy} className="btn-outline inline-flex items-center gap-2">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={goNext} disabled={busy} className="text-sm font-semibold text-text-muted hover:text-text-main transition-colors">
                    I'll add one later
                  </button>
                </div>
              </section>
            )}

            {/* ------------------------------ STEP 3 ------------------------------ */}
            {step === 'session' && (
              <section>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Step 3 of 4</p>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight mb-2">
                  Book your first study session
                </h1>
                <p className="text-sm text-text-muted mb-6">
                  {createdMaterial
                    ? <>You'll be studying <strong className="text-text-main">{createdMaterial.title}</strong>. Sessions are what build your streak.</>
                    : <>Sessions are what build your streak — start one now and day one is on the board.</>}
                </p>

                <p className="text-sm font-bold text-text-muted mb-3">How long?</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-5 py-2.5 rounded-2xl border text-sm font-semibold transition-all inline-flex items-center gap-2 ${
                        duration === d
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-text-main border-border hover:border-primary/30'
                      }`}
                    >
                      <Clock size={14} /> {d} min
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => createSession('now')}
                    disabled={busy}
                    className="soft-card-interactive p-5 text-left flex flex-col gap-3 disabled:opacity-60"
                  >
                    <span className="w-11 h-11 rounded-xl bg-pastel-mint text-pastel-mint-ink flex items-center justify-center">
                      <Play size={20} />
                    </span>
                    <span className="font-heading font-bold text-text-main">Start now</span>
                    <span className="text-sm text-text-muted">
                      Begin a {duration}-minute session right away and start your streak today.
                    </span>
                  </button>

                  <div className="soft-card p-5 flex flex-col gap-3">
                    <span className="w-11 h-11 rounded-xl bg-pastel-peach text-pastel-peach-ink flex items-center justify-center">
                      <CalendarClock size={20} />
                    </span>
                    <span className="font-heading font-bold text-text-main">Schedule it</span>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={e => setScheduledFor(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-alt border border-border rounded-xl text-sm text-text-main focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      onClick={() => createSession('later')}
                      disabled={busy || !scheduledFor}
                      className="btn-secondary w-full justify-center inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      Add to my calendar
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-8">
                  <button onClick={goBack} disabled={busy} className="btn-outline inline-flex items-center gap-2">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={goNext} disabled={busy} className="text-sm font-semibold text-text-muted hover:text-text-main transition-colors">
                    Not right now
                  </button>
                </div>
              </section>
            )}

            {/* ------------------------------ STEP 4 ------------------------------ */}
            {step === 'social' && (
              <section>
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Step 4 of 4</p>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight mb-2">
                  You don't have to study alone
                </h1>
                <p className="text-sm text-text-muted mb-6">
                  This is the part most study apps don't have. Both are on your sidebar under <strong className="text-text-main">Social</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="soft-card p-5 flex flex-col gap-3">
                    <span className="w-11 h-11 rounded-xl bg-pastel-sky text-pastel-sky-ink flex items-center justify-center">
                      <Radio size={20} />
                    </span>
                    <span className="font-heading font-bold text-text-main">Live Rooms</span>
                    <span className="text-sm text-text-muted">
                      Drop into a room and study alongside other people in real time, on a shared timer. Body-doubling is the single cheapest way to actually start.
                    </span>
                  </div>

                  <div className="soft-card p-5 flex flex-col gap-3">
                    <span className="w-11 h-11 rounded-xl bg-pastel-peach text-pastel-peach-ink flex items-center justify-center">
                      <Trophy size={20} />
                    </span>
                    <span className="font-heading font-bold text-text-main">Leaderboard</span>
                    <span className="text-sm text-text-muted">
                      Every minute you study earns points and ranks you against your rivals. Streaks are the score that's hardest to fake.
                    </span>
                  </div>
                </div>

                <div className="soft-card p-5 mb-8">
                  <h2 className="font-heading font-bold text-text-main mb-3">Here's where you're starting</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-text-muted">
                      <Check size={16} className="text-accent shrink-0" />
                      Studying <strong className="text-text-main">{effectiveSubject || 'your subject'}</strong>
                    </li>
                    {createdMaterial && (
                      <li className="flex items-center gap-2 text-text-muted">
                        <Check size={16} className="text-accent shrink-0" />
                        <strong className="text-text-main">{createdMaterial.title}</strong> in your library
                      </li>
                    )}
                    {sessionDone && (
                      <li className="flex items-center gap-2 text-text-muted">
                        <Check size={16} className="text-accent shrink-0" />
                        A {duration}-minute session {sessionDone === 'started' ? 'started — day 1 of your streak' : 'on your calendar'}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex justify-between items-center">
                  <button onClick={goBack} disabled={busy} className="btn-outline inline-flex items-center gap-2">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={finish} disabled={busy} className="btn-primary inline-flex items-center gap-2">
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                    Go to my dashboard
                  </button>
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
