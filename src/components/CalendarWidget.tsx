import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ChevronDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  setMonth,
  setYear,
  getYear
} from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type DayStatus = 'none' | 'attended' | 'missed';

interface DayData {
  status: DayStatus;
  time?: string;
  note?: string;
}

interface CalendarWidgetProps {
  className?: string;
}

export default function CalendarWidget({ className }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [dayData, setDayData] = useState<Record<string, DayData>>({
    // Mock some data
    [format(new Date(), 'yyyy-MM-dd')]: { status: 'attended', time: '10:00 AM' },
    [format(subMonths(new Date(), 0), 'yyyy-MM-12')]: { status: 'missed', time: '02:00 PM' },
    [format(subMonths(new Date(), 0), 'yyyy-MM-13')]: { status: 'missed', time: '02:00 PM' },
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const updateDayStatus = (date: Date, status: DayStatus) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setDayData(prev => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], status }
    }));
  };

  const updateDayTime = (date: Date, time: string) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setDayData(prev => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], time }
    }));
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 5 + i);

  // Function to check if two dates are consecutive missed days
  const areConsecutiveMissed = (day1: Date, day2: Date) => {
    const key1 = format(day1, 'yyyy-MM-dd');
    const key2 = format(day2, 'yyyy-MM-dd');
    return dayData[key1]?.status === 'missed' && dayData[key2]?.status === 'missed';
  };

  return (
    <div className={cn("glass-card p-4 sm:p-6 flex flex-col relative overflow-hidden border-border/30 dark:bg-surface/30 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary">
            <CalendarIcon size={16} className="sm:hidden" />
            <CalendarIcon size={20} className="hidden sm:block" />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-text-main leading-tight">Calendar</h2>
            <p className="text-[8px] sm:text-[10px] font-bold text-text-muted/70 uppercase tracking-wider">Management</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-surface-alt/40 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium text-text-main border border-border/30 hover:border-primary/20 transition-all"
            >
              {format(currentDate, 'MMM yyyy')}
              <ChevronDown size={12} className={cn("transition-transform opacity-60", showMonthPicker && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showMonthPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 p-4 grid grid-cols-3 gap-2"
                >
                  {months.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => {
                        setCurrentDate(setMonth(currentDate, i));
                        setShowMonthPicker(false);
                      }}
                      className={cn(
                        "text-[10px] font-bold py-2 rounded-lg transition-all",
                        currentDate.getMonth() === i 
                          ? "bg-primary text-white" 
                          : "text-text-muted hover:bg-surface-alt/40 hover:text-text-main"
                      )}
                    >
                      {m.substring(0, 3)}
                    </button>
                  ))}
                  <div className="col-span-3 h-px bg-border my-1" />
                  {years.map((y) => (
                    <button
                      key={y}
                      onClick={() => {
                        setCurrentDate(setYear(currentDate, y));
                        setShowMonthPicker(false);
                      }}
                      className={cn(
                        "text-[10px] font-bold py-2 rounded-lg transition-all",
                        getYear(currentDate) === y 
                          ? "bg-primary text-white" 
                          : "text-text-muted hover:bg-surface-alt/40 hover:text-text-main"
                      )}
                    >
                      {y}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center bg-surface-alt/20 rounded-xl border border-border/30 p-0.5">
            <button onClick={prevMonth} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted/70">
              <ChevronLeft size={14} />
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-surface rounded-lg transition-colors text-text-muted/70">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-grow flex flex-col">
        <div className="grid grid-cols-7 mb-2 sm:mb-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <span key={i} className="text-[8px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-transparent rounded-xl sm:rounded-2xl overflow-hidden border border-border/20 relative">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const data = dayData[dateKey];
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            // Check for consecutive missed days (horizontal connection)
            const isMissed = data?.status === 'missed';
            const prevDay = calendarDays[idx - 1];
            const nextDay = calendarDays[idx + 1];
            const hasPrevMissed = prevDay && areConsecutiveMissed(day, prevDay) && idx % 7 !== 0;
            const hasNextMissed = nextDay && areConsecutiveMissed(day, nextDay) && idx % 7 !== 6;

            return (
              <div 
                key={dateKey} 
                className={cn(
                  "relative aspect-square p-0.5 sm:p-1 flex flex-col items-center justify-center transition-all cursor-pointer group",
                  isCurrentMonth ? "bg-surface-alt/20" : "bg-surface-alt/5 opacity-30",
                  isSelected && "z-10 ring-1 ring-primary/40 ring-inset"
                )}
                onClick={() => handleDateClick(day)}
              >
                {/* Consecutive Missed Connection (Subtle Red Rectangle) */}
                {isMissed && (
                  <>
                    {hasPrevMissed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-5 sm:h-7 bg-red-400/10 z-0" />
                    )}
                    {hasNextMissed && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-5 sm:h-7 bg-red-400/10 z-0" />
                    )}
                    <div className="absolute inset-x-1 sm:inset-x-1.5 top-1/2 -translate-y-1/2 h-5 sm:h-7 bg-red-400/10 z-0 rounded-sm sm:rounded-md" />
                  </>
                )}

                <span className={cn(
                  "relative z-10 text-[10px] sm:text-xs font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-all",
                  isToday(day) && !isMissed && data?.status !== 'attended' && "bg-primary text-white shadow-sm shadow-primary/20",
                  data?.status === 'attended' && "bg-green-500 text-white shadow-sm shadow-green-500/20",
                  data?.status === 'missed' && "bg-red-500 text-white shadow-sm shadow-red-500/20",
                  !isToday(day) && !data?.status && "text-text-main group-hover:bg-surface-alt/50"
                )}>
                  {format(day, 'd')}
                </span>

                {data?.time && (
                  <span className="absolute bottom-0.5 text-[7px] font-medium text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.time}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Editor Modal/Panel */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-72 bg-surface border-t sm:border-t-0 sm:border-l border-border/50 shadow-2xl z-40 p-4 sm:p-6 flex flex-col rounded-t-3xl sm:rounded-none"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-text-main">{format(selectedDate, 'EEEE')}</h3>
                <p className="text-[10px] sm:text-xs text-text-muted">{format(selectedDate, 'MMMM d, yyyy')}</p>
              </div>
              <button 
                onClick={() => setSelectedDate(null)}
                className="p-1.5 sm:p-2 hover:bg-surface-alt rounded-full transition-colors text-text-muted"
              >
                <X size={16} className="sm:hidden" />
                <X size={18} className="hidden sm:block" />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6 flex-grow">
              <div className="space-y-2 sm:space-y-3">
                <label className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => updateDayStatus(selectedDate, 'attended')}
                    className={cn(
                      "flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all",
                      dayData[format(selectedDate, 'yyyy-MM-dd')]?.status === 'attended'
                        ? "bg-green-500/10 border-green-500/40 text-green-600"
                        : "bg-surface-alt/50 border-border/50 text-text-muted hover:border-green-500/30"
                    )}
                  >
                    <CheckCircle2 size={16} className="sm:hidden" />
                    <CheckCircle2 size={18} className="hidden sm:block" />
                    <span className="text-[9px] sm:text-[10px] font-bold">Attended</span>
                  </button>
                  <button 
                    onClick={() => updateDayStatus(selectedDate, 'missed')}
                    className={cn(
                      "flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all",
                      dayData[format(selectedDate, 'yyyy-MM-dd')]?.status === 'missed'
                        ? "bg-red-500/10 border-red-500/40 text-red-600"
                        : "bg-surface-alt/50 border-border/50 text-text-muted hover:border-red-500/30"
                    )}
                  >
                    <AlertCircle size={16} className="sm:hidden" />
                    <AlertCircle size={18} className="hidden sm:block" />
                    <span className="text-[9px] sm:text-[10px] font-bold">Missed</span>
                  </button>
                  <button 
                    onClick={() => updateDayStatus(selectedDate, 'none')}
                    className={cn(
                      "flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all",
                      !dayData[format(selectedDate, 'yyyy-MM-dd')]?.status || dayData[format(selectedDate, 'yyyy-MM-dd')]?.status === 'none'
                        ? "bg-surface-alt/50 border-primary/40 text-primary"
                        : "bg-surface-alt/50 border-border/50 text-text-muted hover:border-primary/30"
                    )}
                  >
                    <X size={16} className="sm:hidden" />
                    <X size={18} className="hidden sm:block" />
                    <span className="text-[9px] sm:text-[10px] font-bold">Clear</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-wider">Set Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input 
                    type="time" 
                    value={dayData[format(selectedDate, 'yyyy-MM-dd')]?.time || ''}
                    onChange={(e) => updateDayTime(selectedDate, e.target.value)}
                    className="w-full bg-surface-alt/30 border border-border rounded-lg sm:rounded-xl py-2 sm:py-2.5 pl-9 sm:pl-10 pr-4 text-xs sm:text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-primary/5 rounded-xl sm:rounded-2xl border border-primary/10">
                <p className="text-[9px] sm:text-[10px] text-primary font-bold leading-tight">
                  Tip: Consecutive missed days will be linked with a red connection to highlight gaps.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setSelectedDate(null)}
              className="w-full btn-primary py-2.5 sm:py-3 text-xs sm:text-sm mt-4"
            >
              Save Changes
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
