import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { chatWithTutorOnClient } from '../lib/gemini';
import { useAppContext } from '../context/AppContext';

interface TutorChatProps {
  materialTitle: string;
  materialContent: string;
}

export const TutorChat: React.FC<TutorChatProps> = ({ materialTitle, materialContent }) => {
  const { user } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([
    { role: 'model', parts: [{ text: `Hi! I'm your AI Tutor for "${materialTitle}". Need any help understanding the material?` }] }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    
    setMessages(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    setIsLoading(true);

    try {
      // Exclude the initial greeting from history if we want, but it's fine to pass.
      const history = messages.slice(1); 
      const response = await chatWithTutorOnClient(materialTitle, materialContent, history, userMsg, user?.language);
      
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Oops, something went wrong: ${error.message}` }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-primary to-accent text-white rounded-full shadow-2xl flex items-center justify-center z-[100] border-2 border-white/20"
          >
            <MessageCircle size={24} className="sm:hidden" />
            <MessageCircle size={28} className="hidden sm:block" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] md:w-[400px] h-[500px] max-h-[80vh] glass-card z-[101] flex flex-col overflow-hidden shadow-2xl border-t-4 border-t-primary"
          >
            <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-text-main text-sm">AI Tutor</h3>
                  <p className="text-[10px] text-primary font-medium tracking-widest uppercase">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-text-muted hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-sm" 
                      : "bg-surface border border-border text-text-main rounded-tl-sm shadow-sm"
                  )}>
                    {msg.parts[0].text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-border text-text-main rounded-2xl rounded-tl-sm p-4 w-16 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-surface border-t border-border">
              <div className="relative flex items-center">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask a question..."
                  className="w-full bg-background border border-border rounded-2xl py-3 pl-4 pr-12 text-sm text-text-main placeholder-text-muted outline-none focus:border-primary transition-colors resize-none h-[48px]"
                  style={{ minHeight: '48px', overflowY: 'hidden' }}
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-2 p-2 text-primary hover:bg-primary/10 rounded-xl disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
