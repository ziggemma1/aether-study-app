import React from 'react';
import { Search, Sun, Moon, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { user, theme, toggleTheme, t } = useAppContext();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    const handleScroll = () => {
      setScrolled(mainEl.scrollTop > 20);
    };
    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={cn(
      "fixed top-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-500 lg:left-64 left-0",
      scrolled ? "px-4 md:px-8" : "px-0"
    )}>
      <motion.nav 
        layout
        className={cn(
          "flex items-center justify-between pointer-events-auto transition-all duration-500 ease-in-out",
          scrolled 
            ? "mt-2 w-full max-w-[1400px] px-4 py-2 bg-surface/60 backdrop-blur-2xl border border-border shadow-lg rounded-full" 
            : "mt-0 w-full px-6 py-4 bg-surface/60 border-b border-border rounded-none shadow-none"
        )}
      >
        <div className="flex items-center gap-4">
           {/* Menu Toggle / Logo - Mobile Only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 bg-surface-alt/80 hover:bg-surface-alt rounded-lg border border-border text-text-main shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <Menu size={22} className="opacity-80" />
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Theme Toggle & Notifications */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center bg-surface-alt/80 p-[3px] rounded-full border border-border shadow-inner">
              <button 
                onClick={() => theme === 'dark' && toggleTheme()}
                className={cn(
                  "p-1.5 transition-all rounded-full outline-none",
                  theme === 'light' ? "bg-primary text-white shadow-md scale-105" : "text-text-muted hover:text-text-main"
                )}
              >
                <Sun size={15} />
              </button>
              <button 
                onClick={() => theme === 'light' && toggleTheme()}
                className={cn(
                  "p-1.5 transition-all rounded-full outline-none",
                  theme === 'dark' ? "bg-primary text-white shadow-md scale-105" : "text-text-muted hover:text-text-main"
                )}
              >
                <Moon size={15} />
              </button>
            </div>
            
            <NotificationBell />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 sm:pl-5 border-l border-border/50 group shrink-0">
            <UserMenu />
          </div>
        </div>
      </motion.nav>
    </div>
  );
}
