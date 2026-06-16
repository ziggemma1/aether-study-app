import React from 'react';
import { CalendarEventData } from '../../hooks/useCalendar';
import { CalendarCheck, Clock, BookOpen, CheckCircle } from 'lucide-react';

interface TodayFocusProps {
  events: CalendarEventData[];
  isInsideSidebar?: boolean;
}

export default function TodayFocus({ events, isInsideSidebar }: TodayFocusProps) {
  const todayEvents = events.filter(e => {
    const today = new Date();
    const eventDate = new Date(e.start);
    return eventDate.getDate() === today.getDate() &&
           eventDate.getMonth() === today.getMonth() &&
           eventDate.getFullYear() === today.getFullYear() &&
           !e.completed;
  });

  const Wrapper = isInsideSidebar ? 'div' : 'div';
  const wrapperClass = isInsideSidebar 
    ? "flex flex-col gap-2 relative" 
    : "bg-[#141A24] rounded-2xl p-6 border border-white/5 w-full shrink-0 flex flex-col gap-2 relative";

  return (
    <div className={wrapperClass}>
      <div className={isInsideSidebar ? "bg-[#0B0E14] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]" : ""}>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[#F0F3F8] font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
            🎯 Today's Focus Goal
          </h3>
        </div>
        
        {todayEvents.length === 0 ? (
          <div className="flex flex-col items-start justify-center text-left py-2">
            <p className="text-sm text-[#8E9AAF] mb-1">Great job! You've completed your high-priority tasks for today. 🎉</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            <p className="text-sm text-[#8E9AAF] mb-3 border-t border-[rgba(255,255,255,0.06)] pt-3">Keep going! You have pending tasks.</p>
            {todayEvents.map(e => (
              <div key={e._id || e.title} className="bg-[#141A24] rounded-lg p-3 border-l-2" style={{ borderLeftColor: e.color || '#6C5CE7' }}>
                <p className="font-medium text-sm text-white flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-[#8E9AAF]" /> {e.title}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#8E9AAF]">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {e.end && ` - ${new Date(e.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
