import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Headphones, Palette, Lock, Check, ZapOff, Loader2, ShoppingBag, Trophy, History } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import api from '../services/api';

// New Components & Hooks
import { ShopItemCard } from '../components/shop/ShopItemCard';
import { PointsDisplay } from '../components/shop/PointsDisplay';
import { useShop } from '../hooks/useShop';

export default function Shop() {
  const { user, showToast } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<'all' | 'theme' | 'voice' | 'utility' | 'badge'>('all');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { items, points, totalEarned, totalSpent, loading, error, purchaseItem } = useShop();

  const handlePurchase = async (itemId: string) => {
    setIsPurchasing(true);
    const result = await purchaseItem(itemId);
    setIsPurchasing(false);
    
    if (result.success) {
      showToast(`Successfully purchased ${result.item?.name}!`, 'success');
    } else {
      showToast(result.message || 'Purchase failed', 'error');
    }
  };

  const categories = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'utility', label: 'Utilities', icon: Zap },
    { id: 'theme', label: 'Themes', icon: Palette },
    { id: 'voice', label: 'Voices', icon: Headphones },
    { id: 'badge', label: 'Badges', icon: Trophy },
  ] as const;

  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 relative select-none">
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#6C5CE7]/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#00D2FF]/5 rounded-full blur-[150px] -z-10 pointer-events-none" />

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="max-w-md">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-10 h-10 rounded-xl bg-[#6C5CE7] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/20">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Aether Shop</h1>
          </motion.div>
          <p className="text-sm text-white/40 font-bold leading-relaxed">
            Personalize your study experience with exclusive Aether themes, crystalline voices, and powerful streak-preserving tools.
          </p>
        </div>

        <PointsDisplay />
      </header>

      {/* Categories Scroller */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-6 py-3.5 rounded-2xl flex items-center gap-2.5 transition-all duration-300 border whitespace-nowrap",
              activeCategory === cat.id 
                ? "bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-lg shadow-[#6C5CE7]/20" 
                : "bg-[#141A24]/60 border-white/5 text-white/40 hover:border-white/10"
            )}
          >
            <cat.icon size={16} className={cn(activeCategory === cat.id ? "text-white" : "text-white/40")} />
            <span className="text-xs font-black uppercase tracking-widest">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <Loader2 size={48} className="text-[#6C5CE7] animate-spin mb-6" />
            <p className="text-white/40 font-black uppercase tracking-widest text-xs">Accessing vault...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <ZapOff size={48} className="text-red-400/20 mb-6" />
            <h3 className="text-xl font-black text-white mb-2">Sync Interrupted</h3>
            <p className="text-white/40 text-sm max-w-xs">{error}</p>
          </motion.div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <Sparkles size={48} className="text-white/5 mb-6" />
            <h3 className="text-xl font-black text-white mb-2">Vault Empty</h3>
            <p className="text-white/40 text-sm">Check back soon for new exclusive artifacts.</p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredItems.map((item) => (
              <ShopItemCard
                key={item._id}
                item={item}
                userPoints={points}
                onPurchase={handlePurchase}
                isLoading={isPurchasing}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Total Earned</span>
              <span className="text-white font-mono font-bold">{totalEarned.toLocaleString()}</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Total Spent</span>
              <span className="text-white font-mono font-bold">{totalSpent.toLocaleString()}</span>
           </div>
        </div>
        
        <button className="flex items-center gap-2 group">
           <History size={16} className="text-white/20 group-hover:text-[#6C5CE7] transition-colors" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Transaction History</span>
        </button>
      </footer>
    </div>
  );
}
