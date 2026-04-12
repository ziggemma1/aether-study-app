import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Globe, 
  GraduationCap, 
  Bell, 
  Trash2, 
  Camera, 
  Sparkles, 
  Users2, 
  Award, 
  CheckCircle2,
  Lock,
  ShieldCheck,
  CreditCard,
  LogOut,
  Loader2,
  Database,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase, isSupabaseConfigured, testConnection, getPublicConfig } from '../lib/supabase';

export default function Settings() {
  const { user, setUser, theme, toggleTheme, signOut } = useAppContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = React.useState<'account' | 'social' | 'security' | 'billing' | 'connection'>('account');

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['account', 'social', 'security', 'billing', 'connection'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [location]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [supabaseConfig, setSupabaseConfig] = React.useState({
    url: localStorage.getItem('SUPABASE_URL_OVERRIDE') || import.meta.env.VITE_SUPABASE_URL || '',
    key: localStorage.getItem('SUPABASE_ANON_KEY_OVERRIDE') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  });
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    language: user?.language || 'English (US)',
    curriculum: user?.curriculum || 'SAT / AP'
  });

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'social', label: 'Social Profile', icon: Globe },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'connection', label: 'Connection', icon: Database },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const handleSave = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabase is not connected. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables in the Settings menu.');
      return;
    }

    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          language: formData.language,
          curriculum: formData.curriculum
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser({
        ...user,
        name: formData.name,
        language: formData.language,
        curriculum: formData.curriculum
      });

      alert('Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to update profile: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSupabase = () => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      alert('Please enter both URL and Anon Key');
      return;
    }
    
    if (!supabaseConfig.url.startsWith('https://')) {
      alert('Supabase URL must start with https://');
      return;
    }

    localStorage.setItem('SUPABASE_URL_OVERRIDE', supabaseConfig.url);
    localStorage.setItem('SUPABASE_ANON_KEY_OVERRIDE', supabaseConfig.key);
    
    alert('Supabase configuration saved locally! The app will now reload to apply changes.');
    window.location.reload();
  };

  const handleResetSupabase = () => {
    localStorage.removeItem('SUPABASE_URL_OVERRIDE');
    localStorage.removeItem('SUPABASE_ANON_KEY_OVERRIDE');
    alert('Local overrides removed. The app will now reload to use environment variables.');
    window.location.reload();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection();
      if (result.success) {
        setTestResult({ success: true, message: 'Connection successful! Your credentials are valid.' });
      } else {
        setTestResult({ success: false, message: result.error || 'Connection failed. Please check your URL and Key.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'An unexpected error occurred.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-3 sm:p-8 lg:p-12 max-w-5xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-2 text-text-main tracking-tight">Settings</h1>
          <p className="text-[10px] sm:text-base text-text-muted">Manage your account and preferences.</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center bg-surface-alt/50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-border overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              <tab.icon size={12} className="sm:hidden" />
              <tab.icon size={14} className="hidden sm:block" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {!isSupabaseConfigured && activeTab !== 'connection' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
              <Database size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-main">Supabase Not Connected</p>
              <p className="text-[10px] text-text-muted">Your data won't be saved until you connect your backend.</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('connection')}
            className="px-4 py-2 bg-red-500 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-red-500/20 whitespace-nowrap"
          >
            Connect Now
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        {/* Left Sidebar - Quick Stats & Profile Change */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          <div className="glass-card p-6 sm:p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-16 sm:h-24 bg-gradient-to-br from-primary/20 to-secondary/20" />
            
            <div className="relative inline-block mt-2 sm:mt-4 mb-4 sm:mb-6">
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-surface rounded-full flex items-center justify-center text-primary text-2xl sm:text-4xl font-bold border-4 border-background shadow-2xl overflow-hidden relative z-10">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name.charAt(0)
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 sm:p-2.5 bg-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform z-20 border-2 border-background">
                <Camera size={14} className="sm:hidden" />
                <Camera size={18} className="hidden sm:block" />
              </button>
            </div>
            
            <h2 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 text-text-main tracking-tight">{user?.name}</h2>
            <p className="text-[10px] sm:text-sm text-text-muted mb-4 sm:mb-6 font-medium">@robert_fox_study</p>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-dashed border-border/40">
              <div className="text-center">
                <p className="text-sm sm:text-lg font-bold text-text-main">1.2k</p>
                <p className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-lg font-bold text-text-main">850</p>
                <p className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest">Friends</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-6 bg-primary/5 border-primary/20">
            <h4 className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
              <ShieldCheck size={12} className="sm:hidden" />
              <ShieldCheck size={14} className="hidden sm:block" /> Status
            </h4>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                <span className="text-text-muted">Plan</span>
                <span className="text-primary uppercase">{user?.plan}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                <span className="text-text-muted">Verified</span>
                <span className="text-green-500 uppercase">Yes</span>
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold">
                <span className="text-text-muted">Joined</span>
                <span className="text-text-main uppercase">Apr 2024</span>
              </div>
            </div>
          </div>

          <button 
            onClick={signOut}
            className="w-full p-3 sm:p-4 glass-card border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 sm:gap-3 font-bold uppercase tracking-widest text-[10px] sm:text-xs"
          >
            <LogOut size={16} className="sm:hidden" />
            <LogOut size={18} className="hidden sm:block" /> Sign Out
          </button>
        </div>

        {/* Right Content - Tabs */}
        <div className="lg:col-span-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'account' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="glass-card p-6 sm:p-8">
                  <h3 className="text-sm sm:text-xl font-bold mb-6 sm:mb-8 text-text-main flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center text-primary">
                      <User size={16} className="sm:hidden" />
                      <User size={20} className="hidden sm:block" />
                    </div>
                    Account Info
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main opacity-50 cursor-not-allowed outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">Language</label>
                      <select 
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none transition-all"
                      >
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>French</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">Curriculum</label>
                      <select 
                        value={formData.curriculum}
                        onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none transition-all"
                      >
                        <option>SAT / AP</option>
                        <option>WAEC / NECO</option>
                        <option>JAMB / UTME</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-border/40 flex justify-end">
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="btn-primary py-2 px-6 sm:py-3 sm:px-10 text-[10px] sm:text-sm flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                    </button>
                  </div>
                </div>

                <div className="glass-card p-6 sm:p-8">
                  <h3 className="text-sm sm:text-xl font-bold mb-6 sm:mb-8 text-text-main flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/10 rounded-lg sm:rounded-xl flex items-center justify-center text-orange-500">
                      <Bell size={16} className="sm:hidden" />
                      <Bell size={20} className="hidden sm:block" />
                    </div>
                    Notifications
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { title: 'Push Notifications', desc: 'Study reminders', active: true },
                      { title: 'Email Updates', desc: 'Weekly reports', active: false },
                      { title: 'AI Insights', desc: 'Personalized tips', active: true },
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between p-4 sm:p-5 bg-surface-alt/30 rounded-xl sm:rounded-2xl border border-border/40 hover:border-primary/30 transition-all cursor-pointer group">
                        <div>
                          <p className="font-bold text-[10px] sm:text-sm text-text-main group-hover:text-primary transition-colors">{pref.title}</p>
                          <p className="text-[8px] sm:text-xs text-text-muted">{pref.desc}</p>
                        </div>
                        <div className={cn(
                          "w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-all",
                          pref.active ? "bg-primary" : "bg-border"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                            pref.active ? "right-0.5 sm:right-1" : "left-0.5 sm:left-1"
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'connection' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="glass-card p-6 sm:p-8">
                  <h3 className="text-sm sm:text-xl font-bold mb-6 sm:mb-8 text-text-main flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center text-primary">
                      <Database size={16} className="sm:hidden" />
                      <Database size={20} className="hidden sm:block" />
                    </div>
                    Supabase Connection
                  </h3>
                  
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl mb-8">
                    <p className="text-[10px] sm:text-xs text-primary leading-relaxed">
                      If your environment variables are not working, you can manually enter your Supabase credentials here. 
                      These will be saved in your browser's local storage and will override any environment variables.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
                        Supabase Project URL
                        <a href="https://supabase.com/dashboard/project/_/settings/api" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          Find it here <ExternalLink size={10} />
                        </a>
                      </label>
                      <input
                        type="text"
                        placeholder="https://your-project.supabase.co"
                        value={supabaseConfig.url}
                        onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
                        Supabase Anon Key
                        <span className="text-[8px] text-text-muted">Public API Key</span>
                      </label>
                      <input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1..."
                        value={supabaseConfig.key}
                        onChange={(e) => setSupabaseConfig({ ...supabaseConfig, key: e.target.value })}
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-border/40 flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={handleSaveSupabase}
                        disabled={isSaving || isTesting}
                        className="btn-primary py-3 px-8 text-[10px] sm:text-sm flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Save & Connect</>}
                      </button>
                      <button 
                        onClick={handleTestConnection}
                        disabled={isSaving || isTesting}
                        className="btn-outline py-3 px-8 text-[10px] sm:text-sm flex items-center justify-center gap-2"
                      >
                        {isTesting ? <Loader2 size={16} className="animate-spin" /> : 'Test Connection'}
                      </button>
                    </div>
                    <button 
                      onClick={handleResetSupabase}
                      className="flex items-center justify-center gap-2 px-6 py-3 text-[10px] sm:text-xs font-bold text-text-muted hover:text-red-500 transition-colors"
                    >
                      <RefreshCw size={14} /> Reset to Defaults
                    </button>
                  </div>

                  {testResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "mt-4 p-4 rounded-xl border text-[10px] sm:text-xs font-medium",
                        testResult.success 
                          ? "bg-green-500/10 border-green-500/20 text-green-500" 
                          : "bg-red-500/10 border-red-500/20 text-red-500"
                      )}
                    >
                      {testResult.message}
                    </motion.div>
                  )}
                </div>

                <div className="glass-card p-6 sm:p-8 border-dashed border-2 border-border/30">
                  <h4 className="text-xs font-bold text-text-main mb-4">Connection Status</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full animate-pulse",
                        isSupabaseConfigured ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      )} />
                      <span className="text-sm font-medium text-text-main">
                        {isSupabaseConfigured ? 'Supabase is configured' : 'Supabase is not connected'}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-surface-alt/50 rounded-lg border border-border/40 space-y-2">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Current Config (Masked)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] text-text-muted">URL</p>
                          <p className="text-[10px] font-mono text-text-main truncate">{getPublicConfig().url}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-text-muted">Anon Key</p>
                          <p className="text-[10px] font-mono text-text-main truncate">{getPublicConfig().keyPreview}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!isSupabaseConfigured && (
                    <p className="mt-4 text-xs text-text-muted leading-relaxed">
                      The app is currently using a dummy client to prevent errors. Please provide your Supabase URL and Anon Key to enable real-time features and data persistence.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-6">
                <div className="glass-card p-8">
                  <h3 className="text-xl font-bold mb-8 text-text-main flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                      <Users2 size={20} />
                    </div>
                    Social Profile & Bio
                  </h3>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Public Bio</label>
                      <textarea
                        rows={4}
                        placeholder="Tell the community about your study goals..."
                        className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Username / Handle</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted font-bold">@</span>
                          <input
                            type="text"
                            defaultValue="robert_fox_study"
                            className="w-full pl-10 pr-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Visibility Scope</label>
                        <select className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none transition-all">
                          <option>Public (Everyone)</option>
                          <option>Friends Only</option>
                          <option>Private (Only Me)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 pt-8 border-t border-border/40 flex justify-end">
                    <button className="btn-primary px-10">Update Social Profile</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="glass-card p-8">
                  <h3 className="text-xl font-bold mb-8 text-text-main flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                      <Lock size={20} />
                    </div>
                    Password & Security
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">New Password</label>
                        <input
                          type="password"
                          className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Confirm New Password</label>
                        <input
                          type="password"
                          className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 pt-8 border-t border-border/40 flex justify-end">
                    <button className="btn-primary px-10">Update Password</button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
