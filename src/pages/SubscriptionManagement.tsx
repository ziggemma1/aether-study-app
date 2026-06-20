import React from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import { 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Star, 
  Receipt, 
  Cpu, 
  Orbit, 
  Hexagon,
  ArrowRight,
  Infinity,
  Fingerprint,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function SubscriptionManagement() {
  const { user, setUser, showToast } = useAppContext();
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await api.post('/users/upgrade-to-pro');
      setUser({ ...user, plan: res.data.plan });
      showToast('Quantum Access Synchronized.', 'success');
    } catch (err: any) {
      showToast('Neural Link failed.', 'error');
    } finally {
      setIsUpgrading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free Neural Link',
      price: '0',
      description: 'The baseline frequency for casual cosmic learners.',
      features: [
        '3 Document Uploads per month',
        'Standard AI Processing',
        'Basic Study Analytics',
        'Global Leaderboard Entry'
      ],
      icon: <Cpu className="text-[#8E9AAF]" />,
      color: 'from-[#1A2230] to-[#141A24]',
      current: user?.plan === 'free',
    },
    {
      id: 'pro',
      name: 'Pro Quantum Access',
      price: '20',
      description: 'Infinite intelligence bandwidth for the Aether Elite.',
      features: [
        'Unlimited Document Uploads',
        'Deep Neural AI Extractions',
        'OCR for Legacy Texts',
        'Custom Study Path Generation',
        'Priority Link Access',
        'Exclusive User Badges'
      ],
      icon: <Orbit className="text-[#00D2FF]" />,
      color: 'from-[#6C5CE7]/20 to-[#141A24]',
      current: user?.plan === 'pro',
      popular: true,
    },
  ];

  return (
    <div className="flex flex-col min-h-full w-full p-6 lg:p-10 space-y-8 lg:space-y-10 overflow-y-auto">
      {/* Integrated Header */}
      <header className="shrink-0 space-y-4 lg:space-y-6">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded-full"
        >
          <Fingerprint size={14} className="text-[#6C5CE7]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6C5CE7]">Billing Terminal</span>
        </motion.div>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-5xl font-black text-[#F0F3F8] uppercase tracking-tighter italic">Subscription Hub</h1>
            <p className="text-xs lg:text-base text-[#8E9AAF] max-w-xl opacity-70">Synchronize your intelligence tier across the Aether network.</p>
          </div>

          {/* Compact Sync Status */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 glass-card p-4 lg:py-4 lg:px-6 rounded-2xl lg:rounded-[24px]"
          >
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
              <Zap className={cn(user?.plan === 'pro' ? "text-[#00D2FF]" : "text-[#8E9AAF]")} size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-[#8E9AAF] uppercase tracking-[0.2em] mb-0.5">Active Protocol</p>
              <h3 className="text-sm font-black text-[#F0F3F8] uppercase tracking-tight">{user?.plan === 'pro' ? 'Neural Pro' : 'Basic Link'}</h3>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Terminal Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-10 min-h-0">
        {/* Usage & Overview Rail */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {user?.plan !== 'pro' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-6"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Neural Capacity</span>
                  <span className="text-base font-black text-[#F0F3F8] tracking-tighter">{user?.monthlyUploadCount || 0} / 3</span>
                </div>
                <div className="h-2.5 bg-[#0B0E14] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((user?.monthlyUploadCount || 0) / 3) * 100, 100)}%` }} 
                    className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] rounded-full"
                  />
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <Clock size={10} className="text-[#8E9AAF]" />
                  <p className="text-[9px] text-[#8E9AAF] font-medium uppercase tracking-widest">Monthly Cycle Reset</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="glass-card p-6 flex flex-col justify-center items-center text-center space-y-3">
             <ShieldCheck size={24} className="text-[#00E5A0] opacity-50" />
             <p className="text-[10px] font-black text-[#8E9AAF] uppercase tracking-[0.3em]">Encrypted Channel</p>
             <p className="text-[9px] text-[#8E9AAF] leading-relaxed italic">Biometric link verified via Neural Protocol 7.4. All transactions are quantum-secured.</p>
          </div>
        </div>

        {/* Plan Grid - Fits Viewport */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pb-10 lg:pb-0">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "glass-card p-8 lg:p-10 flex flex-col relative group transition-all duration-500",
                plan.current 
                  ? "border-[#6C5CE7]/50 shadow-[0_0_40px_-20px_rgba(108,92,231,0.2)]" 
                  : "hover:border-white/20"
              )}
            >
              {plan.popular && (
                <div className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-2 px-3 py-1 bg-[#6C5CE7] rounded-full">
                  <Star size={10} fill="currentColor" className="text-white" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">Optimal</span>
                </div>
              )}

              <div className="flex items-center gap-4 mb-8 lg:mb-10">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
                  {React.cloneElement(plan.icon as React.ReactElement, { size: 28 } as any)}
                </div>
                <div>
                  <h3 className="text-xl lg:text-2xl font-black text-[#F0F3F8] uppercase italic leading-none">{plan.name}</h3>
                  <p className="text-[10px] text-[#8E9AAF] font-medium leading-relaxed mt-1">{plan.description}</p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl lg:text-5xl font-black text-[#F0F3F8]">${plan.price}</span>
                <span className="text-[10px] font-bold text-[#8E9AAF] uppercase tracking-widest opacity-40">/ Neuro Cycle</span>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <CheckCircle2 size={14} className="text-[#00E5A0] mt-0.5 shrink-0" />
                    <span className="text-xs text-[#8E9AAF] font-medium opacity-80">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={plan.current || isUpgrading}
                onClick={() => plan.id === 'pro' && handleUpgrade()}
                className={cn(
                  "w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3",
                  plan.current
                    ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                    : idx === 1 
                      ? "bg-[#6C5CE7] text-white hover:bg-[#7d6df2] shadow-xl shadow-[#6C5CE7]/20" 
                      : "bg-white/5 text-[#F0F3F8] hover:bg-white/10 border border-white/10"
                )}
              >
                {isUpgrading && plan.id === 'pro' ? 'Syncing...' : (plan.current ? 'Current Configuration' : `Initialize ${plan.name}`)}
                {!plan.current && !isUpgrading && <ArrowRight size={14} />}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

