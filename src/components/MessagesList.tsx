import React, { useState } from 'react';
import { Search, Plus, MoreHorizontal, MessageSquare, Phone, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import ChatInterface from './ChatInterface';
import { motion, AnimatePresence } from 'motion/react';

interface MessagesListProps {
  className?: string;
}

export default function MessagesList({ className }: MessagesListProps) {
  const { messages, user, groups, typingUsers, allProfiles } = useAppContext();
  const [selectedChat, setSelectedChat] = useState<{ id: string, type: 'private' | 'group', name: string, avatar: string } | null>(null);

  // Derive contacts from messages and groups
  const chatList = React.useMemo(() => {
    if (!user) return [];
    
    const list: any[] = [];
    
    // Add Groups
    groups.forEach(g => {
      const lastMsg = messages.filter(m => m.groupId === g.id).slice(-1)[0];
      list.push({
        id: g.id,
        name: g.name,
        avatar: g.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${g.name}`,
        type: 'group',
        lastMsg: lastMsg?.content || 'No messages yet',
        isTyping: !!typingUsers[g.id],
        timestamp: lastMsg?.createdAt || g.createdAt
      });
    });

    // Add Private Chats
    const contactMap = new Map();
    messages.filter(m => !m.groupId).forEach(m => {
      const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
      if (!contactMap.has(otherId) && otherId) {
        const otherProfile = allProfiles.find(p => p.id === otherId);
        const isFriend = user?.following?.includes(otherId) && otherProfile?.following?.includes(user.id);
        
        contactMap.set(otherId, {
          id: otherId,
          name: m.senderName || otherProfile?.name || 'User',
          avatar: m.senderAvatar || otherProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`,
          type: 'private',
          lastMsg: m.content,
          isTyping: !!typingUsers[otherId],
          timestamp: m.createdAt,
          isFriend
        });
      }
    });
    
    contactMap.forEach(c => list.push(c));
    
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages, user, groups, typingUsers]);

  if (selectedChat) {
    return (
      <ChatInterface 
        chatId={selectedChat.id} 
        type={selectedChat.type} 
        name={selectedChat.name} 
        avatar={selectedChat.avatar}
        onBack={() => setSelectedChat(null)}
        className={className}
      />
    );
  }

  return (
    <div className={cn("glass-card p-6 flex flex-col h-full", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center text-text-muted">
            <MessageSquare size={20} />
          </div>
          <h2 className="text-lg font-bold text-text-main">Messages</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-surface-alt rounded-full transition-colors border border-border text-text-muted">
            <Plus size={18} />
          </button>
          <button className="p-1.5 hover:bg-surface-alt rounded-full transition-colors border border-border text-text-muted">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input 
          type="text" 
          placeholder="Search items..." 
          className="w-full bg-surface-alt/50 border border-border rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/30 transition-all text-text-main placeholder:text-text-muted"
        />
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {chatList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-text-muted">
            <MessageSquare size={32} className="mb-2 opacity-20" />
            <p className="text-xs">No messages yet</p>
          </div>
        ) : (
          chatList.map((chat) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={chat.id} 
              onClick={() => setSelectedChat(chat)}
              className="flex items-center justify-between group cursor-pointer hover:bg-surface-alt/30 p-2 -m-2 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={chat.avatar} 
                    alt={chat.name} 
                    className="w-12 h-12 rounded-full border-2 border-border shadow-sm object-cover"
                  />
                  {chat.type === 'group' && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] text-white border-2 border-background">
                      <Users size={10} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-main mb-0.5 truncate">{chat.name}</p>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {chat.type === 'private' && !chat.isFriend && (
                      <span className="shrink-0 text-[8px] bg-surface-alt text-text-muted px-1 rounded uppercase font-bold">Not Friend</span>
                    )}
                    <p className={cn(
                      "text-xs truncate",
                      chat.isTyping ? "text-primary italic font-medium" : "text-text-muted"
                    )}>
                      {chat.isTyping ? "typing..." : chat.lastMsg}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-text-muted whitespace-nowrap">
                  {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button className="p-1.5 bg-surface-alt hover:bg-surface-alt/80 rounded-lg text-text-muted transition-colors border border-border">
                    <MessageSquare size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

