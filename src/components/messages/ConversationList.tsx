import React from 'react';
import { cn } from '../../lib/utils';

export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  time?: string;
  unread: number;
  type: 'private' | 'group';
  isTyping?: boolean;
  isFriend?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conv: Conversation) => void;
  isLoading?: boolean;
}

export function ConversationList({ conversations, selectedId, onSelect, isLoading }: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-[#1A2230]" />
            <div className="flex-grow space-y-2">
              <div className="h-3 w-24 bg-[#1A2230] rounded-full" />
              <div className="h-2 w-full bg-[#1A2230] rounded-full opacity-50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2">
      {conversations.map((chat) => (
        <div 
          key={chat.id} 
          onClick={() => onSelect(chat)}
          className={cn(
            "flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border",
            selectedId === chat.id 
              ? "bg-[#6C5CE7]/10 border-[#6C5CE7]/30 shadow-lg" 
              : "bg-[#141A24] border-white/5 hover:border-white/10"
          )}
        >
          <div className="relative">
            <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full border border-white/10 object-cover" />
            {chat.isTyping && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#6C5CE7] rounded-full animate-pulse border-2 border-[#141A24]" />
            )}
            <div className={cn(
              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#141A24]",
              chat.type === 'group' ? "bg-blue-400" : "bg-[#00E5A0]"
            )} />
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-[#F0F3F8] truncate">{chat.name}</p>
              {chat.time && (
                <span className="text-[10px] text-[#8E9AAF]">
                  {new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-xs truncate max-w-[140px]",
                chat.isTyping ? "text-[#6C5CE7] italic font-medium" : "text-[#8E9AAF]"
              )}>
                {chat.isTyping ? 'Typing...' : chat.lastMsg}
              </p>
              {chat.unread > 0 && (
                <span className="bg-[#6C5CE7] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-lg shadow-[#6C5CE7]/20">
                  {chat.unread}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
