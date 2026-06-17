import React, { useState } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSendMessage, onTyping, disabled, placeholder }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    onTyping(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <button 
        type="button" 
        className="p-2.5 text-[#8E9AAF] hover:text-[#6C5CE7] hover:bg-[#6C5CE7]/10 rounded-xl transition-all"
      >
        <Paperclip size={20} />
      </button>
      
      <div className="flex-grow relative group">
        <input 
          type="text" 
          value={input}
          disabled={disabled}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping(e.target.value.length > 0);
          }}
          onBlur={() => onTyping(false)}
          placeholder={disabled ? "Chat unavailable" : (placeholder || "Type a message...")} 
          className={cn(
            "w-full bg-[#0B0E14] border border-white/5 rounded-2xl py-3.5 px-5 text-sm outline-none transition-all text-[#F0F3F8] placeholder:text-white/20",
            !disabled && "focus:border-[#6C5CE7]/40 group-hover:border-white/10"
          )}
        />
        <button 
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#8E9AAF] hover:text-[#F5B042]"
        >
          <Smile size={18} />
        </button>
      </div>

      <button 
        type="submit"
        disabled={!input.trim() || disabled}
        className={cn(
          "w-12 h-12 bg-[#6C5CE7] text-white rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 shrink-0",
          (!input.trim() || disabled) ? "opacity-50 grayscale cursor-not-allowed" : "shadow-[#6C5CE7]/20 hover:bg-[#6C5CE7]/90"
        )}
      >
        <Send size={18} />
      </button>
    </form>
  );
}
