import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { BookOpen, Sparkles, Shield, Zap, ArrowRight, CheckCircle2, Star, Menu, X, User, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { GeometricBackground } from '../components/ui/geometric-background';
import BeforeAfterSection from '../components/BeforeAfterSection';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Sparkles, title: 'AI Summaries', description: 'Turn long PDFs and videos into concise, actionable summaries in seconds.' },
    { icon: Zap, title: 'Smart Quizzes', description: 'Automatically generate practice questions based on your study materials.' },
    { icon: BookOpen, title: 'Reading Plans', description: 'Get a personalized schedule to finish your materials before exam day.' },
    { icon: Shield, title: 'Exam Ready', description: 'Tailored support for WAEC, JAMB, SAT, UTBK, and more.' },
    { icon: User, title: 'Snap & Scan', description: 'Take a photo of any textbook page or handwritten note. Our AI reads it and creates a study plan.' },
    { icon: Plus, title: 'Curriculum Library', description: 'Choose your subject and chapter. Get instant notes and questions – even without uploading.' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Moving Background */}
      <GeometricBackground className="z-0" />

      <div className="relative z-10">
        {/* Navigation */}
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <motion.nav 
            layout
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ 
              layout: { type: "spring", stiffness: 300, damping: 30 },
              y: { duration: 0.3 }
            }}
            className={cn(
              "flex items-center justify-between pointer-events-auto transition-all duration-300",
              isScrolled 
                ? "mt-4 w-[92%] max-w-5xl px-4 py-2 bg-background/60 backdrop-blur-xl border border-white/10 shadow-lg rounded-full" 
                : "mt-0 w-full px-4 py-4 bg-transparent border-transparent"
            )}
          >
            <motion.div 
              layout
              animate={isScrolled ? { scale: 0.95 } : { scale: 1 }}
              className="flex items-center gap-2 shrink-0"
            >
              <motion.div 
                layout
                animate={isScrolled ? { 
                  y: [0, -2, 0],
                  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                } : {}}
                className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-md"
              >
                <span className="text-white font-bold text-sm">A</span>
              </motion.div>
            <motion.span layout className="text-base font-medium text-white tracking-tight whitespace-nowrap">
              <span className="font-bold">Aether</span> Study
            </motion.span>
            </motion.div>

            <motion.div layout className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-slate-400 font-medium text-sm hover:text-primary transition-colors">Features</a>
              <a href="#pricing" className="text-slate-400 font-medium text-sm hover:text-primary transition-colors">Pricing</a>
            </motion.div>

            <motion.div layout className="flex items-center gap-3 sm:gap-4 shrink-0">
              <Link to="/login" className="text-slate-400 font-semibold text-xs sm:text-sm hover:text-primary transition-colors whitespace-nowrap">Sign In</Link>
              <Link to="/signup" className={cn(
                "btn-primary !py-2 !px-4 sm:!py-2.5 sm:!px-5 transition-all duration-300 whitespace-nowrap",
                isScrolled ? "text-xs" : "text-xs sm:text-sm"
              )}>
                Get Started
              </Link>
            </motion.div>
          </motion.nav>
        </div>

        {/* Hero Section */}
        <section className="px-6 md:px-12 lg:px-24 pt-24 sm:pt-32 pb-12 sm:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h1 className="text-3xl md:text-5xl font-medium mb-6 leading-[1.1] tracking-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 via-80% to-slate-400">
                85% of Students Say They 
              </span>
              <span className="block text-primary my-1">Remember More</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 via-80% to-slate-400">
                After One Week on <span className="font-bold">Aether</span>
              </span>
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6">
              <Sparkles size={14} />
              <span>📸 Snap physical notes • 📚 Learn from curriculum – no upload needed</span>
            </div>
            <p className="text-slate-400 text-lg mb-8 max-w-lg leading-relaxed">
              Not another note-taking app. A complete AI study system that thousands of students use to replace last-minute cramming with confident mastery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="btn-primary">
                Join 10,000+ Students
              </Link>
              <button className="btn-secondary">
                Read Reviews
              </button>
            </div>
          </motion.div>

          {/* Hero Visuals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative"
          >
            {/* Main Card 1 */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-full max-w-[280px] sm:max-w-[320px] bg-gradient-to-br from-[#FF55D2] to-[#FF9F68] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-xl relative z-20 mb-6 sm:mb-8 mx-auto lg:ml-auto"
            >
              <div className="flex flex-col gap-1 mb-3 sm:mb-4">
                <span className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Concepts Mastered</span>
                <span className="text-white text-2xl sm:text-4xl font-extrabold">1,240</span>
              </div>
              <p className="text-white/90 text-xs sm:text-sm">Aether helps you track exactly what you know and what you don't.</p>
            </motion.div>

            {/* Main Card 2 */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-full max-w-[280px] sm:max-w-[320px] bg-gradient-to-br from-primary to-violet-700 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 shadow-xl relative z-10 mx-auto lg:ml-auto lg:mr-8"
            >
              <div className="flex flex-col gap-1 mb-3 sm:mb-4">
                <span className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Study Sessions</span>
                <span className="text-white text-2xl sm:text-4xl font-extrabold">12k+</span>
              </div>
              <p className="text-white/90 text-xs sm:text-sm">Join thousands of students optimizing their study time today.</p>
            </motion.div>

            {/* Floating Stats */}
            <div className="relative lg:absolute lg:-left-8 lg:top-1/2 lg:-translate-y-1/2 mt-6 lg:mt-0 bg-surface border border-border rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 shadow-xl flex flex-col gap-2 sm:gap-3 w-full max-w-[280px] sm:min-w-[220px] mx-auto z-30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-lg sm:rounded-xl flex items-center justify-center text-primary shadow-sm">
                  <User size={16} className="sm:hidden" />
                  <User size={20} className="hidden sm:block" />
                </div>
                <div>
                  <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Students</p>
                  <p className="text-lg sm:text-xl font-bold text-white">10,482</p>
                </div>
              </div>
              <p className="text-slate-500 text-[10px] sm:text-[11px] font-medium">Master your courses with AI-powered insights.</p>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-12 sm:py-24 px-4 md:px-8 lg:px-16 bg-surface/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-white">Everything you need to ace your </span>
                <span className="text-primary">exams</span>
              </h2>
              <p className="text-slate-400">Powerful AI tools designed specifically for students.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="glass-card p-8 flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Before vs After Results Section */}
        <BeforeAfterSection />

        {/* Pricing */}
        <section id="pricing" className="py-12 sm:py-24 px-4 md:px-8 lg:px-16 bg-surface/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500">Simple, Transparent Pricing</h2>
              <p className="text-slate-400">Choose the plan that fits your study goals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Free Plan */}
              <div className="glass-card p-10 flex flex-col">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <p className="text-slate-500 mb-6">Perfect for trying out Aether Study.</p>
                <div className="text-4xl font-bold mb-8 text-white">$0<span className="text-lg font-normal text-slate-500">/mo</span></div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-slate-400"><CheckCircle2 className="text-secondary" size={20} /> 5 Materials per month</li>
                  <li className="flex items-center gap-3 text-slate-400"><CheckCircle2 className="text-secondary" size={20} /> AI Summaries</li>
                  <li className="flex items-center gap-3 text-slate-400"><CheckCircle2 className="text-secondary" size={20} /> Basic Quizzes</li>
                  <li className="flex items-center gap-3 text-slate-600"><X size={20} /> Advanced Reading Plans</li>
                </ul>
                <Link to="/signup" className="btn-secondary text-center">Get Started</Link>
              </div>

              {/* Pro Plan */}
              <div className="glass-card p-10 flex flex-col border-secondary/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-secondary text-primary px-4 py-1 text-sm font-bold rounded-bl-xl">POPULAR</div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-slate-500 mb-6">For serious students who want to excel.</p>
                <div className="text-4xl font-bold mb-8 text-white">$9.99<span className="text-lg font-normal text-slate-500">/mo</span></div>
                <ul className="space-y-4 mb-10 flex-grow">
                  <li className="flex items-center gap-3 text-slate-400"><CheckCircle2 className="text-secondary" size={20} /> Unlimited Materials</li>
                  <li className="flex items-center gap-3 text-slate-400"><CheckCircle2 className="text-secondary" size={20} /> Advanced AI Analysis</li>
                  <li className="flex items-center gap-3 text-slate-400"><CheckCircle2 className="text-secondary" size={20} /> Unlimited Quizzes</li>
                  <li className="flex items-center gap-3 text-slate-400"><CheckCircle2 className="text-secondary" size={20} /> Custom Reading Plans</li>
                  <li className="flex items-center gap-3 text-slate-400"><CheckCircle2 className="text-secondary" size={20} /> Priority Support</li>
                </ul>
                <Link to="/signup" className="btn-primary text-center">Go Pro Now</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 md:px-8 lg:px-16 border-t border-border bg-background/50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-xl font-medium text-white">
                <span className="font-bold">Aether</span> Study
              </span>
            </div>
            
            <div className="flex gap-8 text-sm text-slate-500">
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Service</a>
              <a href="#" className="hover:text-primary">Contact Us</a>
            </div>

            <div className="text-sm text-slate-600">
              © 2024 Aether Study. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
