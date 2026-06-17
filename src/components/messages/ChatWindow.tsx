import React, { useEffect, useRef } from 'react';
import { Phone, Video, MoreHorizontal, MessageSquare, ArrowLeft, Loader2, Smile } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Message } from '../../hooks/useMessaging';
import { motion, AnimatePresence } from 'motion/react';

interface ChatWindowProps {
  chat: { id: string, name: string, avatar: string, type: 'private' | 'group' } | null;
  messages: Message[];
  isTyping: boolean;
  isConnected: boolean;
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onTyping: (status: boolean) => void;
  onBack?: () => void;
  isBlocked?: boolean;
}

export function ChatWindow({ 
  chat, 
  messages, 
  isTyping, 
  isConnected, 
  currentUserId, 
  onSendMessage, 
  onTyping,
  onBack,
  isBlocked
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!chat) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-[#1A2230] rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
          <MessageSquare size={36} className="text-[#6C5CE7] opacity-20" />
        </div>
        <h2 className="text-xl font-black text-[#F0F3F8] mb-2 uppercase tracking-tighter">Your Intelligence Hub</h2>
        <p className="text-sm text-[#8E9AAF] max-w-[240px]">Select a neural link from the left to start real-time data transmission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#141A24]/30 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-xl text-[#8E9AAF] sm:hidden transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative shrink-0">
            <img src={chat.avatar} alt={chat.name} className="w-11 h-11 rounded-full border border-white/10" />
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#141A24]",
              isConnected ? "bg-[#00E5A0]" : "bg-red-500 animate-pulse"
            )} />
          </div>
          
          <div className="min-w-0">
            <h2 className="text-sm font-black text-[#F0F3F8] truncate leading-tight uppercase tracking-tight">{chat.name}</h2>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              isTyping ? "text-[#6C5CE7]" : "text-[#8E9AAF]"
            )}>
              {isTyping ? 'Transmitting...' : (isConnected ? 'Active Link' : 'Re-establishing...')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[#8E9AAF] transition-all border border-white/5">
            <Phone size={18} />
          </button>
          <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[#8E9AAF] transition-all border border-white/5">
            <Video size={18} />
          </button>
          <button className="p-2.5 hover:bg-white/5 rounded-xl text-[#8E9AAF] transition-all">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-10"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Smile size={32} className="text-white/10" />
              </div>
              <p className="text-xs font-black text-white/10 uppercase tracking-[0.3em]">No message history</p>
            </motion.div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble 
                key={msg._id || idx}
                msg={msg}
                isOwn={msg.fromUserId === currentUserId}
                showSenderName={chat.type === 'group'}
              />
            ))
          )}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-[10px] font-black text-[#6C5CE7] ml-2 animate-pulse uppercase tracking-widest"
            >
              <Loader2 size={12} className="animate-spin" />
              Link active...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 sm:p-6 border-t border-white/5">
        {isBlocked ? (
          <div className="bg-[#1A2230]/50 border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-[#8E9AAF]">Security block: Exchange mutual follow to enable link.</p>
          </div>
        ) : (
          <MessageInput 
            onSendMessage={onSendMessage}
            onTyping={onTyping}
            placeholder={`Message ${chat.name}...`}
          />
        )}
      </div>
    </div>
  );
}
