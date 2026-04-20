import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Workflow, 
  Plus, 
  BarChart2, 
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, path: '/dashboard', label: 'Home' },
    { icon: Workflow, path: '/plans', label: 'Plans' },
    { icon: Plus, path: '/upload', isAction: true },
    { icon: BarChart2, path: '/reports', label: 'Reports' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="lg:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      {/* Blue Glow Background */}
      <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[80%] h-12 bg-primary/20 blur-2xl rounded-full -z-10" />

      {/* Main Container */}
      <nav className="bg-surface/90 backdrop-blur-xl border border-border shadow-lg rounded-full flex items-center justify-between px-7 sm:px-10 py-4 w-full max-w-[500px] pointer-events-auto">
        {navItems.map((item, index) => {
          if (item.isAction) {
            return (
              <div key="action" className="relative -mt-8 mx-2 hover:scale-105 transition-transform active:scale-95 duration-200">
                {/* Outer Ring */}
                <div className="p-[6px] bg-background/50 backdrop-blur-md rounded-full border border-border/50 shadow-inner">
                  <Link
                    to={item.path}
                    className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-primary text-white hover:bg-primary/90 transition-colors rounded-full shadow-[0_4px_15px_rgba(139,92,246,0.5)]"
                  >
                    <Plus size={28} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            );
          }

          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative p-2.5 flex flex-col items-center justify-center transition-all duration-300 group"
              title={item.label}
            >
              <item.icon 
                size={24} 
                strokeWidth={active ? 2.5 : 2}
                className={cn(
                  "transition-colors",
                  active ? "text-primary" : "text-text-muted group-hover:text-text-main"
                )} 
              />
              <AnimatePresence>
                {active && (
                  <motion.div 
                    layoutId="bottom-nav-activeStyle"
                    className="absolute -bottom-1.5 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Safe Area / iOS Bottom Bar Indicator */}
      <div className="fixed bottom-1.5 left-1/2 -translate-x-1/2 w-1/3 max-w-[120px] h-1 bg-border/80 rounded-full" />
    </div>
  );
}
