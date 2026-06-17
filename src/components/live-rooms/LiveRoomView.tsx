import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Users, Send, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { RoomParticipant, RoomMessage } from '../../hooks/useLiveRoom';
import { PomodoroTimer } from './PomodoroTimer';

interface LiveRoomViewProps {
  roomName: string;
  participants: RoomParticipant[];
  messages: RoomMessage[];
  timer: { minutes: number; seconds: number; isRunning: boolean };
  isConnected: boolean;
  typingUsers: { [key: string]: string };
  isNudged: boolean;
  currentUserId?: string;
  onLeave: () => void;
  onSendNudge: (userId: string) => void;
  onSendMessage: (text: string) => void;
  onToggleTimer: () => void;
  onTyping: () => void;
}

export function LiveRoomView({
  roomName,
  participants,
  messages,
  timer,
  isConnected,
  typingUsers,
  isNudged,
  currentUserId,
  onLeave,
  onSendNudge,
  onSendMessage,
  onToggleTimer,
  onTyping
}: LiveRoomViewProps) {
  const [chatInput, setChatInput] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput);
      setChatInput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    onTyping();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: isNudged ? [0, -10, 10, -10, 10, 0] : 0
      }} 
      transition={{ duration: 0.4 }}
      className="bg-[#0B0E14] min-h-[650px] lg:h-[800px] flex flex-col rounded-[32px] overflow-hidden relative shadow-2xl border border-white/5"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#141A24] to-[#0B0E14] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6C5CE7]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#00D2FF]/5 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Header */}
      <div className="p-6 md:p-8 flex justify-between items-center bg-black/20 backdrop-blur-md relative z-20 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-3 w-3">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5A0] opacity-75"></span>}
            <span className={cn("relative inline-flex rounded-full h-3 w-3", isConnected ? "bg-[#00E5A0]" : "bg-red-500")}></span>
          </div>
          <div>
            <h2 className="text-white font-black text-xl md:text-2xl tracking-tight">{roomName}</h2>
            <p className="text-[#00D2FF]/80 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">
              Live Session • {participants.length} Participant{participants.length !== 1 && 's'}
            </p>
          </div>
        </div>
        <button 
          onClick={onLeave} 
          className="px-4 py-2 md:px-6 md:py-2.5 bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 transition-all rounded-xl text-sm font-bold flex items-center gap-2 border border-white/10 hover:border-red-500/30"
        >
           <LogOut size={16} /> <span className="hidden sm:inline">Leave Room</span>
        </button>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start relative z-10 p-6 md:p-10 pt-4 md:pt-4 h-full">
        <div className="w-full max-w-5xl mb-8 flex-shrink-0">
          <PomodoroTimer 
            minutes={timer.minutes} 
            seconds={timer.seconds} 
            isRunning={timer.isRunning} 
            onToggle={onToggleTimer} 
          />
        </div>

        <div className="w-full max-w-5xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 flex-shrink-0">
            <AnimatePresence>
              {participants.map((p) => (
                <motion.div 
                  key={p.instanceId || p.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "bg-[#141A24]/60 aspect-[4/3] rounded-[24px] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md group shadow-xl transition-all duration-300",
                    p.isMe && "border-[#00D2FF]/30 bg-[#00D2FF]/5"
                  )}
                >
                  <div className="relative mb-3">
                    <img 
                      src={p.avatar} 
                      alt=""
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] border-[#141A24] object-cover group-hover:scale-105 transition-transform duration-500 shadow-xl" 
                    />
                    <div className="absolute inset-0 rounded-full ring-2 ring-white/10" />
                    {p.isMe && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00D2FF] rounded-full border-2 border-[#141A24] flex items-center justify-center text-[10px] font-black pointer-events-none">Me</div>}
                  </div>
                  
                  <span className="text-sm font-bold text-white tracking-wide">{p.name}</span>
                  
                  {!p.isMe && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendNudge(p.id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-[#6C5CE7]/20 hover:bg-[#6C5CE7] rounded-xl transition-all text-[#6C5CE7] hover:text-white border border-[#6C5CE7]/30 shadow-lg active:scale-95 z-20"
                      title="Nudge Peer"
                    >
                      <Bell size={14} className="hover:animate-pulse" />
                    </button>
                  )}

                  <div className="absolute bottom-3 left-3 bg-[#0B0E14]/80 backdrop-blur px-2.5 py-1 rounded-lg text-[9px] font-black uppercase text-white/70 border border-white/10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-pulse" /> 
                    Focusing
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
        </div>
      </div>

      {/* Chat Area & Controls overlayed at bottom */}
      <div className="absolute bottom-0 inset-x-0 pt-32 pb-4 px-4 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/80 to-transparent pointer-events-none flex flex-col justify-end z-30">
        
        {/* Messages List */}
        <div className="space-y-4 overflow-y-auto no-scrollbar pointer-events-auto p-4 mask-fade-top max-h-64 md:max-h-80 mb-2">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                const isSystem = msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center my-3"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                        {msg.content}
                      </span>
                    </motion.div>
                  );
                }

                return (
                  <motion.div 
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "flex items-start gap-3 max-w-[85%] md:max-w-[70%]",
                      isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <img src={msg.senderAvatar} className="w-8 h-8 rounded-full flex-shrink-0 object-cover border border-white/10" alt="" />
                    <div className={cn(
                      "backdrop-blur-xl px-4 py-3 rounded-2xl border shadow-xl",
                      isMe 
                        ? "bg-[#6C5CE7]/20 border-[#6C5CE7]/30 rounded-tr-sm text-right" 
                        : "bg-[#141A24]/90 border-white/10 rounded-tl-sm"
                    )}>
                        <div className={cn(
                          "text-[10px] font-bold mb-1 uppercase tracking-wider flex items-center gap-2",
                          isMe ? "text-[#00D2FF] justify-end" : "text-[#6C5CE7]"
                        )}>
                          {!isMe && <span>{msg.senderName}</span>}
                          <span className="text-white/20 font-medium normal-case">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && <span>{msg.senderName}</span>}
                        </div>
                        <div className="text-sm text-white/90 leading-relaxed font-medium">
                          {msg.content}
                        </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {Object.keys(typingUsers).length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-[10px] font-bold text-[#00D2FF]/60 uppercase tracking-widest pl-12"
              >
                <div className="flex gap-1 mr-1">
                  <span className="w-1.5 h-1.5 bg-[#00D2FF] rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[#00D2FF] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-[#00D2FF] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                {Object.values(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
              </motion.div>
            )}
            <div ref={messagesEndRef} />
        </div>
        
        {/* Input Bar */}
        <div className="px-4 py-3 md:px-6 md:py-4 bg-[#141A24]/90 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center gap-4 pointer-events-auto mx-2 md:mx-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <button 
            onClick={() => setShowParticipants(true)}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all relative md:hidden"
          >
            <Users size={20} />
          </button>
          
          <form onSubmit={handleSend} className="flex-1 flex items-center gap-3">
            <input 
              type="text" 
              value={chatInput}
              onChange={handleInputChange}
              placeholder="Send an encouraging message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C5CE7]/50 focus:bg-white/10 transition-all font-medium"
            />
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-[#6C5CE7] hover:bg-[#5b4bc4] disabled:opacity-50 disabled:bg-white/10 text-white rounded-xl w-12 h-12 flex items-center justify-center transition-all active:scale-95 shadow-lg shrink-0"
            >
              <Send size={18} className={chatInput.trim() ? "translate-x-0.5" : ""} />
            </button>
          </form>
        </div>
      </div>

    </motion.div>
  );
}
