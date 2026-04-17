import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { isSupabaseConfigured } from '../lib/supabase';
import { Database, ArrowRight, Loader2, Sparkles, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout() {
  const { theme, dbError, isLoading, user, toast } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className={cn("min-h-screen bg-background relative overflow-hidden flex", theme)}>
      {/* Enhanced Database Connection Handling & Loading Overlay */}
      <AnimatePresence>
        {(dbError || (isLoading && !user)) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl"
          >
            <div className="max-w-md w-full glass-card p-10 flex flex-col items-center text-center space-y-8 shadow-[0_0_50px_rgba(139,92,246,0.3)] border-primary/20">
              <div className="relative">
                <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary animate-pulse">
                  {dbError ? <Database size={40} /> : <Sparkles size={40} />}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-surface border-4 border-background rounded-full flex items-center justify-center text-secondary">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-extrabold text-text-main tracking-tight">
                  {dbError ? "Syncing with Aether Secure" : "Initializing Aether"}
                </h2>
                <p className="text-text-muted text-sm leading-relaxed">
                  {dbError 
                    ? "We're establishing a secure high-speed connection to your study portal. This usually takes just a few seconds."
                    : "Preparing your personalized study environment and securing your data."}
                </p>
                <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] pt-2">
                  {dbError ? "Auto-Retry in progress..." : "Checking credentials..."}
                </div>
              </div>

              <div className="w-full bg-border/50 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 10, repeat: Infinity }}
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>

              {!dbError && (
                <p className="text-[10px] text-text-muted italic">
                  Tip: Aether study sessions are optimized for focus.
                </p>
              )}

              {dbError && (
                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg active:scale-95 text-sm"
                  >
                    Force Refresh
                    <ArrowRight size={16} />
                  </button>
                  <div className="flex items-center justify-center gap-2 text-text-muted/60 text-xs">
                    <WifiOff size={12} />
                    <span>Connection status: {dbError.includes('connecting') ? 'Negotiating handshake' : 'Retrying uplink'}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-24 sm:bottom-10 left-1/2 z-[2000] px-6 py-3 rounded-full font-bold shadow-2xl border backdrop-blur-md flex items-center gap-3",
              toast?.type === 'success' 
                ? "bg-green-500/10 text-green-500 border-green-500/20" 
                : "bg-red-500/10 text-red-500 border-red-500/20"
            )}
          >
            {toast?.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm whitespace-nowrap">{toast?.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-grow relative z-10 lg:ml-64 flex flex-col min-h-screen">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="max-w-[1600px] w-full mx-auto px-4 md:px-8 pt-16 sm:pt-24 pb-24 sm:pb-10 flex-grow">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
