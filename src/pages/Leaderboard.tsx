import React from 'react';
import { Trophy } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

// Reusable elegant UI components
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { UserAvatar } from '../components/ui/UserAvatar';
import { TruncatedText } from '../components/ui/TruncatedText';

export default function Leaderboard() {
  const { allProfiles, user, showToast, setUser, t } = useAppContext();
  const [optedIn, setOptedIn] = React.useState(user?.optedInLeaderboard || false);

  const toggleOptIn = async () => {
    try {
      const response = await api.post('/users/leaderboard/toggle');
      setOptedIn(response.data.optedInLeaderboard);
      if (setUser && user) {
        setUser({ ...user, optedInLeaderboard: response.data.optedInLeaderboard });
      }
      showToast(response.data.optedInLeaderboard ? 'Projecting your glory to the world!' : 'Quietly stepping back into the shadows.');
    } catch (error) {
      showToast('Status change failed. Try again.', 'error');
    }
  };

  const topLearners = Array.isArray(allProfiles) 
    ? [...allProfiles].filter(p => p.optedInLeaderboard || (user && (p._id === user.id || p.id === user.id)))
        .sort((a, b) => (b.aetherPoints || 0) - (a.aetherPoints || 0))
        .slice(0, 10)
    : [];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24 select-none">
      <PageHeader 
        title="Leaderboard" 
        subtitle="Weekly ranking based on active recall points. Compete and climb the ranks!"
        action={
          <button 
            onClick={toggleOptIn}
            className={cn(
              "px-4 py-2 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all btn-ripple shadow-soft border",
              optedIn 
                ? "bg-surface text-text-muted border-border/10 hover:bg-surface-alt"
                : "bg-primary text-white border-primary/20 hover:scale-105"
            )}
          >
            {optedIn ? "Opt Out" : "Opt In"}
          </button>
        }
      />

      {optedIn ? (
        <div className="space-y-4 mt-6">
          <div className="bg-surface border border-border/10 p-4 rounded-3xl overflow-hidden relative">
            <div className="flex items-center justify-between px-2 pb-3.5 border-b border-border/10 text-[9px] font-black text-text-muted uppercase tracking-widest">
               <span>Rank & Learner</span>
               <span>Aether Points</span>
            </div>
            
            <div className="mt-3 space-y-2">
               {topLearners.map((learner, idx) => {
                 const isMe = (learner._id || learner.id) === user?.id;
                 const rank = idx + 1;
                 const points = learner.aetherPoints || 0;
                 return (
                   <motion.div 
                     key={learner.id || idx}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     className={cn(
                       "flex items-center justify-between p-3 rounded-2xl border transition-all",
                       isMe ? "bg-primary/10 border-primary/30" : "bg-surface-alt/20 border-transparent hover:border-border/5"
                     )}
                   >
                      <div className="flex items-center gap-3 w-3/4 min-w-0">
                         <div className={cn(
                           "w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 select-none",
                           rank === 1 ? "bg-amber-500 text-neutral-950 font-sans shadow-lg shadow-amber-500/20" : 
                           rank === 2 ? "bg-slate-300 text-slate-800 font-sans" : 
                           rank === 3 ? "bg-amber-700 text-white font-sans" : 
                           "bg-surface-alt text-text-muted text-[10px]"
                         )}>
                            {rank === 1 ? "👑" : rank}
                         </div>
                         
                         <UserAvatar 
                           name={learner.name || 'User'} 
                           avatarUrl={learner.avatar} 
                           size="sm"
                         />

                         <div className="min-w-0">
                            <h4 className="font-bold text-text-main text-xs truncate">
                              <TruncatedText text={isMe ? `${learner.name || 'Student'} (You)` : learner.name || 'User'} maxLength={18} />
                            </h4>
                            <p className="text-[10px] text-text-muted truncate">
                              @{learner.handle || (learner.name?.toLowerCase().replace(/\s+/g,'_') + '123')}
                            </p>
                         </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                         <div className="flex items-center gap-1 text-text-main font-black text-xs">
                            <span className="text-primary tracking-tighter">⚡</span> {points.toLocaleString()}
                         </div>
                      </div>
                   </motion.div>
                 )
               })}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState 
          title="Join the Leaderboard Arena" 
          message="Opt in to calculate and project your daily active study recall scores and compete on WAEC/JAMB modules." 
          actionLabel="Opt In Now"
          onAction={toggleOptIn}
          icon={<Trophy size={24} />}
        />
      )}
    </div>
  );
}
