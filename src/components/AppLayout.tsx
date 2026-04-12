import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { isSupabaseConfigured } from '../lib/supabase';
import { Database, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AppLayout() {
  const { theme } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className={cn("min-h-screen bg-background relative overflow-hidden flex", theme)}>
      {/* Floating Setup Button for Supabase */}
      {!isSupabaseConfigured && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
        >
          <Link 
            to="/settings?tab=connection"
            className="flex items-center justify-between p-4 bg-red-500 text-white rounded-2xl shadow-2xl shadow-red-500/40 border border-white/20 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Database size={20} />
              </div>
              <div>
                <p className="text-xs font-bold">Setup Required</p>
                <p className="text-[10px] opacity-90">Connect Supabase to save your data</p>
              </div>
            </div>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      )}
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

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
