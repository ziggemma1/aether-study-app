import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import InteractiveBackground from './InteractiveBackground';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Database, ArrowRight, Loader2, Sparkles, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout() {
  const { theme, dbError, isLoading, user, toast } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Critical loading should only block if there's no user in cache/state
  const isCriticalLoading = (isLoading && !user);

  return (
    <div className={cn("h-full w-full bg-background relative overflow-hidden flex", theme)}>
      {/* Background Glows */}
      <InteractiveBackground />

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
      <div className="flex-grow min-w-0 w-full max-w-[100vw] relative z-10 lg:ml-64 flex flex-col h-full bg-background transition-all duration-300 ease-out overflow-x-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="min-w-0 w-full max-w-[100vw] lg:max-w-[1600px] mx-auto px-4 md:px-8 pt-24 sm:pt-32 pb-36 sm:pb-10 flex-grow overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar select-none overscroll-contain">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
