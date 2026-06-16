import React, { useState, useMemo } from 'react';
import { useCalendar } from '../../hooks/useCalendar';
import GoogleSyncButton from './GoogleSyncButton';
import SmartSchedule from './SmartSchedule';
import TodayFocusSidebar from './TodayFocusSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateCalendarGrid, isMissedDay, isActiveDay } from '../../lib/calendar-utils';
import '../../styles/calendar.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarView() {
  const { events } = useCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Convert events to study dates
  const studyDates = useMemo(() => {
    return events
      .filter(e => e.type === 'study' || e.type === 'exam')
      .map(e => {
        const d = new Date(e.start);
        return d.toISOString().split('T')[0];
      });
  }, [events]);

  const grid = useMemo(() => generateCalendarGrid(year, month), [year, month]);

  const renderCalendarCell = ({ day, monthOffset }: { day: number, monthOffset: number }, index: number) => {
    const isCurrentMonth = monthOffset === 0;
    
    let cellDate = new Date(year, month, day);
    if (monthOffset === -1) cellDate = new Date(year, month - 1, day);
    else if (monthOffset === 1) cellDate = new Date(year, month + 1, day);

    const today = new Date();
    const isToday = 
      cellDate.getDate() === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear();

    const active = isActiveDay(cellDate, studyDates);
    const missed = isMissedDay(cellDate, studyDates);

    let className = 'date-cell';
    if (isCurrentMonth) className += ' current-month';
    else className += ' other-month';
    if (isToday) className += ' today';
    if (active) className += ' active';
    if (missed && !isToday && isCurrentMonth) className += ' missed';

    return (
      <div key={`${monthOffset}-${day}-${index}`} className={className}>
        <span className="date-number">{day}</span>
        {active && <span className="active-dot"></span>}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full text-[#F0F3F8] overflow-y-auto w-full custom-scrollbar pb-24 lg:pb-0 animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              📅 Smart Schedule
            </h1>
            <p className="text-[#8E9AAF] text-sm mt-1">AI-optimized for you</p>
          </div>
          <GoogleSyncButton />
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Main Calendar Area */}
        <div className="flex-1 bg-[#141A24] rounded-2xl p-6 border border-[rgba(255,255,255,0.06)] min-h-[500px] flex flex-col items-center">
          <div className="w-full max-w-sm calendar-container">
            <div className="flex items-center justify-between mb-6">
              <button onClick={handlePrevMonth} className="p-2 text-[#8E9AAF] hover:text-[#F0F3F8] transition-colors rounded-lg hover:bg-[#1A2230]">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="calendar-month-header m-0">
                {MONTHS[month]} {year}
              </h2>
              <button onClick={handleNextMonth} className="p-2 text-[#8E9AAF] hover:text-[#F0F3F8] transition-colors rounded-lg hover:bg-[#1A2230]">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="calendar-grid">
              {WEEKDAYS.map((day, i) => (
                <div key={i} className="weekday-label">{day}</div>
              ))}
              {grid.map(renderCalendarCell)}
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-[#8E9AAF]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00D2FF] shadow-[0_0_8px_rgba(0,210,255,0.4)]"></span>
                Active
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/15"></span>
                Missed
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#6C5CE7]"></span>
                Today
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-full lg:w-[35%] flex flex-col shrink-0">
          <TodayFocusSidebar events={events} />
        </div>
      </div>
    </div>
  );
}

