import React, { useState, useRef, useEffect } from 'react';
import { useNotifications, NotificationItem } from '../hooks/useNotifications';
import { Bell, Sparkles, Trophy, UserPlus, Info, Check, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, refetch } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus size={14} className="text-[#00D2FF]" />;
      case 'streak_milestone':
        return <Trophy size={14} className="text-amber-500" />;
      case 'quiz_complete':
        return <Sparkles size={14} className="text-primary" />;
      default:
        return <Info size={14} className="text-text-muted" />;
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    await markAsRead(notif.id);
    setIsOpen(false);
    
    // Route redirects according to notification context
    if (notif.type === 'friend_request') {
      navigate('/community');
    } else if (notif.type === 'quiz_complete' || notif.type === 'streak_milestone') {
      navigate('/reports');
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* Circle Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-surface-alt/75 hover:bg-surface-alt/100 border border-border/80 text-text-muted hover:text-text-main rounded-xl transition-all relative flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20 select-none cursor-pointer"
        id="notification-bell-trigger"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center px-1 border border-surface leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-80 bg-surface border border-border/10 rounded-2xl shadow-xl z-50 overflow-hidden pointer-events-auto"
            id="notification-bell-panel"
          >
            {/* Header Area */}
            <div className="p-3.5 bg-surface-alt/30 border-b border-border/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                  Alerts {unreadCount > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                </h4>
                <p className="text-[9px] text-text-muted mt-0.5">Systems sync & active metrics</p>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-[9px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1"
                >
                  <Check size={10} /> Read All
                </button>
              )}
            </div>

            {/* List Item Entries */}
            <div className="max-h-[280px] overflow-y-auto no-scrollbar divide-y divide-border/5">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "p-3.5 flex gap-3 cursor-pointer hover:bg-surface-alt/30 transition-all text-left",
                      !notif.read && "bg-primary/5 border-l-2 border-primary"
                    )}
                  >
                    <div className="w-7 h-7 bg-surface-alt border border-border/5 rounded-lg flex items-center justify-center shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className={cn("text-[11px] leading-relaxed text-text-main", !notif.read ? "font-bold text-text-main" : "text-text-muted")}>
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-text-muted mt-1 block font-mono">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <Info size={24} className="text-text-muted opacity-30 mb-2" />
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">All caught up!</p>
                  <p className="text-[9px] text-text-muted/75 mt-0.5 max-w-[180px]">No unread system alerts or study warnings.</p>
                </div>
              )}
            </div>
            
            {/* View Full History redirect/refresh */}
            <div className="p-2 border-t border-border/10 bg-surface-alt/10 text-center">
              <button 
                onClick={() => { setIsOpen(false); refetch(); }}
                className="w-full text-[9px] font-bold text-text-muted hover:text-text-main uppercase tracking-widest py-1 transition-colors"
              >
                Sync with Cloud Server
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
