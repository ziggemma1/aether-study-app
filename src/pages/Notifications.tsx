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
    message: 'Aether has generated a new summary for your Physics notes.',
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
    title: 'Welcome to Aether',
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Notifications</h1>
          <p className="text-text-muted mt-1">Stay updated with your latest study activities and AI insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="px-4 py-2 text-xs font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2"
          >
            <Check size={14} /> Mark all as read
          </button>
          <button 
            onClick={clearAll}
            className="px-4 py-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-2"
          >
            <Trash2 size={14} /> Clear all
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
                  "p-6 flex items-start gap-4 transition-all hover:bg-surface-alt/20 group",
                  !notification.read && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  notification.type === 'info' && "bg-blue-500/10 text-blue-500",
                  notification.type === 'success' && "bg-green-500/10 text-green-500",
                  notification.type === 'warning' && "bg-orange-500/10 text-orange-500",
                  notification.type === 'ai' && "bg-primary/10 text-primary"
                )}>
                  {notification.type === 'info' && <Info size={20} />}
                  {notification.type === 'success' && <Check size={20} />}
                  {notification.type === 'warning' && <AlertCircle size={20} />}
                  {notification.type === 'ai' && <Sparkles size={20} />}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={cn(
                      "font-bold text-text-main truncate",
                      !notification.read && "text-primary"
                    )}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] font-medium text-text-muted flex items-center gap-1 shrink-0">
                      <Clock size={10} /> {notification.time}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {!notification.read && (
                    <button 
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 hover:bg-primary/10 text-text-muted hover:text-primary rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-surface-alt/50 rounded-full flex items-center justify-center text-text-muted mb-6">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">No notifications yet</h3>
            <p className="text-text-muted max-w-xs">
              We'll notify you when something important happens in your study journey.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
