import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInterfaceProps {
  chatId: string;
  type: 'private' | 'group';
  name: string;
  avatar: string;
  onBack: () => void;
  className?: string;
}

export default function ChatInterface({ chatId, type, name, avatar, onBack, className }: ChatInterfaceProps) {
  const { messages, user, sendMessage, setTyping, typingUsers, allProfiles } = useAppContext();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherProfile = allProfiles.find(p => p.id === chatId);
  const isFriend = type === 'private' ? (user?.following?.includes(chatId) && otherProfile?.following?.includes(user?.id || '')) : true;
  const isBlocked = type === 'private' && !isFriend;

  const filteredMessages = messages.filter(m => {
    if (type === 'group') return m.groupId === chatId;
    return (m.senderId === user?.id && m.receiverId === chatId) || 
           (m.senderId === chatId && m.receiverId === user?.id);
  });

  const isTyping = !!typingUsers[chatId];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isBlocked) return;
    
    if (type === 'group') {
      sendMessage(input, undefined, chatId);
    } else {
      sendMessage(input, chatId, undefined);
    }
    
    setInput('');
    setTyping(false, type === 'private' ? chatId : undefined, type === 'group' ? chatId : undefined);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBlocked) return;
    setInput(e.target.value);
    setTyping(e.target.value.length > 0, type === 'private' ? chatId : undefined, type === 'group' ? chatId : undefined);
  };

  return (
    <div className={cn("glass-card p-0 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-surface/30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-surface-alt rounded-full transition-all active:scale-90 lg:hidden">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={avatar} alt={name} className="w-10 h-10 rounded-full border border-border shadow-sm object-cover" />
              <span className={cn(
                "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background",
                isFriend || type === 'group' ? "bg-green-500" : "bg-text-muted"
              )} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main leading-tight">{name}</p>
              <p className="text-[11px] text-text-muted flex items-center gap-1">
                {isTyping ? <span className="text-primary font-medium animate-pulse italic">typing...</span> : (type === 'group' ? 'Group Chat' : (isBlocked ? 'Mutual friends only' : 'Active now'))}
              </p>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-surface-alt rounded-full transition-colors text-text-muted">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages */}
      {/* ... keeping the same ... */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-surface/5">
        {filteredMessages.map((m, idx) => {
          const isMe = m.senderId === user?.id;
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: isMe ? 20 : -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              key={m.id || idx}
              className={cn(
                "flex flex-col max-w-[85%]",
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                isMe ? "bg-primary text-white rounded-tr-none" : "bg-surface-alt text-text-main rounded-tl-none border border-border"
              )}>
                {m.content}
              </div>
              <span className="text-[11px] text-text-muted mt-1 px-1">
                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-surface/30">
        {isBlocked ? (
          <div className="bg-surface-alt/50 border border-border rounded-xl p-3 text-center">
            <p className="text-xs text-text-muted">You can only message friends who also follow you back.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button type="button" className="p-2 text-text-muted hover:bg-surface-alt rounded-xl transition-colors">
              <Paperclip size={20} />
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onBlur={() => setTyping(false, type === 'private' ? chatId : undefined, type === 'group' ? chatId : undefined)}
                placeholder="Type your message..."
                className="w-full bg-surface-alt/50 border border-border rounded-2xl py-3 pl-4 pr-12 text-sm outline-none focus:border-primary/30 transition-all text-text-main"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                <Smile size={18} />
              </button>
            </div>
            <button 
              type="submit"
              disabled={!input.trim()}
              className="p-3 bg-primary text-white rounded-2xl disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
