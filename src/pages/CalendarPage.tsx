import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';
import CalendarWidget from '../components/CalendarWidget';
import SmartCalendarWidget from '../components/SmartCalendarWidget';
import GoogleCalendarSync from '../components/GoogleCalendarSync';
import ExportICS from '../components/ExportICS';
import SmartScheduleGenerator from '../components/SmartScheduleGenerator';
import StudyReminders from '../components/StudyReminders';

export default function CalendarPage() {
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in duration-500 overflow-y-auto no-scrollbar pb-20 lg:pb-0">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[45%] h-full flex flex-col gap-4">
          <CalendarWidget className="h-[500px] shrink-0" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GoogleCalendarSync />
            <ExportICS />
          </div>
          <StudyReminders />
          <Link 
            to="/calendar-analytics" 
            className="flex items-center justify-center gap-2 py-3 bg-surface border border-border/50 text-text-main rounded-xl text-sm font-bold transition-colors hover:bg-surface-alt mt-2"
          >
            <BarChart2 size={16} className="text-primary" /> View Calendar Analytics
          </Link>
        </div>
        <div className="lg:w-[55%] h-full flex flex-col gap-4">
          <SmartScheduleGenerator />
          <SmartCalendarWidget className="h-[460px] shrink-0" />
        </div>
      </div>
    </div>
  );
}
