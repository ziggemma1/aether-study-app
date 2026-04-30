import React from 'react';
import CalendarWidget from '../components/CalendarWidget';
import SmartCalendarWidget from '../components/SmartCalendarWidget';

export default function CalendarPage() {
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      <div className="lg:w-[45%] h-full">
        <CalendarWidget className="h-full" />
      </div>
      <div className="lg:w-[55%] h-full">
        <SmartCalendarWidget className="h-full" />
      </div>
    </div>
  );
}
