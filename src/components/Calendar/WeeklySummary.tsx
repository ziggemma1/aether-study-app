import React from 'react';
import { CalendarEventData } from '../../hooks/useCalendar';
import { BarChart2, Calendar } from 'lucide-react';

interface WeeklySummaryProps {
  events: CalendarEventData[];
  isInsideSidebar?: boolean;
}

export default function WeeklySummary({ events, isInsideSidebar }: WeeklySummaryProps) {
  // Simplified weekly stats mock logic for demonstration
  const upcomingEvents = events.filter(e => new Date(e.start) > new Date()).slice(0, 3);

  const wrapperClass = isInsideSidebar
    ? "flex flex-col gap-6"
    : "bg-[#141A24] rounded-2xl p-6 border border-white/5 w-full shrink-0 flex flex-col gap-6";

  return (
    <div className={wrapperClass}>
      <div className="bg-[#0B0E14] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-[#F0F3F8] font-semibold text-sm uppercase tracking-wide flex items-center gap-2 mb-4">
          📊 This Week
        </h3>
        
        <div className="grid grid-cols-3 gap-2 border-t border-[rgba(255,255,255,0.06)] pt-4">
          <div className="flex flex-col items-center justify-center text-center border-r border-[rgba(255,255,255,0.06)]">
            <span className="text-xs text-[#8E9AAF] mb-1">Studied</span>
            <span className="text-[#6C5CE7] font-bold text-sm text-center">5h 30m</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-r border-[rgba(255,255,255,0.06)]">
            <span className="text-xs text-[#8E9AAF] mb-1">Streak</span>
            <span className="text-[#F5B042] font-bold text-sm">🔥 7</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-xs text-[#8E9AAF] mb-1">Quizzes</span>
            <span className="text-[#00D2FF] font-bold text-sm text-center">2</span>
          </div>
        </div>
      </div>

      <div className="bg-[#0B0E14] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
        <h3 className="text-[#F0F3F8] font-semibold text-sm uppercase tracking-wide flex items-center gap-2 mb-4">
          📅 Upcoming Events
        </h3>
        
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-[#8E9AAF]">● No upcoming events</p>
        ) : (
          <ul className="space-y-3 text-sm text-[#8E9AAF]">
            {upcomingEvents.map(e => (
              <li key={e._id || e.title} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full block shrink-0" style={{ backgroundColor: e.color || '#6C5CE7' }} />
                <span className="text-white flex-1 truncate">{e.title}</span>
                <span className="text-xs text-[#8E9AAF] shrink-0">
                  {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
