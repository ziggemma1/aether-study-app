import React from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Crown, 
  Sparkles, 
  BookOpen, 
  Camera, 
  ArrowRight, 
  PlayCircle, 
  CheckCircle2, 
  Award, 
  Users2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import MessagesList from '../components/MessagesList';
import CalendarWidget from '../components/CalendarWidget';
import SmartCalendarWidget from '../components/SmartCalendarWidget';

import { 
  QuizScoreCard, 
  TimeSpentCard, 
  StreakCard, 
  RankingCard, 
  EnrollmentChart 
} from '../components/OverviewWidgets';

export default function Dashboard() {
  const { user, theme } = useAppContext();
  const isLight = theme === 'light';

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-text-main tracking-tight">
          Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] || "Robert"}</span>!
        </h1>
        <p className="text-text-muted text-sm md:text-base max-w-2xl leading-relaxed">
          It's a great day to stay productive. Manage your tasks and explore your tools today.
        </p>
      </div>

      {/* 1. Overview Section - Redesigned Widgets */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-main">Overview</h2>
          <Link to="/reports" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-2">
            View Detailed Reports <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/reports" className="block">
            <TimeSpentCard />
          </Link>
          <Link to="/reports" className="block">
            <QuizScoreCard />
          </Link>
          <Link to="/reports" className="block">
            <StreakCard />
          </Link>
          <Link to="/reports" className="block">
            <RankingCard />
          </Link>
        </div>

        {/* Calendar & Smart Feature in 2:1 Ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <CalendarWidget className="h-[420px]" />
          </div>
          <div className="lg:col-span-4">
            <SmartCalendarWidget className="h-[420px]" />
          </div>
        </div>
      </section>

      {/* 2. Middle Section - Messages & Quick Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Messages - Left (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text-main">Messages</h2>
          <MessagesList className="h-[420px]" />
        </div>

        {/* Quick Tools - Right (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-text-main">Quick Tools</h2>
          <div className="flex flex-col gap-4 h-[420px]">
            <Link to="/upload" className="glass-card p-6 group hover:border-primary/50 transition-all relative overflow-hidden flex-1 flex items-center">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-6 relative z-10 w-full">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Camera size={28} />
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-text-main mb-1">Snap & Scan</h3>
                  <p className="text-xs text-text-muted max-w-md">Transform your physical notes into interactive digital study guides with AI-powered scanning.</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                  <ArrowRight size={20} className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            <Link to="/curriculum" className="glass-card p-6 group hover:border-secondary/50 transition-all relative overflow-hidden flex-1 flex items-center">
              <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-6 relative z-10 w-full">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shrink-0">
                  <BookOpen size={28} />
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-text-main mb-1">Curriculum Library</h3>
                  <p className="text-xs text-text-muted max-w-md">Access your entire collection of courses, study materials, and AI-generated resources in one place.</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-secondary group-hover:bg-secondary/5 transition-all">
                  <ArrowRight size={20} className="text-text-muted group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
