import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Database, ArrowRight, Loader2, Sparkles, WifiOff, CheckCircle2, AlertCircle, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedContainer } from './AnimatedContainer';

export default function AppLayout() {
  const { theme, timeTheme, dbError, isLoading, user, toast } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [showBackToTop, setShowBackToTop] = React.useState(false);
  const mainRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;
    const handleScroll = () => {
      setShowBackToTop(mainEl.scrollTop > 400);
    };
    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Critical loading should only block if there's no user in cache/state
  const isCriticalLoading = (isLoading && !user);

  return (
    /* The theme classes are applied to documentElement in AppContext, not here:
       Tailwind's @theme resolves --color-* against :root, so a token override on
       an inner div is invisible to every `bg-*`/`text-*` utility. They stay in
       this className too so anything reading tokens off its own node (the charts
       do) still sees them. */
    <div className={cn("h-full w-full relative overflow-hidden flex", theme, timeTheme, user?.equippedTheme)}>
      {/* Full Screen Loader - Only blocks UI if we have no user data yet */}
      <AnimatePresence>
        {isCriticalLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="text-primary animate-pulse" size={32} />
              </div>
            </div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-text-main mb-2"
            >
              Loading...
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-text-muted text-sm max-w-xs"
            >
              Please wait while we fetch your data
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-24 sm:bottom-10 left-1/2 z-[2000] px-6 py-3 rounded-full font-bold shadow-2xl border backdrop-blur-md flex items-center gap-3",
              toast?.type === 'success' 
                ? "bg-accent/10 text-accent border-accent/20" 
                : "bg-brand-pink/10 text-brand-pink border-brand-pink/20"
            )}
          >
            {toast?.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm whitespace-nowrap">{toast?.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-grow min-w-0 w-full max-w-[100vw] relative z-10 lg:ml-64 flex flex-col h-full bg-transparent transition-all duration-300 ease-out overflow-x-hidden">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        <main ref={mainRef} className="min-w-0 w-full max-w-[100vw] lg:max-w-[1600px] mx-auto px-4 md:px-8 pt-24 sm:pt-32 lg:pb-10 flex-grow overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar select-none overscroll-contain flex flex-col">
          <AnimatedContainer>
            <Outlet />
          </AnimatedContainer>

          {/*
            * Clearance for the floating BottomNav — a real element, not padding.
            *
            * `padding-bottom` on a SCROLLING FLEX CONTAINER is not part of its
            * scrollable area: measured here, main.scrollHeight came to exactly
            * paddingTop + child height, with a 160px padding-bottom contributing
            * nothing. So the last control stayed under the nav no matter how
            * large that padding grew. A shrink-0 spacer is real content, so it
            * does scroll.
            *
            * Height is measured, not guessed: the nav sits 24px off the bottom
            * and is ~78px tall, and its centre "+" button is raised a further
            * 32px by `-mt-8`, so the cluster occupies ~134px. 160px leaves a
            * comfortable margin.
            *
            * `lg:hidden` matches BottomNav's own `lg:hidden` exactly. The old
            * padding switched at `sm` (640px) while the nav stayed visible to
            * 1023px, which is why every tablet width was clipped.
            *
            * Plain `h-40` rather than a calc() with env(safe-area-inset-bottom):
            * index.html does not set viewport-fit=cover, so that inset is 0 here
            * regardless, and the arbitrary value proved unreliable between cold
            * builds and HMR. If safe-area support is ever added, widen this to
            * `h-[calc(10rem_+_env(safe-area-inset-bottom))]` — note the
            * underscores, since CSS calc() is invalid without whitespace around
            * the `+` and Tailwind silently drops the declaration without them.
            */}
          <div aria-hidden="true" className="shrink-0 lg:hidden h-40" />
        </main>
        <BottomNav />
        
        {/* Back to Top */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5, y: 20, x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, scale: 0.5, y: 20, x: '-50%' }}
              onClick={scrollToTop}
              /* Must clear the BottomNav, which occupies ~134px and exists up to
                 lg. `sm:bottom-12` (48px) parked this button directly on top of
                 the nav's raised "+" — it covered the primary create action
                 with a scroll affordance. Stays centred (as chosen earlier),
                 just above the nav until the nav is gone. */
              className="fixed bottom-40 lg:bottom-12 left-1/2 z-[1000] p-3 sm:p-4 bg-primary text-white rounded-full shadow-[var(--shadow-card-hover)] hover:scale-110 active:scale-95 transition-all border border-border"
            >
              <ArrowUp size={24} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
