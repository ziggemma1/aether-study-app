import React from 'react';
import { motion } from 'motion/react';
import { Lock, Check, Zap, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ShopItem {
  _id: string;
  name: string;
  description: string;
  category: 'theme' | 'voice' | 'utility' | 'badge' | 'cosmetic';
  price: number;
  icon?: string;
  imageUrl?: string;
  isOwned: boolean;
  discount?: number;
  discountEndsAt?: string;
}

interface ShopItemCardProps {
  item: ShopItem;
  userPoints: number;
  onPurchase: (itemId: string) => void;
  isLoading?: boolean;
}

export function ShopItemCard({ item, userPoints, onPurchase, isLoading }: ShopItemCardProps) {
  const canAfford = userPoints >= item.price;
  const hasDiscount = item.discount && item.discountEndsAt && new Date() < new Date(item.discountEndsAt);
  const discountedPrice = hasDiscount ? Math.round(item.price * (1 - (item.discount || 0) / 100)) : item.price;

  const currentPrice = hasDiscount ? discountedPrice : item.price;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "group relative bg-[#141A24]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 transition-all duration-300",
        item.isOwned ? "opacity-80 grayscale-[0.2]" : "hover:border-white/10 hover:bg-[#141A24]/80 shadow-2xl hover:shadow-[#6C5CE7]/10"
      )}
    >
      {/* Category Tag */}
      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 flex items-center gap-1.5">
        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{item.category}</span>
      </div>

      {/* Visual Asset */}
      <div className="w-16 h-16 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
        {item.icon || '🛍️'}
      </div>

      {/* Info */}
      <div className="mb-6">
        <h3 className="text-lg font-black text-white mb-1 tracking-tight">{item.name}</h3>
        <p className="text-xs text-white/40 leading-relaxed font-bold line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Price</span>
          <div className="flex items-center gap-1.5 font-mono text-lg font-black text-white">
            <Zap size={14} className="text-[#00D2FF]" fill="currentColor" />
            {currentPrice.toLocaleString()}
          </div>
        </div>

        {item.isOwned ? (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Check size={14} strokeWidth={3} /> Owned
          </div>
        ) : (
          <button
            onClick={() => onPurchase(item._id)}
            disabled={!canAfford || isLoading}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              canAfford 
                ? "bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white shadow-lg shadow-[#6C5CE7]/20 hover:scale-105 active:scale-95" 
                : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
            )}
          >
            {isLoading ? "Processing..." : canAfford ? "Purchase" : "Locked"}
          </button>
        )}
      </div>

      {/* Glow Detail */}
      <div className={cn(
        "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none bg-gradient-to-br",
        item.category === 'theme' ? "from-[#6C5CE7] to-[#00D2FF]" : 
        item.category === 'voice' ? "from-[#00D2FF] to-emerald-400" :
        "from-amber-400 to-orange-500"
      )} />
    </motion.div>
  );
}
