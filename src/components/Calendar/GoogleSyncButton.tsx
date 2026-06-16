import React from 'react';
import { useCalendar } from '../../hooks/useCalendar';
import { RefreshCw, Calendar as CalIcon, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GoogleSyncButton() {
  const { syncGoogleCalendar, loading, syncStatus } = useCalendar();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      {syncStatus.status === 'synced' && (
        <span className="text-xs text-[#8E9AAF] flex items-center gap-1 hidden sm:flex">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          Synced {syncStatus.time}
        </span>
      )}
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={syncGoogleCalendar}
        disabled={loading}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          loading ? 'bg-[#2D3748] opacity-70 cursor-not-allowed text-white' : 'bg-[#E2E8F0] text-[#0B0E14] hover:bg-white'
        }`}
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <CalIcon className="w-4 h-4 text-[#4285F4]" />
        )}
        <span>{loading ? 'Syncing...' : 'Sync Now'}</span>
      </motion.button>
      
      {syncStatus.status === 'synced' && (
        <span className="text-xs text-[#8E9AAF] flex items-center justify-center gap-1 sm:hidden">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          Synced {syncStatus.time}
        </span>
      )}
    </div>
  );
}
