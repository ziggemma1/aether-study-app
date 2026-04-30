"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Zap, 
  Clock, 
  CloudOff, 
  FolderOpen, 
  Upload, 
  FileUp, 
  BookOpen, 
  Calendar, 
  Trophy, 
  Star,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
  Layout,
  MessageSquare,
  Youtube,
  FileText,
  XCircle,
  Layers,
  Target,
  Sparkles,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- Types ---

type Option = 'slider' | 'stats' | 'timeline';

// --- Helper Components ---

const SectionHeader = ({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) => (
  <div className="text-center mb-16 px-4">
    <motion.span 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-block text-sm font-bold tracking-wider text-primary uppercase mb-4"
    >
      {eyebrow}
    </motion.span>
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight"
    >
      {title}
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 }}
      className="text-lg text-slate-400 max-w-2xl mx-auto"
    >
      {subtitle}
    </motion.p>
  </div>
);

const AnimatedNumber = ({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const totalFrames = duration * 60;
      let frame = 0;

      const timer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const currentCount = start + (end - start) * progress;
        
        if (frame >= totalFrames) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(currentCount);
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {value % 1 === 0 ? Math.floor(count) : count.toFixed(1)}
      {suffix}
    </span>
  );
};

// --- Option A: Before/After Slider ---

const BeforeAfterSlider = () => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.2"]
  });

  const beforePhrases = [
    "Chaotic. Scattered. Stressed.",
    "Lost in 100+ browser tabs.",
    "Searching for that one PDF...",
    "Cramming at 3 AM again.",
    "Where did I put those notes?",
    "Scattered notes everywhere.",
    "Missing critical deadlines.",
    "Overwhelmed by information.",
    "Drowning in digital clutter.",
    "No clear study path."
  ];

  const afterPhrases = [
    "Organized. Efficient. Confident.",
    "Everything in one AI workspace.",
    "Instant summaries. Zero fluff.",
    "Mastering topics in minutes.",
    "Exam ready. Stress-free.",
    "Clear path to mastery.",
    "85% better retention.",
    "Study smarter, not harder.",
    "AI-powered focus mode.",
    "Achieve your academic goals."
  ];

  const [beforeText, setBeforeText] = useState(beforePhrases[0]);
  const [afterText, setAfterText] = useState(afterPhrases[0]);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const index = Math.min(Math.floor(latest * beforePhrases.length), beforePhrases.length - 1);
      if (beforePhrases[index] !== beforeText) {
        setBeforeText(beforePhrases[index]);
      }
      if (afterPhrases[index] !== afterText) {
        setAfterText(afterPhrases[index]);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, beforePhrases, afterPhrases, beforeText, afterText]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  // Auto-animate on load
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 50;
      const end = 80;
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easedProgress;
        
        setSliderPos(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Bounce back to 50
          setTimeout(() => {
            const returnDuration = 800;
            const returnStartTime = Date.now();
            const returnAnimate = () => {
              const rNow = Date.now();
              const rElapsed = rNow - returnStartTime;
              const rProgress = Math.min(rElapsed / returnDuration, 1);
              const rEased = 1 - Math.pow(1 - rProgress, 3);
              setSliderPos(80 - (30 * rEased));
              if (rProgress < 1) requestAnimationFrame(returnAnimate);
            };
            requestAnimationFrame(returnAnimate);
          }, 500);
        }
      };
      requestAnimationFrame(animate);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div 
        ref={containerRef}
        className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none border border-white/10"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Before Side (Base) */}
        <div className="absolute inset-0 bg-[#0F172A]">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)]" />
          
          {/* Chaotic Mockup Content */}
          <div className="absolute inset-0 p-8 opacity-40 grayscale overflow-hidden">
            {/* Scattered Tabs */}
            <div className="flex gap-1 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-6 w-20 bg-white/5 border border-white/10 rounded-t-lg flex items-center px-2 gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500/30" />
                  <div className="h-1 w-10 bg-white/10 rounded" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* Scattered Files */}
              <motion.div 
                animate={{ rotate: -5, x: -10, y: 10 }}
                className="glass-card bg-white/5 border-white/10 p-4 h-32 flex flex-col gap-2 relative"
              >
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</div>
                <FileText size={16} className="text-rose-400" />
                <div className="text-[10px] text-rose-400 font-bold uppercase">Final_v2_FINAL.pdf</div>
                <div className="h-1.5 w-full bg-rose-400/20 rounded" />
                <div className="h-1.5 w-2/3 bg-rose-400/20 rounded" />
              </motion.div>

              <motion.div 
                animate={{ rotate: 3, x: 20, y: -5 }}
                className="glass-card bg-white/5 border-white/10 p-4 h-40 flex flex-col gap-2 mt-8"
              >
                <Youtube size={16} className="text-rose-400" />
                <div className="text-[10px] text-rose-400 font-bold uppercase">Lecture_10_Part_2</div>
                <div className="aspect-video bg-rose-400/10 rounded flex items-center justify-center">
                  <XCircle size={20} className="text-rose-400/30" />
                </div>
                <div className="h-1.5 w-full bg-rose-400/20 rounded" />
              </motion.div>

              <motion.div 
                animate={{ rotate: -2, x: 5, y: 15 }}
                className="glass-card bg-white/5 border-white/10 p-4 h-24 flex flex-col gap-2"
              >
                <MessageSquare size={16} className="text-rose-400" />
                <div className="text-[10px] text-rose-400 font-bold uppercase">Scientific Article</div>
                <div className="h-1.5 w-1/2 bg-rose-400/20 rounded" />
              </motion.div>

              <motion.div 
                animate={{ rotate: 8, x: -15, y: -10 }}
                className="glass-card bg-white/5 border-white/10 p-4 h-32 flex flex-col gap-2"
              >
                <CloudOff size={16} className="text-rose-400" />
                <div className="text-[10px] text-rose-400 font-bold uppercase">Broken_Link.txt</div>
                <div className="h-1.5 w-full bg-rose-400/20 rounded" />
                <div className="h-1.5 w-full bg-rose-400/20 rounded" />
              </motion.div>
            </div>

            {/* Floating Error Badges */}
            <div className="absolute bottom-12 right-12 flex flex-col gap-2">
              <div className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-2">
                <AlertCircle size={10} /> MISSING 3 FILES
              </div>
              <div className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-3 py-1 rounded-full border border-rose-500/30 flex items-center gap-2">
                <History size={10} /> 4 HOURS WASTED
              </div>
            </div>
          </div>

          {/* Before Labels */}
          <div className="absolute left-8 top-8 z-10">
            <motion.div 
              key={beforeText}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xl"
            >
              {beforeText}
            </motion.div>
          </div>
        </div>

        {/* After Side (Overlay) */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/80 via-[#0F172A] to-[#0F172A]"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          {/* Organized Mockup Content */}
          <div className="absolute inset-0 p-8">
            <div className="grid grid-cols-12 gap-4 h-full">
              {/* Sidebar */}
              <div className="col-span-3 space-y-4">
                <div className="glass-card p-4 h-full bg-white/10 border-white/20">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                      <span className="text-white font-bold text-[10px]">A</span>
                    </div>
                    <div className="h-2 w-16 bg-white/20 rounded" />
                  </div>
                  <div className="space-y-4">
                    {[Layout, BookOpen, Calendar, Target].map((Icon, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Icon size={14} className={i === 0 ? "text-primary" : "text-white/40"} />
                        <div className={cn("h-1.5 w-12 rounded", i === 0 ? "bg-primary/50" : "bg-white/10")} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="col-span-9 space-y-4">
                {/* Header Card */}
                <div className="glass-card p-6 bg-white/10 border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Sparkles size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">Biology 101: AI Summary</div>
                      <div className="text-emerald-400/80 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 size={12} /> Ready to study • 12 key concepts identified
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] text-white/60 font-bold">GENETICS</div>
                    <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] text-white/60 font-bold">EVOLUTION</div>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card p-4 bg-white/10 border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <Calendar size={16} className="text-primary" />
                      <span className="text-[10px] font-bold text-white/40 uppercase">Next Session</span>
                    </div>
                    <div className="text-white font-bold text-sm mb-1">Cell Division</div>
                    <div className="text-white/40 text-[10px]">Today, 4:00 PM</div>
                  </div>

                  <div className="glass-card p-4 bg-white/10 border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <Trophy size={16} className="text-accent" />
                      <span className="text-[10px] font-bold text-white/40 uppercase">Quiz Score</span>
                    </div>
                    <div className="text-white font-bold text-sm mb-1">92% Mastery</div>
                    <div className="h-1.5 w-full bg-white/10 rounded mt-2 overflow-hidden">
                      <div className="h-full bg-accent w-[92%]" />
                    </div>
                  </div>

                  <div className="glass-card p-4 bg-white/10 border-white/20">
                    <div className="flex justify-between items-start mb-4">
                      <Zap size={16} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-white/40 uppercase">Retention</span>
                    </div>
                    <div className="text-white font-bold text-sm mb-1">+35% Increase</div>
                    <div className="text-emerald-400/60 text-[10px]">Since last week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* After Labels */}
          <div className="absolute left-8 top-8 z-10">
            <motion.div 
              key={afterText}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xl"
            >
              {afterText}
            </motion.div>
          </div>
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white/50 z-20 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            {/* Dynamic Label */}
            <motion.div 
              initial={false}
              animate={{ 
                backgroundColor: sliderPos > 50 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(225, 29, 72, 0.8)',
                scale: [1, 1.05, 1]
              }}
              className="px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 shadow-2xl whitespace-nowrap"
            >
              <span className="text-white font-black tracking-tighter text-sm">
                {sliderPos > 50 ? 'AFTER' : 'BEFOURE'}
              </span>
            </motion.div>

            <div className="w-10 h-10 bg-surface rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20">
              <div className="flex gap-0.5 text-white">
                <ChevronLeft size={16} />
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center items-center gap-4 text-slate-500 text-sm italic">
        <MousePointer2 size={16} />
        Drag the slider to see the transformation
      </div>
    </div>
  );
};

// --- Option B: Stats Comparison ---

const StatsComparison = () => {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Before Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 bg-rose-500/5 border-rose-500/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingDown size={120} className="text-rose-600" />
          </div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400 mb-6">
              <Clock size={24} />
            </div>
            <div className="text-5xl font-bold text-rose-400 mb-2">
              <AnimatedNumber value={47} suffix="%" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
              Time wasted organizing notes
            </h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Average student spends 47% of study time searching for materials and organizing scattered notes.
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
                <span>Inefficiency Level</span>
                <span>47%</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '47%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* After Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 bg-emerald-500/5 border-emerald-500/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} className="text-emerald-600" />
          </div>

          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
              <Zap size={24} />
            </div>
            <div className="text-5xl font-bold text-emerald-400 mb-2">
              <AnimatedNumber value={3.2} suffix="x" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">
              Faster topic mastery
            </h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Aether users master complex concepts in 1/3 of the time compared to traditional study methods.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <span>Efficiency Level</span>
                <span>100%</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Practice questions generated", value: 10000, suffix: "+" },
          { label: "Average retention rate", value: 85, suffix: "%" },
          { label: "Exam types supported", value: 50, suffix: "+" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + (i * 0.1) }}
            className="text-center p-6 glass-card bg-white/5 border-white/10"
          >
            <div className="text-3xl font-bold text-white mb-1">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Option C: Transformation Timeline ---

const TransformationTimeline = () => {
  const steps = [
    {
      day: "Day 1",
      status: "Before",
      icon: FolderOpen,
      title: "Scattered Materials",
      description: "PDFs in email, notes in articles, videos saved for later. Chaos reigns.",
      visual: (
        <div className="grid grid-cols-3 gap-2 opacity-20 grayscale">
          <div className="h-8 bg-rose-400/20 rounded" />
          <div className="h-8 bg-rose-400/20 rounded" />
          <div className="h-8 bg-rose-400/20 rounded" />
        </div>
      )
    },
    {
      day: "Day 2",
      status: "Upload",
      icon: Upload,
      title: "Upload to Aether",
      description: "All materials in one place. AI starts processing and organizing everything.",
      visual: (
        <div className="flex justify-center">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary"
          >
            <FileUp size={20} />
          </motion.div>
        </div>
      )
    },
    {
      day: "Day 3-5",
      status: "Study",
      icon: BookOpen,
      title: "Follow Your Plan",
      description: "Daily reading schedule. Quizzes after each session to lock in knowledge.",
      visual: (
        <div className="flex gap-1 justify-center">
          {[1,2,3].map(i => (
            <div key={i} className="w-6 h-6 bg-emerald-500/10 rounded flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={12} />
            </div>
          ))}
        </div>
      )
    },
    {
      day: "Day 7",
      status: "After",
      icon: Trophy,
      title: "Exam Ready",
      description: "85% practice score. Confident, organized, and ready for test day.",
      visual: (
        <div className="flex justify-center">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-accent"
          >
            <Star size={24} fill="currentColor" />
          </motion.div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 z-0" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 relative">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl border border-white/10 backdrop-blur-md",
                  i === 0 ? "bg-rose-500/10 text-rose-400" : 
                  i === 3 ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                )}>
                  <step.icon size={28} />
                </div>
                <div className="absolute -top-3 -right-3 bg-surface shadow-md rounded-full px-2 py-0.5 text-[10px] font-bold border border-white/10 text-white">
                  {step.day}
                </div>
              </div>
              
              <div className="glass-card p-6 bg-white/5 border-white/10 w-full flex-grow">
                <div className={cn(
                  "text-[10px] font-bold uppercase tracking-widest mb-2",
                  i === 0 ? "text-rose-400" : i === 3 ? "text-accent" : "text-primary"
                )}>
                  {step.status}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{step.title}</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{step.description}</p>
                <div className="pt-4 border-t border-white/5">
                  {step.visual}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Parent Component ---

export default function BeforeAfterSection() {
  const [activeOption, setActiveOption] = useState<Option>('slider');

  const options: { id: Option; label: string; icon: any }[] = [
    { id: 'slider', label: 'Interactive Slider', icon: MousePointer2 },
    { id: 'stats', label: 'Stats Comparison', icon: Zap },
    { id: 'timeline', label: 'Student Timeline', icon: Calendar },
  ];

  return (
    <section className="py-24 bg-background overflow-hidden font-['Poppins',_sans-serif]">
      <div className="container mx-auto">
        <SectionHeader 
          eyebrow="REAL RESULTS. REAL STUDENTS."
          title="See What Happens When AI Organizes Your Studies"
          subtitle="No more scattered notes. No more cramming. Just a clear path to mastery."
        />

        {/* Option Selector */}
        <div className="flex justify-center mb-16 px-4">
          <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-2xl shadow-inner">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setActiveOption(opt.id)}
                className={cn(
                  "flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  activeOption === opt.id 
                    ? "bg-primary text-white shadow-lg" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                <opt.icon size={16} />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="relative min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeOption}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {activeOption === 'slider' && <BeforeAfterSlider />}
              {activeOption === 'stats' && <StatsComparison />}
              {activeOption === 'timeline' && <TransformationTimeline />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
