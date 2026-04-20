import React from 'react';
import { Bell, Check, Trash2, Clock, Info, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'ai';
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: 'New Study Material',
    message: 'Dr. Adebayo uploaded "Advanced Calculus - Week 4" to your Math course.',
    time: '2 minutes ago',
    type: 'info',
    read: false,
  },
  {
    id: 2,
    title: 'AI Insight Ready',
    message: 'Your new AI summary for Physics notes is ready.',
    time: '1 hour ago',
    type: 'ai',
    read: false,
  },
  {
    id: 3,
    title: 'Quiz Completed',
    message: 'You scored 92% on the Organic Chemistry practice quiz! Great job.',
    time: '3 hours ago',
    type: 'success',
    read: true,
  },
  {
    id: 4,
    title: 'Subscription Renewal',
    message: 'Your premium subscription will renew in 3 days.',
    time: '1 day ago',
    type: 'warning',
    read: true,
  },
  {
    id: 5,
    title: 'Welcome to Aether Study',
    message: 'Start by uploading your first study material to see the magic happen.',
    time: '2 days ago',
    type: 'info',
    read: true,
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-text-main tracking-tight">Notifications</h1>
          <p className="text-[10px] sm:text-sm text-text-muted mt-0.5 sm:mt-1">Stay updated with your latest study activities.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={markAllAsRead}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-xs font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1.5 sm:gap-2"
          >
            <Check size={12} className="sm:hidden" />
            <Check size={14} className="hidden sm:block" /> Mark all
          </button>
          <button 
            onClick={clearAll}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-1.5 sm:gap-2"
          >
            <Trash2 size={12} className="sm:hidden" />
            <Trash2 size={14} className="hidden sm:block" /> Clear all
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden border-border/30">
        {notifications.length > 0 ? (
          <div className="divide-y divide-border/30">
            {notifications.map((notification) => (
              <motion.div 
                layout
                key={notification.id}
                className={cn(
                  "p-4 sm:p-6 flex items-start gap-3 sm:gap-4 transition-all hover:bg-surface-alt/20 group",
                  !notification.read && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0",
                  notification.type === 'info' && "bg-blue-500/10 text-blue-500",
                  notification.type === 'success' && "bg-green-500/10 text-green-500",
                  notification.type === 'warning' && "bg-orange-500/10 text-orange-500",
                  notification.type === 'ai' && "bg-primary/10 text-primary"
                )}>
                  {notification.type === 'info' && <Info size={16} className="sm:hidden" />}
                  {notification.type === 'info' && <Info size={20} className="hidden sm:block" />}
                  {notification.type === 'success' && <Check size={16} className="sm:hidden" />}
                  {notification.type === 'success' && <Check size={20} className="hidden sm:block" />}
                  {notification.type === 'warning' && <AlertCircle size={16} className="sm:hidden" />}
                  {notification.type === 'warning' && <AlertCircle size={20} className="hidden sm:block" />}
                  {notification.type === 'ai' && <Sparkles size={16} className="sm:hidden" />}
                  {notification.type === 'ai' && <Sparkles size={20} className="hidden sm:block" />}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <h3 className={cn(
                      "text-xs sm:text-base font-bold text-text-main truncate",
                      !notification.read && "text-primary"
                    )}>
                      {notification.title}
                    </h3>
                    <span className="text-[8px] sm:text-[10px] font-medium text-text-muted flex items-center gap-1 shrink-0">
                      <Clock size={8} className="sm:hidden" />
                      <Clock size={10} className="hidden sm:block" /> {notification.time}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-sm text-text-muted leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {!notification.read && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="p-1.5 sm:p-2 hover:bg-primary/10 text-text-muted hover:text-primary rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} className="sm:hidden" />
                      <Check size={16} className="hidden sm:block" />
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1.5 sm:p-2 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} className="sm:hidden" />
                    <Trash2 size={16} className="hidden sm:block" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 sm:p-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface-alt/50 rounded-full flex items-center justify-center text-text-muted mb-4 sm:mb-6">
              <Bell size={32} className="sm:hidden" />
              <Bell size={40} className="hidden sm:block" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-text-main mb-1 sm:mb-2">No notifications</h3>
            <p className="text-[10px] sm:text-sm text-text-muted max-w-xs">
              We'll notify you when something important happens.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
