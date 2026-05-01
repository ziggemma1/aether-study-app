import React from 'react';
import { Trophy, Clock, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import api from '../services/api';

export default function Leaderboard() {
  const { allProfiles, user, showToast, setUser } = useAppContext();
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
        .sort((a, b) => (b.totalStudyTime || 0) - (a.totalStudyTime || 0))
        .slice(0, 10)
    : [];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <header className="mb-10 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 mb-6 border border-yellow-500/20">
          <Trophy size={36} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-2">Focus Leaderboards</h1>
        <p className="text-text-muted mb-6 max-w-md">Weekly ranking based on total study time. Compete or cheer others on!</p>
        
        <button 
          onClick={toggleOptIn}
          className={cn(
            "px-6 py-2 rounded-full font-bold transition-all text-sm shadow-md",
            optedIn 
              ? "bg-surface border-border border text-text-muted hover:bg-surface-alt"
              : "bg-primary text-white shadow-primary/20 hover:scale-105"
          )}
        >
          {optedIn ? "Opt Out" : "Opt In to Weekly Rank"}
        </button>
      </header>

      {optedIn ? (
        <div className="space-y-4">
          <div className="glass-card p-4 overflow-hidden relative">
            <div className="flex items-center justify-between px-2 pb-4 border-b border-border text-xs font-bold text-text-muted uppercase tracking-widest">
               <span>Rank & Learner</span>
               <span>Focus Time</span>
            </div>
            
            <div className="mt-4 space-y-2">
               {topLearners.map((learner, idx) => {
                 const isMe = (learner._id || learner.id) === user?.id;
                 const rank = idx + 1;
                 const hours = Math.floor((learner.totalStudyTime || 0) / 60) || 0;
                 return (
                   <motion.div 
                     key={learner.id || idx}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     className={cn(
                       "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all",
                       isMe ? "bg-primary/10 border-primary/30" : "bg-surface border-transparent"
                     )}
                   >
                      <div className="flex items-center gap-3 w-1/2 min-w-0">
                         <div className={cn(
                           "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0",
                           rank === 1 ? "bg-yellow-500 text-white" : rank === 2 ? "bg-gray-300 text-slate-800" : rank === 3 ? "bg-amber-600 text-white" : "bg-surface-alt text-text-muted"
                         )}>
                            {rank}
                         </div>
                         <div className="w-10 h-10 rounded-full border border-border/50 shrink-0 bg-primary/10 overflow-hidden">
                            {learner.avatar ? <img src={learner.avatar} className="w-full h-full object-cover" /> : null}
                         </div>
                         <div className="min-w-0">
                            <h4 className="font-bold text-text-main truncate">{isMe ? "You" : learner.name || 'User'}</h4>
                            <p className="text-xs text-text-muted truncate">@{learner.handle || (learner.name?.toLowerCase().replace(/\s+/g,'_') + '123')}</p>
                         </div>
                      </div>
                      
                      <div className="text-right">
                         <div className="flex items-center gap-1.5 text-text-main font-bold">
                           <Clock size={14} className="text-primary hidden sm:block" /> {hours}h {(learner.totalStudyTime || 0) % 60}m
                         </div>
                      </div>
                   </motion.div>
                 )
               })}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center flex items-center justify-center border-dashed">
          <p className="text-text-muted text-lg font-medium">You must opt in to view the leaderboard.</p>
        </div>
      )}
    </div>
  );
}
