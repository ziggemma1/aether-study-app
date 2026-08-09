import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  User, Globe, Bell, Camera, Lock, CreditCard, LogOut, Loader2,
  Palette, Sun, Moon, Check, ChevronRight, ShieldCheck, Users2
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { SHOP_ITEMS, ownsItem } from '../lib/shopCatalog';

type TabId = 'account' | 'profile' | 'appearance' | 'security';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'profile', label: 'Profile', icon: Users2 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Lock }
];

// Every language the translation table actually has. The old select offered
// three and left out Chinese, which translations.ts has supported all along.
const LANGUAGES = ['English (US)', 'English (UK)', 'Indonesia', 'Chinese'];
const CURRICULA = ['SAT / AP', 'WAEC / NECO', 'JAMB / UTME', 'General'];

export default function Settings() {
  const { user, setUser, theme, toggleTheme, signOut, showToast, t } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = React.useState<TabId>('account');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [busyTheme, setBusyTheme] = React.useState<string | null>(null);

  React.useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    // 'billing' used to be a tab of its own holding a single link. It redirects
    // to the page that link pointed at rather than 404-ing an old bookmark.
    if (tab === 'billing') { navigate('/subscription', { replace: true }); return; }
    if (tab === 'social') { setActiveTab('profile'); return; }
    if (tab && TABS.some((x) => x.id === tab)) setActiveTab(tab as TabId);
  }, [location, navigate]);

  const initial = React.useMemo(() => ({
    name: user?.name || '',
    language: user?.language || 'English (US)',
    curriculum: user?.curriculum || 'SAT / AP',
    bio: user?.bio || '',
    location: user?.location || '',
    handle: user?.handle || user?.name?.toLowerCase()?.replace(/\s+/g, '_') || '',
    visibility: user?.visibility || 'public',
    notificationPrefs: {
      push: user?.notificationPrefs?.push ?? true,
      email: user?.notificationPrefs?.email ?? false,
      aiInsights: user?.notificationPrefs?.aiInsights ?? true
    }
  }), [user]);

  const [formData, setFormData] = React.useState(initial);
  React.useEffect(() => { setFormData(initial); }, [initial]);

  // Nothing told you whether your edits were saved: the Save button looked
  // identical before and after a change, and the notification toggles animated
  // instantly while the value was still only in local state.
  const isDirty = React.useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initial),
    [formData, initial]
  );

  const [passwordForm, setPasswordForm] = React.useState({ current: '', next: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const handleSave = async (specificData?: Record<string, any>) => {
    if (!user) return;
    setIsSaving(true);
    const payload = specificData ?? {
      name: formData.name,
      language: formData.language,
      curriculum: formData.curriculum,
      bio: formData.bio,
      location: formData.location,
      handle: formData.handle,
      visibility: formData.visibility,
      notificationPrefs: formData.notificationPrefs
    };

    try {
      const { data } = await api.put('/users/profile', payload);
      if (data) {
        setUser({ ...user, ...data });
        showToast('Saved.');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "We couldn't save that.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const { current, next, confirm } = passwordForm;
    if (!current || !next || !confirm) return showToast('Fill in all three password fields.', 'error');
    if (next.length < 8) return showToast('New password must be at least 8 characters.', 'error');
    if (next !== confirm) return showToast("New password and confirmation don't match.", 'error');

    setIsChangingPassword(true);
    try {
      await api.put('/users/change-password', { currentPassword: current, newPassword: next });
      setPasswordForm({ current: '', next: '', confirm: '' });
      showToast('Password updated.');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast('Image too large. Max 2MB.', 'error');
    const reader = new FileReader();
    reader.onloadend = () => handleSave({ avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return showToast('Your browser does not support location detection.', 'error');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const place = data.address.city || data.address.town || data.address.state || 'Unknown location';
          setFormData((p) => ({ ...p, location: `${place}, ${data.address.country}` }));
        } catch {
          setFormData((p) => ({ ...p, location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` }));
          showToast("Couldn't look up the address — using coordinates.");
        } finally {
          setIsLocating(false);
        }
      },
      () => { setIsLocating(false); showToast('Location access denied.', 'error'); }
    );
  };

  /** Accent themes bought in the shop. Equipping uses the shop's own endpoint. */
  const themeItems = SHOP_ITEMS.filter((i) => i.kind === 'theme');
  const equipTheme = async (itemId: string | null) => {
    setBusyTheme(itemId || 'default');
    try {
      const { data } = await api.post('/users/shop/equip', { itemId, kind: 'theme' });
      if (user) setUser({ ...user, equippedTheme: data.equippedTheme });
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Could not switch theme.', 'error');
    } finally {
      setBusyTheme(null);
    }
  };

  const joined = user?.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full min-w-0 pb-24">
      <PageHeader title={t('settings')} subtitle="Manage your account and how Aether looks." />

      <div className="flex gap-1 p-1 rounded-xl bg-surface-alt border border-border mb-6 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[38px]',
              activeTab === tab.id
                ? 'bg-surface text-text-main shadow-[var(--shadow-card)]'
                : 'text-text-muted hover:text-text-main'
            )}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ---------------- Left ---------------- */}
        <aside className="lg:col-span-4 space-y-4">
          <Card className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-3xl bg-pastel-lavender text-pastel-lavender-ink border border-border overflow-hidden flex items-center justify-center text-3xl font-bold mx-auto">
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  : (user?.name?.charAt(0)?.toUpperCase() || '?')}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile picture"
                className="absolute -bottom-1 -right-1 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors cursor-pointer border-2 border-surface"
              >
                <Camera size={14} />
              </button>
            </div>
            <h2 className="font-heading text-lg font-bold text-text-main mt-3">{user?.name}</h2>
            <p className="text-xs text-text-muted">@{formData.handle}</p>
          </Card>

          <Card>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3 flex items-center gap-1.5">
              <ShieldCheck size={13} /> Account
            </h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Email</dt>
                <dd className="font-medium text-text-main truncate">{user?.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Joined</dt>
                {/* Was the hardcoded string "Apr 2024" for every account. */}
                <dd className="font-medium text-text-main">
                  {joined && !isNaN(joined.getTime())
                    ? joined.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                    : '—'}
                </dd>
              </div>
              {/* A "Verified — YES" row used to sit here. Nothing in the app
                  verifies anything, and no code ever set such a flag. */}
            </dl>
            <Link
              to="/subscription"
              className="mt-4 flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-alt border border-border hover:border-primary/30 transition-colors text-sm"
            >
              <span className="flex items-center gap-2 text-text-main">
                <CreditCard size={15} className="text-text-muted" />
                Plan
              </span>
              <span className="flex items-center gap-1 text-text-muted capitalize">
                {user?.plan || 'free'} <ChevronRight size={14} />
              </span>
            </Link>
          </Card>

          <button
            onClick={signOut}
            className="w-full p-3.5 rounded-[var(--radius-card)] bg-surface border border-border text-brand-pink hover:bg-brand-pink/5 hover:border-brand-pink/30 transition-colors flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer min-h-[44px]"
          >
            <LogOut size={16} /> Sign out
          </button>
        </aside>

        {/* ---------------- Right ---------------- */}
        <div className="lg:col-span-8">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-5">

            {activeTab === 'account' && (
              <>
                <Card title="Account info" icon={<User size={16} className="text-pastel-lavender-ink" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t('full_name')}>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label={t('email')} hint="Email can't be changed here">
                      <input type="email" value={user?.email || ''} disabled className={cn(inputCls, 'opacity-60 cursor-not-allowed')} />
                    </Field>
                    <Field label={t('language')}>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className={inputCls}
                      >
                        {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </Field>
                    <Field label={t('curriculum')}>
                      <select
                        value={formData.curriculum}
                        onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                        className={inputCls}
                      >
                        {CURRICULA.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field
                        label={t('location')}
                        action={
                          <button
                            onClick={detectLocation}
                            disabled={isLocating}
                            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-60"
                          >
                            {isLocating ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                            {isLocating ? 'Locating…' : t('detect')}
                          </button>
                        }
                      >
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g. Lagos, Nigeria"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </div>
                  <SaveBar dirty={isDirty} saving={isSaving} onSave={() => handleSave()} onReset={() => setFormData(initial)} />
                </Card>

                <Card title="Notifications" icon={<Bell size={16} className="text-pastel-peach-ink" />}>
                  <div className="space-y-2">
                    {([
                      { key: 'push', title: 'Push notifications', desc: 'Study reminders on this device' },
                      { key: 'email', title: 'Email updates', desc: 'A weekly summary of your progress' },
                      { key: 'aiInsights', title: 'AI insights', desc: 'Suggestions based on what you study' }
                    ] as const).map((pref) => {
                      const active = formData.notificationPrefs[pref.key];
                      return (
                        <button
                          key={pref.key}
                          type="button"
                          role="switch"
                          aria-checked={active}
                          onClick={() => setFormData({
                            ...formData,
                            notificationPrefs: { ...formData.notificationPrefs, [pref.key]: !active }
                          })}
                          className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-alt/60 border border-border hover:border-primary/25 transition-colors text-left cursor-pointer"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-text-main">{pref.title}</span>
                            <span className="block text-xs text-text-muted mt-0.5">{pref.desc}</span>
                          </span>
                          {/* Fixed-width track with a translate on the knob: the
                              old one read window.innerWidth at render time to
                              pick a pixel offset, so it never responded to a
                              resize. */}
                          <span className={cn(
                            'relative w-11 h-6 rounded-full shrink-0 transition-colors',
                            active ? 'bg-primary' : 'bg-[var(--ring-track)]'
                          )}>
                            <span className={cn(
                              'absolute top-1 left-1 w-4 h-4 bg-surface rounded-full shadow-sm transition-transform',
                              active && 'translate-x-5'
                            )} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <SaveBar dirty={isDirty} saving={isSaving} onSave={() => handleSave()} onReset={() => setFormData(initial)} />
                </Card>
              </>
            )}

            {activeTab === 'profile' && (
              <Card title="Public profile" icon={<Users2 size={16} className="text-pastel-mint-ink" />}>
                <div className="space-y-4">
                  {/* No maxLength: the server imposes no bio limit, and a
                      client-side cap of 300 rendered an existing 375-character
                      bio as "375/300" and blocked the user from editing it back
                      under a limit that does not exist. The count is a hint. */}
                  <Field
                    label={t('public_bio')}
                    hint={`${formData.bio.length} characters`}
                  >
                    <textarea
                      rows={5}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell people what you're studying…"
                      className={cn(inputCls, 'resize-none')}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={t('username_handle')}>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                        <input
                          type="text"
                          value={formData.handle}
                          onChange={(e) => setFormData({ ...formData, handle: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                          className={cn(inputCls, 'pl-8')}
                        />
                      </div>
                    </Field>
                    <Field label={t('visibility_scope')}>
                      <select
                        value={formData.visibility}
                        onChange={(e) => setFormData({ ...formData, visibility: e.target.value as typeof formData.visibility })}
                        className={inputCls}
                      >
                        <option value="public">Public — anyone</option>
                        <option value="friends">Friends only</option>
                        <option value="private">Private — only me</option>
                      </select>
                    </Field>
                  </div>
                </div>
                <SaveBar dirty={isDirty} saving={isSaving} onSave={() => handleSave()} onReset={() => setFormData(initial)} />
              </Card>
            )}

            {activeTab === 'appearance' && (
              <>
                {/* Settings had no appearance section at all. `theme` and
                    `toggleTheme` were pulled off the context at the top of this
                    file and then never used — the only light/dark control in the
                    app was the small toggle in the header. */}
                <Card title="Theme" icon={<Sun size={16} className="text-pastel-peach-ink" />}>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { id: 'light', label: 'Light', Icon: Sun },
                      { id: 'dark', label: 'Dark', Icon: Moon }
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { if (theme !== opt.id) toggleTheme(); }}
                        aria-pressed={theme === opt.id}
                        className={cn(
                          'flex items-center gap-2.5 p-4 rounded-xl border text-sm font-semibold transition-colors cursor-pointer',
                          theme === opt.id
                            ? 'border-primary/40 bg-primary/5 text-text-main'
                            : 'border-border bg-surface-alt/60 text-text-muted hover:border-primary/25'
                        )}
                      >
                        <opt.Icon size={16} /> {opt.label}
                        {theme === opt.id && <Check size={14} className="ml-auto text-primary" />}
                      </button>
                    ))}
                  </div>
                </Card>

                <Card
                  title="Accent colour"
                  icon={<Palette size={16} className="text-pastel-lavender-ink" />}
                  action={
                    <Link to="/shop" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5">
                      Shop <ChevronRight size={13} />
                    </Link>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ThemeOption
                      name="Aether"
                      swatch={['#6C5CE7', '#0089B0', '#0E9F6E']}
                      owned
                      active={!user?.equippedTheme}
                      busy={busyTheme === 'default'}
                      onSelect={() => equipTheme(null)}
                    />
                    {themeItems.map((item) => {
                      const owned = ownsItem(user?.themeUnlocked, item.id);
                      return (
                        <ThemeOption
                          key={item.id}
                          name={item.name}
                          swatch={item.swatch!}
                          owned={owned}
                          active={user?.equippedTheme === item.value}
                          busy={busyTheme === item.id}
                          cost={item.cost}
                          onSelect={() => (owned ? equipTheme(item.id) : navigate('/shop'))}
                        />
                      );
                    })}
                  </div>
                </Card>
              </>
            )}

            {activeTab === 'security' && (
              <Card title="Password" icon={<Lock size={16} className="text-pastel-pink-ink" />}>
                <div className="space-y-4">
                  <Field label="Current password">
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="New password" hint="At least 8 characters">
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.next}
                        onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Confirm new password">
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
                <div className="flex justify-end mt-5 pt-5 border-t border-border">
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 min-h-[44px]"
                  >
                    {isChangingPassword && <Loader2 size={15} className="animate-spin" />}
                    Update password
                  </button>
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-main placeholder:text-text-muted outline-none focus:border-primary/50 transition-colors';

function Card({ title, icon, action, className, children }: {
  title?: string; icon?: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  return (
    <section className={cn('rounded-[var(--radius-card)] bg-surface border border-border shadow-[var(--shadow-card)] p-5 sm:p-6', className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-heading text-base font-bold text-text-main tracking-tight flex items-center gap-2">
            {icon} {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Field({ label, hint, action, children }: {
  label: string; hint?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold text-text-muted">{label}</span>
        {action}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-text-muted mt-1">{hint}</span>}
    </label>
  );
}

/** Save row that only lights up when something has actually changed. */
function SaveBar({ dirty, saving, onSave, onReset }: {
  dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 mt-5 pt-5 border-t border-border">
      {dirty && (
        <button
          onClick={onReset}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:text-text-main transition-colors cursor-pointer min-h-[44px]"
        >
          Discard
        </button>
      )}
      <button
        onClick={onSave}
        disabled={!dirty || saving}
        className={cn(
          'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors min-h-[44px]',
          dirty && !saving
            ? 'bg-primary hover:bg-primary/90 text-white cursor-pointer'
            : 'bg-surface-alt text-text-muted border border-border cursor-not-allowed'
        )}
      >
        {saving && <Loader2 size={15} className="animate-spin" />}
        {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
      </button>
    </div>
  );
}

function ThemeOption({ name, swatch, owned, active, busy, cost, onSelect }: {
  name: string;
  swatch: [string, string, string];
  owned: boolean;
  active: boolean;
  busy: boolean;
  cost?: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={busy}
      aria-pressed={active}
      className={cn(
        'p-4 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-60',
        active ? 'border-primary/40 bg-primary/5' : 'border-border bg-surface-alt/60 hover:border-primary/25'
      )}
    >
      <span className="flex items-center gap-1.5 mb-3">
        {swatch.map((c, i) => (
          <span key={i} className="h-6 flex-1 rounded-md border border-border/60" style={{ backgroundColor: c }} />
        ))}
      </span>
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-text-main">{name}</span>
        {busy ? (
          <Loader2 size={14} className="animate-spin text-text-muted" />
        ) : active ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
            <Check size={13} /> Active
          </span>
        ) : owned ? (
          <span className="text-[11px] text-text-muted">Use</span>
        ) : (
          <span className="text-[11px] text-text-muted">{cost} pts</span>
        )}
      </span>
    </button>
  );
}
