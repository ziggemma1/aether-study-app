import React from 'react';
import { UserCheck, UserX, Zap } from 'lucide-react';
import { FriendRequest } from '../../hooks/useFriendRequests';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface FriendRequestItemProps {
  request: FriendRequest;
  onRespond: (id: string, status: 'accepted' | 'declined') => void;
  isLoading?: boolean;
}

export function FriendRequestItem({ request, onRespond, isLoading }: FriendRequestItemProps) {
  const sender = request.senderId;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-[#141A24] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-[#6C5CE7]/30 transition-all shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={sender.avatar} alt={sender.name} className="w-10 h-10 rounded-full border border-white/10" />
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[8px] font-black px-1 rounded-full border border-[#141A24] flex items-center gap-0.5">
             <Zap size={8} fill="currentColor" /> {sender.streak || 0}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-[#F0F3F8]">{sender.name}</p>
          <p className="text-[10px] text-[#8E9AAF] font-medium uppercase tracking-widest">Wants to study together</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onRespond(request._id, 'accepted')}
          disabled={isLoading}
          className="p-2 bg-[#00E5A0]/10 text-[#00E5A0] hover:bg-[#00E5A0] hover:text-black rounded-xl transition-all shadow-sm"
          title="Accept"
        >
          <UserCheck size={18} />
        </button>
        <button 
          onClick={() => onRespond(request._id, 'declined')}
          disabled={isLoading}
          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
          title="Decline"
        >
          <UserX size={18} />
        </button>
      </div>
    </motion.div>
  );
}
