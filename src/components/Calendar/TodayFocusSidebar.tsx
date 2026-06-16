import React from 'react';
import { CalendarEventData } from '../../hooks/useCalendar';
import TodayFocus from './TodayFocus';
import WeeklySummary from './WeeklySummary';
import SmartSchedule from './SmartSchedule';

interface TodayFocusSidebarProps {
  events: CalendarEventData[];
}

export default function TodayFocusSidebar({ events }: TodayFocusSidebarProps) {
  return (
    <div className="bg-[#141A24] rounded-2xl p-6 border border-[rgba(255,255,255,0.06)] w-full flex flex-col gap-8 shrink-0">
      <TodayFocus events={events} isInsideSidebar={true} />
      <WeeklySummary events={events} isInsideSidebar={true} />
      <SmartSchedule isInsideSidebar={true} />
    </div>
  );
}
