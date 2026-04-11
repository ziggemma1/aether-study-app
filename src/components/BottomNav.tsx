import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Library, 
  MessageSquare, 
  Calendar,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
    { icon: Library, label: 'Library', path: '/library' },
    { icon: MessageSquare, label: 'Chat', path: '/messages' },
    { icon: Calendar, label: 'Plans', path: '/calendar' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <nav className="bg-surface/80 backdrop-blur-xl border border-border shadow-lg rounded-2xl flex items-center justify-around p-2 pointer-events-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[64px]",
              isActive(item.path)
                ? "text-primary bg-primary/10"
                : "text-text-muted hover:text-text-main"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-colors",
              isActive(item.path) ? "text-primary" : "text-text-muted"
            )} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
