import React from 'react';
import { Search, Bell, Sun, Moon, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';

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
            ? "mt-2 w-full max-w-[1400px] px-4 py-2 bg-surface/80 backdrop-blur-xl border border-border shadow-lg rounded-full" 
            : "mt-0 w-full px-6 py-4 bg-surface border-b border-border rounded-none shadow-none"
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
            
            <Link to="/notifications" className="p-2 bg-surface-alt/80 text-text-muted hover:bg-surface-alt hover:text-text-main rounded-full transition-all border border-border relative flex items-center justify-center shrink-0">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-surface" />
            </Link>
          </div>

          {/* User Profile */}
          <Link to="/profile" className="flex items-center gap-3 pl-3 sm:pl-5 border-l border-border/50 group shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-text-main leading-none whitespace-nowrap group-hover:text-primary transition-colors">
                {user?.name?.split(' ')[0] || t('student')}
              </p>
              <p className="text-[11px] font-medium text-text-muted mt-1 whitespace-nowrap">
                Student
              </p>
            </div>
            <div className="relative shrink-0 flex items-center justify-center">
              <img 
                src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert"} 
                alt="Profile" 
                className={cn(
                  "rounded-full border border-border/50 shadow-sm group-hover:border-primary/50 transition-all object-cover",
                  scrolled ? "w-8 h-8" : "w-10 h-10"
                )}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] bg-green-500 rounded-full border-[2.5px] border-surface" />
            </div>
          </Link>
        </div>
      </motion.nav>
    </div>
  );
}
