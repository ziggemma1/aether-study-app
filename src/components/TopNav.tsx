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
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
        <div className="flex items-center gap-2">
          {/* Menu Toggle / Logo - Mobile Only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1 bg-surface-alt/50 rounded-lg border border-border text-text-main shrink-0 active:scale-95 transition-transform"
          >
            <Menu size={12} />
          </button>

          {/* Search */}
          <div className={cn(
            "flex items-center gap-1 bg-surface-alt/50 px-1.5 py-0.5 rounded-lg border border-border focus-within:border-primary/30 transition-all",
            scrolled ? "w-20 sm:w-48" : "w-28 sm:w-64"
          )}>
            <Search size={10} className="text-text-muted shrink-0" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-transparent border-none outline-none text-[8px] sm:text-xs w-full text-text-main placeholder:text-text-muted whitespace-nowrap overflow-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4">
          {/* Theme Toggle & Notifications */}
          <div className="flex items-center gap-1 sm:gap-3">
            <div className="flex items-center bg-surface-alt/50 p-0.5 rounded-full border border-border">
              <button 
                onClick={() => theme === 'dark' && toggleTheme()}
                className={cn(
                  "p-0.5 transition-all rounded-full",
                  theme === 'light' ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main"
                )}
              >
                <Sun size={10} />
              </button>
              <button 
                onClick={() => theme === 'light' && toggleTheme()}
                className={cn(
                  "p-0.5 transition-all rounded-full",
                  theme === 'dark' ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main"
                )}
              >
                <Moon size={10} />
              </button>
            </div>
            
            <Link to="/notifications" className="p-1 bg-surface-alt/50 text-text-muted hover:bg-surface-alt rounded-lg transition-all border border-border relative">
              <Bell size={12} />
              <span className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-red-500 rounded-full" />
            </Link>
          </div>

          {/* User Profile */}
          <Link to="/profile" className="flex items-center gap-1.5 pl-1.5 border-l border-border group shrink-0">
            <div className="text-right hidden xs:block">
              <p className="text-[8px] font-bold text-text-main leading-none whitespace-nowrap group-hover:text-primary transition-colors">
                {user?.name?.split(' ')[0] || "Robert"}
              </p>
              <p className="text-[6px] font-bold text-text-muted uppercase tracking-tighter whitespace-nowrap">
                #10532
              </p>
            </div>
            <div className="relative shrink-0">
              <img 
                src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert"} 
                alt="Profile" 
                className={cn(
                  "rounded-full border border-border shadow-sm group-hover:border-primary/30 transition-all",
                  scrolled ? "w-5 h-5" : "w-7 h-7"
                )}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-green-500 rounded-full" />
            </div>
          </Link>
        </div>
      </motion.nav>
    </div>
  );
}
