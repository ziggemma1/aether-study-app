import React from 'react';
import { Trophy, Crown, Loader2, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { LeaderboardCard } from '../components/leaderboard/LeaderboardCard';
import { LeaderboardStats } from '../components/leaderboard/LeaderboardStats';
import { OptInToggle } from '../components/leaderboard/OptInToggle';
import { useLeaderboard } from '../hooks/useLeaderboard';

export default function Leaderboard() {
  const { user, setUser, showToast } = useAppContext();
  const [optedIn, setOptedIn] = React.useState(user?.optedInLeaderboard || false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const {
    leaderboard,
    totalUsers,
    currentUserRank,
    topScore,
    weekEnding,
    loading,
    refetch
  } = useLeaderboard();

  const toggleOptIn = async () => {
    setIsUpdating(true);
    try {
      const response = await api.post('/users/leaderboard/toggle');
      const newStatus = response.data.optedInLeaderboard;
      setOptedIn(newStatus);
      if (setUser && user) {
        setUser({ ...user, optedInLeaderboard: newStatus });
      }
      showToast(newStatus ? 'Entered the global arena! 🚀' : 'Left the arena. Your rank is now private.', 'success');
      refetch();
    } catch (error) {
      showToast('Status change failed. Try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 relative select-none min-h-screen">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[#0B0E14] -z-10" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#6C5CE7]/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
      
      {!optedIn ? (
        <div className="max-w-2xl mx-auto pt-10 md:pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <OptInToggle 
              isOptedIn={false} 
              onToggle={toggleOptIn} 
              isLoading={isUpdating} 
            />
          </motion.div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <PageHeader 
            title="Global Leaderboard" 
            subtitle="Real-time academic performance rankings across the Aether network."
            action={
              <button 
                onClick={toggleOptIn}
                disabled={isUpdating}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-red-400 transition-colors flex items-center gap-2"
              >
                {isUpdating ? <Loader2 size={12} className="animate-spin" /> : 'Leave Arena'}
              </button>
            }
          />

          <LeaderboardStats 
            totalUsers={totalUsers}
            yourRank={currentUserRank}
            topScore={topScore}
            weekEnding={weekEnding}
          />

          <div className="mt-12 relative">
             <div className="flex items-center justify-between mb-6 px-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
                   <Sparkles size={16} className="text-[#00D2FF]" /> Top Performers
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/30 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                   <Trophy size={12} className="text-amber-400" /> Season 1 Active
                </div>
             </div>

             {loading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-[#141A24]/40 rounded-[32px] border border-white/5 backdrop-blur-md">
                   <Loader2 size={40} className="text-[#6C5CE7] animate-spin mb-6" />
                   <p className="text-white/40 font-bold tracking-widest uppercase text-xs">Syncing rankings...</p>
                </div>
             ) : (
                <div className="space-y-4">
                   <AnimatePresence mode="popLayout">
                      {leaderboard.map((learner, idx) => (
                        <LeaderboardCard 
                          key={learner.id}
                          rank={idx + 1}
                          user={learner}
                          isCurrentUser={learner.id === (user?.id || (user as any)?._id)}
                          index={idx}
                        />
                      ))}
                   </AnimatePresence>
                </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
