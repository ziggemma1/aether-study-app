import React from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';

export default function TopNav() {
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
            ? "mt-4 w-full max-w-[1400px] px-6 py-3 bg-surface/80 backdrop-blur-xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[24px]" 
            : "mt-0 w-full px-8 md:px-12 py-5 bg-surface border-b border-border rounded-none shadow-none"
        )}
      >
        {/* Search - Left aligned like image 2 */}
        <div className={cn(
          "flex items-center gap-2 bg-surface-alt/50 px-4 py-2 rounded-2xl border border-border focus-within:border-primary/30 transition-all",
          scrolled ? "w-48 md:w-64 lg:w-80" : "w-64 md:w-80 lg:w-96"
        )}>
          <Search size={18} className="text-text-muted" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm w-full text-text-main placeholder:text-text-muted"
          />
        </div>

        <div className="flex items-center gap-6">
          {/* Theme Toggle & Notifications */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-surface-alt/50 p-1 rounded-full border border-border">
              <button 
                onClick={() => theme === 'dark' && toggleTheme()}
                className={cn(
                  "p-1.5 transition-all rounded-full",
                  theme === 'light' ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main"
                )}
              >
                <Sun size={14} />
              </button>
              <button 
                onClick={() => theme === 'light' && toggleTheme()}
                className={cn(
                  "p-1.5 transition-all rounded-full",
                  theme === 'dark' ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-main"
                )}
              >
                <Moon size={14} />
              </button>
            </div>
            
            <Link to="/notifications" className="p-2 bg-surface-alt/50 text-text-muted hover:bg-surface-alt rounded-xl transition-all border border-border relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-background" />
            </Link>
          </div>

          {/* User Profile - Detailed like image 2 */}
          <Link to="/profile" className="flex items-center gap-3 pl-4 border-l border-border group">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-text-main leading-none mb-1 group-hover:text-primary transition-colors">
                {user?.name || "Robert Fox"}
              </p>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
                #10532
              </p>
            </div>
            <div className="relative">
              <img 
                src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert"} 
                alt="Profile" 
                className={cn(
                  "rounded-full border border-border shadow-lg group-hover:border-primary/30 transition-all",
                  scrolled ? "w-8 h-8" : "w-10 h-10"
                )}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            </div>
          </Link>
        </div>
      </motion.nav>
    </div>
  );
}
