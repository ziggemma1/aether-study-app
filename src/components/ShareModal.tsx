import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Share2, Send, MessageCircle, Twitter } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  url
}) => {
  const { showToast } = useAppContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={24} />,
      color: 'bg-[#25D366]',
      href: `https://wa.me/?text=${encodeURIComponent(`${title}: ${url}`)}`
    },
    {
      name: 'Telegram',
      icon: <Send size={20} />,
      color: 'bg-[#0088cc]',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: 'X (Twitter)',
      icon: <Twitter size={20} />,
      color: 'bg-[#000000]',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Studying ${title} on Aether Study!`)}&url=${encodeURIComponent(url)}`
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-surface w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl border border-border/10"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main">Share Guide</h3>
                <p className="text-xs text-text-muted">Spread the knowledge with friends</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-alt rounded-full text-text-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Copy Link Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Quick Link</label>
              <div className="flex items-center gap-2 p-2 bg-background rounded-2xl border border-border/50 group focus-within:border-primary/50 transition-colors">
                <input 
                  type="text" 
                  readOnly 
                  value={url}
                  className="bg-transparent flex-grow text-xs font-mono px-3 outline-none text-text-main overflow-hidden text-ellipsis whitespace-nowrap"
                />
                <button
                  onClick={handleCopy}
                  className={cn(
                    "p-3 rounded-xl transition-all flex items-center gap-2",
                    copied ? "bg-green-500 text-white" : "bg-primary text-white hover:scale-105"
                  )}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  <span className="text-xs font-bold mr-1">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-1">Share To</label>
              <div className="grid grid-cols-3 gap-3">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-alt border border-border group hover:border-primary/30 transition-all hover:-translate-y-1"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                      link.color
                    )}>
                      {link.icon}
                    </div>
                    <span className="text-[10px] font-bold text-text-muted">{link.name}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <p className="text-[10px] leading-relaxed text-center text-text-muted italic opacity-60">
                Join our community of over 50k active students hacking their way to success.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
