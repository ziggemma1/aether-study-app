import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCheck } from 'lucide-react';
import { Message } from '../../hooks/useMessaging';

interface MessageBubbleProps {
  msg: Message;
  isOwn: boolean;
  showSenderName?: boolean;
}

export function MessageBubble({ msg, isOwn, showSenderName }: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex flex-col gap-1 max-w-[85%] animate-in fade-in slide-in-from-bottom-1 duration-300",
      isOwn ? "ml-auto" : "mr-auto"
    )}>
      {showSenderName && !isOwn && (
        <p className="text-[10px] font-black text-[#6C5CE7] ml-2 uppercase tracking-widest">{msg.fromUserName || 'Member'}</p>
      )}
      
      <div className={cn(
        "px-4 py-3 rounded-2xl text-sm shadow-sm relative group",
        isOwn 
          ? "bg-[#6C5CE7] text-white rounded-tr-none" 
          : "bg-[#1A2230] border border-white/5 text-[#F0F3F8] rounded-tl-none"
      )}>
        <p className="leading-relaxed">{msg.text}</p>
        
        <div className={cn(
          "flex items-center gap-1 mt-1 opacity-40 text-[9px] font-medium",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isOwn && (
            <CheckCheck size={10} className={cn(msg.isRead ? "text-[#00D2FF]" : "text-white/40")} />
          )}
        </div>
      </div>
    </div>
  );
}
