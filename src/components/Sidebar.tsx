import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Library, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Award,
  Calendar,
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  ArrowRight,
  User,
  CreditCard,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, t } = useAppContext();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: t('overview'), path: '/dashboard' },
    { icon: Library, label: t('library'), path: '/library' },
    { icon: MessageSquare, label: t('messages'), path: '/messages' },
    { icon: Calendar, label: t('calendar'), path: '/calendar' },
    { icon: FileText, label: t('study_plans'), path: '/plans' },
    { icon: BarChart3, label: t('reports'), path: '/reports' },
    { icon: Award, label: t('achievements'), path: '/achievements' },
    { icon: User, label: t('profile'), path: '/profile' },
    { icon: CreditCard, label: t('subscription'), path: '/subscription' },
    { icon: Settings, label: t('settings'), path: '/settings' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isMobile ? (isOpen ? 0 : '-100%') : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.5 }}
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-surface/80 backdrop-blur-xl border-r border-border z-[100] lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-8">
            <Link to="/" className="flex items-center gap-2 mb-12">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="text-lg font-bold text-text-main tracking-tight">Aether Study</span>
            </Link>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-6 py-3.5 rounded-full transition-all duration-200 group",
                    isActive(item.path)
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-text-muted hover:text-text-main"
                  )}
                >
                  <item.icon size={22} className={cn(
                    "transition-colors",
                    isActive(item.path) ? "text-white" : "text-text-muted group-hover:text-primary"
                  )} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="my-8 h-px bg-border w-full" />

            <div className="relative rounded-[32px] overflow-hidden group h-40 flex items-center mb-4">
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://picsum.photos/seed/study-premium/400/300" 
                  alt="Premium Background" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
              </div>

              <div className="relative z-10 p-6 w-full">
                <h4 className="text-lg font-bold text-white mb-1">{t('go_premium')}</h4>
                <p className="text-[10px] text-slate-300 mb-4 leading-relaxed max-w-[140px]">
                  {t('go_premium_desc')}
                </p>
                <Link 
                  to="/subscription" 
                  className="inline-flex items-center justify-center bg-white text-primary hover:bg-slate-50 text-[10px] font-bold py-2 px-6 rounded-xl transition-all shadow-sm"
                >
                  {t('get_access')}
                </Link>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-4 w-full text-red-400 hover:bg-red-500/10 rounded-2xl transition-all group mt-4"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-semibold text-sm">{t('logout')}</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
