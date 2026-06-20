import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Headphones, Palette, Lock, Unlock, Snowflake } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import api from '../services/api';

export default function Shop() {
  const { user, showToast, t, setUser } = useAppContext();
  
  // local mock points state for demo purposes without hitting backend
  const points = user?.aetherPoints || 0;
  const freezeTokens = user?.freezeTokens || 0;

  const handleBuyItem = async (cost: number, itemName: string, isFreeze: boolean = false) => {
    if (points >= cost) {
      try {
        const response = await api.post('/users/shop/purchase', { cost, itemName, isFreeze });
        if (setUser && user) {
          setUser({
            ...user,
            aetherPoints: response.data.aetherPoints,
            freezeTokens: response.data.freezeTokens,
            themeUnlocked: response.data.themeUnlocked
          });
        }
        if (isFreeze) {
          showToast(`Purchased ${itemName}! You now have ${response.data.freezeTokens} tokens.`);
        } else {
          showToast(`Unlocked ${itemName}! Enjoy.`);
        }
      } catch (error: any) {
        showToast(error.response?.data?.message || 'Purchase failed', 'error');
      }
    } else {
      showToast(`Not enough Aether Points for ${itemName}. Keep studying!`, 'error');
    }
  };

  const themes = [
    { id: 't1', name: 'Cyberpunk Red', icon: Palette, cost: 200 },
    { id: 't2', name: 'Ocean Breeze', icon: Palette, cost: 150 },
  ];

  const voices = [
    { id: 'v1', name: 'Voice: Atlas (Deep UK)', icon: Headphones, cost: 500 },
    { id: 'v2', name: 'Voice: Nova (Bright US)', icon: Headphones, cost: 300 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <header className="mb-10 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-gradient-to-tr from-primary to-accent rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-primary/20">
          <Zap size={36} className="animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-2">Aether Shop</h1>
        <p className="text-text-muted mb-6">Spend points earned from your focus sessions.</p>
        
        <div className="flex gap-4">
          <div className="glass-card px-6 py-3 flex items-center gap-3">
             <Zap className="text-yellow-500" />
             <span className="text-2xl font-black text-text-main">{points}</span>
             <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Points</span>
          </div>
          <div className="glass-card px-6 py-3 flex items-center gap-3">
             <Snowflake className="text-cyan-500" />
             <span className="text-2xl font-black text-text-main">{freezeTokens}</span>
             <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Freeze Tokens</span>
          </div>
        </div>
      </header>

      <div className="space-y-12">
        {/* Utilities */}
        <section>
          <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
            <Snowflake className="text-cyan-500" /> Utilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div whileHover={{ y: -4 }} className="glass-card p-6 border-2 border-border/40 hover:border-cyan-500/50 transition-all flex justify-between items-center">
               <div>
                  <h3 className="font-bold text-text-main text-lg mb-1">Streak Freeze</h3>
                  <p className="text-sm text-text-muted">Guilt-free day off. Keeps your streak active.</p>
               </div>
               <button onClick={() => handleBuyItem(100, 'Streak Freeze', true)} className="btn-primary bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20 whitespace-nowrap px-6 rounded-xl font-black">
                 100 <Zap size={14} className="inline ml-1 mb-0.5" />
               </button>
            </motion.div>
          </div>
        </section>

        {/* UI Themes */}
        <section>
          <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
             <Palette className="text-purple-500" /> Display Themes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map(t => (
              <motion.div key={t.id} whileHover={{ y: -4 }} className="glass-card p-6 flex flex-col items-center text-center">
                 <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted mb-4">
                   <t.icon />
                 </div>
                 <h3 className="font-bold text-text-main mb-4">{t.name}</h3>
                 <button onClick={() => handleBuyItem(t.cost, t.name)} className="w-full btn-outline border-primary/20 text-text-main hover:bg-primary/5 rounded-xl font-bold flex items-center justify-center gap-2">
                   <Lock size={14} /> {t.cost} <Zap size={14} />
                 </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* TTS Voices */}
        <section>
          <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
             <Headphones className="text-blue-500" /> AI Voices
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {voices.map(t => (
              <motion.div key={t.id} whileHover={{ y: -4 }} className="glass-card p-6 flex flex-col items-center text-center">
                 <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted mb-4">
                   <t.icon />
                 </div>
                 <h3 className="font-bold text-text-main mb-4">{t.name}</h3>
                 <button onClick={() => handleBuyItem(t.cost, t.name)} className="w-full btn-outline border-primary/20 text-text-main hover:bg-primary/5 rounded-xl font-bold flex items-center justify-center gap-2">
                   <Lock size={14} /> {t.cost} <Zap size={14} />
                 </button>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
