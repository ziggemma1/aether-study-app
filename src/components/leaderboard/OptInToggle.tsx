import React from 'react';
import { Trophy, Rocket, Shield, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface OptInToggleProps {
  isOptedIn: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export function OptInToggle({ isOptedIn, onToggle, isLoading }: OptInToggleProps) {
  return (
    <div className="relative overflow-hidden group">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C5CE7]/10 blur-[80px] pointer-events-none group-hover:bg-[#6C5CE7]/20 transition-all duration-700" />
      
      <div className="bg-[#141A24]/60 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300 group-hover:border-white/10">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 shrink-0 rounded-[28px] bg-gradient-to-br from-[#6C5CE7] to-[#00D2FF] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/20">
            <Trophy size={32} className="text-white fill-white/20" />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-black text-white mb-3 tracking-tight">Arena Opt-In Required</h3>
            <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto md:mx-0">
              Join the Aether Leaderboard to calculate your study recall metrics and compete for weekly academic recognition.
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#00D2FF]/60 bg-[#00D2FF]/5 px-3 py-1.5 rounded-lg border border-[#00D2FF]/10">
                <Rocket size={12} /> Global Exposure
              </div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#6C5CE7]/60 bg-[#6C5CE7]/5 px-3 py-1.5 rounded-lg border border-[#6C5CE7]/10">
                <Shield size={12} /> Verify Recall
              </div>
            </div>
          </div>
          
          <button 
            onClick={onToggle}
            disabled={isLoading}
            className={cn(
              "shrink-0 w-full md:w-auto px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3",
              isOptedIn 
                ? "bg-white/5 text-white/40 hover:bg-white/10 border border-white/5" 
                : "bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] text-white shadow-[0_4px_25px_rgba(108,92,231,0.3)] hover:opacity-90"
            )}
          >
            {isLoading ? 'Processing...' : isOptedIn ? 'Retire from Arena' : 'Enter the Arena'}
            {!isOptedIn && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
