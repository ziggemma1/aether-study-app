import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getInitials, cn } from '../lib/utils';
import { 
  User as UserIcon, 
  Settings, 
  Trophy, 
  LayoutDashboard, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMenu() {
  const { user, signOut, t } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile', label: 'Profile', icon: UserIcon },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/achievements', label: 'Achievements', icon: Trophy },
  ];

  const displayName = user?.name || 'Student';
  const displayEmail = user?.email || 'student@aetherstudy.com';
  const avatarUrl = user?.avatar;

  return (
    <div className="relative" ref={menuRef}>
      {/* Target Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl p-1 hover:bg-surface-alt/50 transition-colors select-none text-left"
        id="user-menu-trigger"
      >
        <div className="relative shrink-0 flex items-center justify-center">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="w-10 h-10 rounded-full border border-border/80 object-cover shadow-inner"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
              {getInitials(displayName)}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface" />
        </div>
        <div className="hidden sm:block max-w-[100px] truncate leading-none">
          <p className="text-xs font-black text-text-main truncate uppercase tracking-tight">{displayName.split(' ')[0]}</p>
          <span className="text-[9px] text-text-muted">Online</span>
        </div>
        <ChevronDown size={14} className={cn("text-text-muted transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Popover Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-64 bg-background border border-border/30 rounded-2xl shadow-2xl z-50 overflow-hidden pointer-events-auto"
            id="user-menu-dropdown"
          >
            {/* Header info */}
            <div className="p-4 bg-background border-b border-border/20 flex items-center gap-3">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="w-11 h-11 rounded-full border border-border/80 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/25 border border-primary/20 text-text-main flex items-center justify-center font-bold text-sm">
                  {getInitials(displayName)}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-xs font-black text-text-main truncate uppercase tracking-tight">{displayName}</h4>
                <p className="text-[10px] text-text-muted truncate mt-0.5">{displayEmail}</p>
              </div>
            </div>

            {/* Nav Links */}
            <div className="p-2 space-y-1 bg-background">
              {menuItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-main hover:bg-surface/50 transition-all group"
                  id={`user-menu-link-${item.label.toLowerCase()}`}
                >
                  <item.icon size={15} className="group-hover:text-primary transition-colors text-text-muted" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Footer Log out */}
            <div className="p-2 border-t border-border/20 bg-background">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-red-500 hover:bg-red-500/10 transition-all"
                id="user-menu-logout-btn"
              >
                <LogOut size={15} />
                <span>LOG OUT</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
