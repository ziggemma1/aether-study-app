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
  FileText,
  ChevronDown,
  Youtube,
  Globe,
  Mic,
  Image as ImageIcon,
  Video,
  Brain,
  FileBadge,
  Headphones,
  Compass,
  Radio
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
  const { signOut, t, materials } = useAppContext();
  const [isMobile, setIsMobile] = React.useState(false);
  const [libraryExpanded, setLibraryExpanded] = React.useState(false);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    'Dashboard': true,
    'Learning': true,
    'Social & Account': true
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getMaterialCount = (type: string) => {
    return Array.isArray(materials) ? materials.filter(m => m.type === type).length : 0;
  };

  const librarySubItems = [
    { icon: FileBadge, label: 'PDFs', type: 'pdf', count: getMaterialCount('pdf') },
    { icon: Youtube, label: 'YouTube', type: 'youtube', count: getMaterialCount('youtube') },
    { icon: Globe, label: 'Articles', type: 'article', count: getMaterialCount('article') },
    { icon: Headphones, label: 'Audio', type: 'audio', count: getMaterialCount('audio') },
    { icon: Mic, label: 'Voice Notes', type: 'voicenote', count: getMaterialCount('voicenote') },
  ];

  const navGroups = [
    {
      title: 'Dashboard',
      items: [
        { icon: LayoutDashboard, label: t('overview'), path: '/dashboard' },
        { icon: BarChart3, label: t('reports'), path: '/reports' },
        { icon: Award, label: t('achievements'), path: '/achievements' },
      ]
    },
    {
      title: 'Learning',
      items: [
        { 
          icon: Library, 
          label: t('library'), 
          path: '/library',
          hasSubItems: true,
          subItems: librarySubItems
        },
        { icon: Compass, label: 'Explore Notes', path: '/explore' },
        { icon: FileText, label: t('study_plans'), path: '/plans' },
        { icon: Calendar, label: t('calendar'), path: '/calendar' },
      ]
    },
    {
      title: 'Social & Account',
      items: [
        { icon: Radio, label: 'Live Rooms', path: '/rooms' },
        { icon: Users, label: 'Leaderboard', path: '/leaderboard' },
        { icon: Award, label: 'Aether Shop', path: '/shop' },
        { icon: MessageSquare, label: t('messages'), path: '/messages' },
        { icon: User, label: t('profile'), path: '/profile' },
        { icon: CreditCard, label: t('subscription'), path: '/subscription' },
        { icon: Settings, label: t('settings'), path: '/settings' },
      ]
    }

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
          "fixed top-0 left-0 h-full w-64 bg-surface/60 backdrop-blur-3xl border-r border-border z-[100] lg:translate-x-0"
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

            <div className="space-y-6">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-6 text-[11px] font-bold text-text-muted uppercase tracking-widest hover:text-text-main transition-colors group/header"
                  >
                    <span>{group.title}</span>
                    <ChevronDown 
                      size={14} 
                      className={cn(
                        "transition-transform duration-300",
                        expandedGroups[group.title] ? "rotate-0" : "-rotate-90"
                      )} 
                    />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {expandedGroups[group.title] && (
                      <motion.nav 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="space-y-1 overflow-hidden"
                      >
                        {group.items.map((item: any) => (
                          <div key={item.path} className="space-y-1">
                            <div className="relative group">
                              <Link
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  "flex items-center gap-4 px-6 py-3 rounded-full transition-all duration-200 relative overflow-hidden",
                                  isActive(item.path)
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-text-muted hover:text-text-main hover:bg-primary/5"
                                )}
                              >
                                {!isActive(item.path) && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                )}
                                <item.icon size={20} className={cn(
                                  "transition-colors relative z-10",
                                  isActive(item.path) ? "text-white" : "text-text-muted group-hover:text-primary"
                                )} />
                                <span className="font-semibold text-sm relative z-10">{item.label}</span>
                                
                                {item.hasSubItems && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setLibraryExpanded(!libraryExpanded);
                                    }}
                                    className="ml-auto relative z-20 p-1 hover:bg-black/10 rounded-md transition-colors"
                                  >
                                    <ChevronDown 
                                      size={14} 
                                      className={cn(
                                        "transition-transform duration-200",
                                        libraryExpanded ? "rotate-180" : "rotate-0"
                                      )} 
                                    />
                                  </button>
                                )}
                              </Link>
                            </div>

                            {/* Library Sub Items */}
                            {item.hasSubItems && (
                              <AnimatePresence>
                                {libraryExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="ml-10 space-y-1 overflow-hidden border-l border-border/50"
                                  >
                                    {item.subItems.map((sub: any) => (
                                      <Link
                                        key={sub.type}
                                        to={`/library?filter=${sub.type}`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between px-4 py-2 text-xs font-medium text-text-muted hover:text-primary hover:bg-primary/5 rounded-r-full transition-all group/sub"
                                      >
                                        <div className="flex items-center gap-2">
                                          <sub.icon size={14} className="group-hover/sub:scale-110 transition-transform" />
                                          <span>{sub.label}</span>
                                        </div>
                                        <span className="bg-surface-alt px-1.5 py-0.5 rounded-md text-[9px] border border-border group-hover/sub:border-primary/30 transition-colors">
                                          {sub.count}
                                        </span>
                                      </Link>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            )}
                          </div>
                        ))}
                      </motion.nav>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="my-8 h-px bg-border w-full" />

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
