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
  const { user, theme, toggleTheme } = useAppContext();
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
            ? "mt-2 w-full max-w-[1400px] px-4 py-2 bg-surface/80 backdrop-blur-xl border border-border shadow-lg rounded-[20px]" 
            : "mt-0 w-full px-6 py-3 bg-surface border-b border-border rounded-none shadow-none"
        )}
      >
        <div className="flex items-center gap-2.5">
          {/* Menu Toggle / Logo - Mobile Only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 bg-surface-alt/50 rounded-lg border border-border text-text-main shrink-0 active:scale-95 transition-transform"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className={cn(
            "flex items-center gap-2 bg-surface-alt/50 px-3 py-2 rounded-lg border border-border focus-within:border-primary/30 transition-all",
            scrolled ? "w-32 sm:w-48" : "w-40 sm:w-64"
          )}>
            <Search size={18} className="text-text-muted shrink-0" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-transparent border-none outline-none text-xs w-full text-text-main placeholder:text-text-muted whitespace-nowrap overflow-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Theme Toggle & Notifications */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex items-center bg-surface-alt/50 p-1 rounded-full border border-border">
              <button 
                onClick={() => theme === 'dark' && toggleTheme()}
                className={cn(
                  "p-2 transition-all rounded-full",
                  theme === 'light' ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main"
                )}
              >
                <Sun size={18} />
              </button>
              <button 
                onClick={() => theme === 'light' && toggleTheme()}
                className={cn(
                  "p-2 transition-all rounded-full",
                  theme === 'dark' ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main"
                )}
              >
                <Moon size={18} />
              </button>
            </div>
            
            <Link to="/notifications" className="p-2.5 bg-surface-alt/50 text-text-muted hover:bg-surface-alt rounded-lg transition-all border border-border relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-surface" />
            </Link>
          </div>

          {/* User Profile */}
          <Link to="/profile" className="flex items-center gap-2.5 pl-2.5 border-l border-border group shrink-0">
            <div className="text-right hidden xs:block">
              <p className="text-xs font-bold text-text-main leading-none whitespace-nowrap group-hover:text-primary transition-colors">
                {user?.name?.split(' ')[0] || "Robert"}
              </p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter whitespace-nowrap">
                #10532
              </p>
            </div>
            <div className="relative shrink-0">
              <img 
                src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert"} 
                alt="Profile" 
                className={cn(
                  "rounded-full border border-border shadow-sm group-hover:border-primary/30 transition-all",
                  scrolled ? "w-8 h-8" : "w-10 h-10"
                )}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-surface" />
            </div>
          </Link>
        </div>
      </motion.nav>
    </div>
  );
}
