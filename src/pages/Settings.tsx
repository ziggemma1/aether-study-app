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
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';

export default function Settings() {
  const { user, setUser, theme, toggleTheme, signOut, showToast, t } = useAppContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = React.useState<'account' | 'social' | 'security' | 'billing'>('account');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isLocating, setIsLocating] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['account', 'social', 'security', 'billing'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [location]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    language: user?.language || 'English (US)',
    curriculum: user?.curriculum || 'SAT / AP',
    bio: user?.bio || '',
    location: user?.location || '',
    handle: user?.handle || user?.name?.toLowerCase()?.replace(/\s+/g, '_') || ''
  });

  const tabs = [
    { id: 'account', label: t('account_info'), icon: User },
    { id: 'social', label: t('social_profile_bio'), icon: Globe },
    { id: 'security', label: t('security'), icon: Lock },
    { id: 'billing', label: t('billing'), icon: CreditCard },
  ];

  const handleSave = async (specificData?: any) => {
    if (!user) return;
    setIsSaving(true);

    // Ensure we don't try to stringify a React/DOM event object
    const isEvent = specificData && (specificData.nativeEvent || specificData.target);
    const payload = (specificData && !isEvent) ? specificData : {
      name: formData.name,
      language: formData.language,
      curriculum: formData.curriculum,
      bio: formData.bio,
      location: formData.location,
      handle: formData.handle
    };

    try {
      const response = await api.put('/users/profile', payload);

      if (response.data) {
        setUser({
          ...user,
          ...response.data
        });
        showToast('Profile updated successfully!');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update profile: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image too large. Max 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      handleSave({ avatar: base64String });
    };
    reader.readAsDataURL(file);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding would be ideal, but for now we'll set a descriptive string
          // In a real app we'd use a service like Google Maps API to get the city/country
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          const locationStr = data.address.city || data.address.town || data.address.state || 'Unknown Location';
          const fullLocation = `${locationStr}, ${data.address.country}`;
          
          setFormData(prev => ({ ...prev, location: fullLocation }));
          showToast(`Located: ${fullLocation}`);
        } catch (err) {
          showToast('Could not fetch address. Using coordinates.');
          setFormData(prev => ({ ...prev, location: `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}` }));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        showToast('Location access denied or unavailable.', 'error');
      }
    );
  };

  return (
    <div className="p-3 sm:p-8 lg:p-12 max-w-5xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold mb-0.5 sm:mb-2 text-text-main tracking-tight">{t('settings')}</h1>
          <p className="text-[10px] sm:text-base text-text-muted">Manage your account and preferences.</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center bg-surface-alt/50 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-border overflow-x-auto custom-scrollbar">
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
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-1.5 sm:p-2.5 bg-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform z-20 border-2 border-background"
              >
                <Camera size={14} className="sm:hidden" />
                <Camera size={18} className="hidden sm:block" />
              </button>
            </div>
            
            <h2 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 text-text-main tracking-tight">{user?.name}</h2>
            <p className="text-[10px] sm:text-sm text-text-muted mb-4 sm:mb-6 font-medium">@{user?.handle || user?.name?.toLowerCase()?.replace(/\s+/g, '_')}</p>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-dashed border-border/40">
              <div className="text-center">
                <p className="text-sm sm:text-lg font-bold text-text-main">{user?.followersCount || 0}</p>
                <p className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('followers')}</p>
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-lg font-bold text-text-main">{user?.friendsCount || 0}</p>
                <p className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest">{t('friends')}</p>
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
                <span className="text-text-muted">{t('verified')}</span>
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
                    {t('account_info')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">{t('full_name')}</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">{t('email')}</label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main opacity-50 cursor-not-allowed outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">{t('language')}</label>
                      <select 
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none transition-all"
                      >
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>Indonesia</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">{t('curriculum')}</label>
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
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
                        {t('location')}
                        <button 
                          onClick={detectLocation}
                          disabled={isLocating}
                          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 normal-case font-bold"
                        >
                          {isLocating ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                          {t('detect')}
                        </button>
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Lagos, Nigeria"
                        className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-border/40 flex justify-end">
                    <button 
                      onClick={() => handleSave()}
                      disabled={isSaving}
                      className="btn-primary py-2 px-6 sm:py-3 sm:px-10 text-[10px] sm:text-sm flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : t('save_changes')}
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
                        <motion.div 
                          initial={false}
                          animate={{ backgroundColor: pref.active ? "var(--color-primary)" : "var(--color-border)" }}
                          className="w-10 h-5 sm:w-12 sm:h-6 rounded-full relative transition-all"
                        >
                          <motion.div 
                            initial={false}
                            animate={{ x: pref.active ? (window.innerWidth < 640 ? 20 : 24) : 4 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </motion.div>
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
                    {t('social_profile_bio')}
                  </h3>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('public_bio')}</label>
                      <textarea
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell the community about your study goals..."
                        className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('username_handle')}</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted font-bold">@</span>
                          <input
                            type="text"
                            value={formData.handle}
                            onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                            className="w-full pl-10 pr-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-widest">{t('visibility_scope')}</label>
                        <select className="w-full px-5 py-3.5 rounded-2xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none transition-all">
                          <option>Public (Everyone)</option>
                          <option>Friends Only</option>
                          <option>Private (Only Me)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 pt-8 border-t border-border/40 flex justify-end">
                    <button 
                      onClick={() => handleSave()}
                      disabled={isSaving}
                      className="btn-primary px-10 flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : t('update_social_profile')}
                    </button>
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
