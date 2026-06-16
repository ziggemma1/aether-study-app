import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function GoogleCalendarSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Basic URL check for successful sync completion callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sync') === 'success') {
      setStatus('success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('sync') === 'error') {
      setStatus('error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setStatus('idle');
      
      const response = await api.post('/calendar/google/auth');
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to initiate sync', error);
      setStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-surface/50 border border-border/30 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
            <CalendarIcon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-main">Google Calendar</h3>
            <p className="text-[10px] text-text-muted">Two-way synchronization</p>
          </div>
        </div>
        
        {status === 'success' && <CheckCircle2 className="text-green-500" size={16} />}
        {status === 'error' && <AlertCircle className="text-red-500" size={16} />}
      </div>

      <button 
        onClick={handleSync}
        disabled={isSyncing}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
      >
        {isSyncing ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : status === 'success' ? (
          <><CheckCircle2 size={14} /> Synced</>
        ) : (
          <><CalendarIcon size={14} /> Sync with Google Calendar</>
        )}
      </button>
    </div>
  );
}
