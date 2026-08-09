import React, { useState } from 'react';
import { Bell, BellOff, Volume2, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';

export default function StudyReminders() {
  const [enabled, setEnabled] = useState(false);
  const [browserPerms, setBrowserPerms] = useState<'granted' | 'denied' | 'default'>('default');

  const toggleReminders = async () => {
    if (!enabled && browserPerms !== 'granted') {
      try {
        const permission = await Notification.requestPermission();
        setBrowserPerms(permission);
        if (permission === 'granted') {
          setEnabled(true);
          // Simulate sending a test notification
          new Notification('Aether Study', {
            body: 'Study reminders enabled successfully!',
            icon: '/icon.png' // Adjust path appropriately
          });
        }
      } catch (error) {
        console.error('Failed to request notification permissions:', error);
      }
    } else {
      setEnabled(!enabled);
    }
  };

  return (
    <div className="bg-surface/50 border border-border/30 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
          enabled ? "bg-accent/10 text-accent" : "bg-surface-alt/50 text-text-muted"
        )}>
          {enabled ? <Bell size={18} /> : <BellOff size={18} />}
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-main">Study Reminders</h3>
          <p className="text-[11px] text-text-muted flex items-center gap-1">
            <Smartphone size={10} /> Browser & Mobile push
          </p>
        </div>
      </div>
      
      <button 
        onClick={toggleReminders}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          enabled ? "bg-primary" : "bg-surface-alt/80 border-border/50"
        )}
      >
        <span className="sr-only">Toggle Reminders</span>
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
