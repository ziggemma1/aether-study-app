import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
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
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  const { user, theme, toggleTheme } = useAppContext();
  const [activeTab, setActiveTab] = React.useState<'account' | 'social' | 'security' | 'billing'>('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'social', label: 'Social Profile', icon: Globe },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-text-main tracking-tight">Settings</h1>
          <p className="text-text-muted">Manage your account, social presence, and preferences.</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center bg-surface-alt/50 p-1.5 rounded-2xl border border-border overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Sidebar - Quick Stats & Profile Change */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-secondary/20" />
            
            <div className="relative inline-block mt-4 mb-6">
              <div className="w-32 h-32 bg-surface rounded-full flex items-center justify-center text-primary text-4xl font-bold border-4 border-background shadow-2xl overflow-hidden relative z-10">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name.charAt(0)
                )}
              </div>
              <button className="absolute bottom-1 right-1 p-2.5 bg-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform z-20 border-2 border-background">
                <Camera size={18} />
              </button>
            </div>
            
            <h2 className="text-2xl font-bold mb-1 text-text-main tracking-tight">{user?.name}</h2>
            <p className="text-sm text-text-muted mb-6 font-medium">@robert_fox_study</p>
            
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-dashed border-border/40">
              <div className="text-center">
                <p className="text-lg font-bold text-text-main">1.2k</p>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-main">850</p>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Friends</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 bg-primary/5 border-primary/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck size={14} /> Account Status
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-text-muted">Plan</span>
                <span className="text-primary uppercase">{user?.plan}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-text-muted">Verified</span>
                <span className="text-green-500 uppercase">Yes</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-text-muted">Member Since</span>
                <span className="text-text-main uppercase">April 2024</span>
              </div>
            </div>
          </div>

          <button className="w-full p-4 glass-card border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs">
            <LogOut size={18} /> Sign Out
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
              <div className="space-y-6">
                <div className="glass-card p-8">
                  <h3 className="text-xl font-bold mb-8 text-text-main flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <User size={20} />
                    </div>
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        defaultValue={user?.name}
                        className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        defaultValue={user?.email}
                        className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Language</label>
                      <select className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none transition-all">
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Nigerian English</option>
                        <option>French</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Curriculum</label>
                      <select className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none transition-all">
                        <option>SAT / AP</option>
                        <option>WAEC / NECO</option>
                        <option>JAMB / UTME</option>
                        <option>IGCSE / A-Levels</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-10 pt-8 border-t border-border/40 flex justify-end">
                    <button className="btn-primary px-10">Save Changes</button>
                  </div>
                </div>

                <div className="glass-card p-8">
                  <h3 className="text-xl font-bold mb-8 text-text-main flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                      <Bell size={20} />
                    </div>
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    {[
                      { title: 'Push Notifications', desc: 'Study reminders and quiz alerts', active: true },
                      { title: 'Email Updates', desc: 'Weekly progress reports and news', active: false },
                      { title: 'AI Insights', desc: 'Personalized study tips from Aether', active: true },
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-surface-alt/30 rounded-2xl border border-border/40 hover:border-primary/30 transition-all cursor-pointer group">
                        <div>
                          <p className="font-bold text-text-main group-hover:text-primary transition-colors">{pref.title}</p>
                          <p className="text-xs text-text-muted">{pref.desc}</p>
                        </div>
                        <div className={cn(
                          "w-12 h-6 rounded-full relative transition-all",
                          pref.active ? "bg-primary" : "bg-border"
                        )}>
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                            pref.active ? "right-1" : "left-1"
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
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
