import React, { useState } from 'react';
import { Sliders, Calendar, CalendarDays, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsFormProps {
  startDate: string;
  setStartDate: (val: string) => void;
  duration: number;
  setDuration: (val: number) => void;
  goal: string;
  setGoal: (val: string) => void;
  complexity: string;
  setComplexity: (val: string) => void;
  commitment: number;
  setCommitment: (val: number) => void;
  preferredTime: string;
  setPreferredTime: (val: string) => void;
  focusAreas: string[];
  setFocusAreas: (val: string[]) => void;
  calendarSync: boolean;
  setCalendarSync: (val: boolean) => void;
}

export default function SettingsForm({
  startDate,
  setStartDate,
  duration,
  setDuration,
  goal,
  setGoal,
  complexity,
  setComplexity,
  commitment,
  setCommitment,
  preferredTime,
  setPreferredTime,
  focusAreas,
  setFocusAreas,
  calendarSync,
  setCalendarSync,
}: SettingsFormProps) {
  const [focusInput, setFocusInput] = useState('');

  const handleAddFocusArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (focusInput.trim() && !focusAreas.includes(focusInput.trim())) {
      setFocusAreas([...focusAreas, focusInput.trim()]);
      setFocusInput('');
    }
  };

  const handleRemoveFocusArea = (tag: string) => {
    setFocusAreas(focusAreas.filter((item) => item !== tag));
  };

  return (
    <div className="bg-[#141A24] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 shadow-xl">
      <h3 className="text-sm font-extrabold text-[#F0F3F8] flex items-center gap-2 mb-4 pb-3 border-b border-gray-800/65">
        <Sliders className="w-5 h-5 text-[#00D2FF]" />
        Configure Study Settings
      </h3>

      <div className="space-y-4 text-xs font-semibold text-[#F0F3F8]">
        {/* Row for Date and Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-[#8E9AAF] text-xs font-bold mb-1.5 uppercase font-mono tracking-wider">
              Start Date
            </label>
            <div className="flex items-center bg-[#0B0E14] border border-gray-800 rounded-xl px-3 py-2 min-h-[44px]">
              <Calendar className="w-4 h-4 text-[#6C5CE7] mr-2" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-[#F0F3F8] outline-none flex-grow"
              />
            </div>
          </div>

          {/* Duration in Days */}
          <div>
            <label className="block text-[#8E9AAF] text-xs font-bold mb-1.5 uppercase font-mono tracking-wider">
              Study Duration (1-90 Days)
            </label>
            <div className="flex items-center bg-[#0B0E14] border border-gray-800 rounded-xl px-3 py-1 min-h-[44px]">
              <input
                type="number"
                min="1"
                max="90"
                value={duration}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setDuration(isNaN(val) ? 7 : Math.min(90, Math.max(1, val)));
                }}
                className="w-full bg-transparent text-xs text-[#F0F3F8] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="flex flex-col border-l border-gray-800 pl-2 ml-1">
                <button
                  type="button"
                  onClick={() => setDuration(Math.min(90, duration + 1))}
                  className="p-1 text-gray-400 hover:text-white min-h-[16px]"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => setDuration(Math.max(1, duration - 1))}
                  className="p-1 text-gray-400 hover:text-white min-h-[16px]"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Goal */}
        <div>
          <label className="block text-[#8E9AAF] text-xs font-bold mb-1.5 uppercase font-mono tracking-wider">
            Learning Goal
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {['Exam Prep', 'Deep Dive', 'Quick Review'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setGoal(opt)}
                className={cn(
                  "py-2.5 rounded-xl border text-center transition-all font-bold select-none cursor-pointer min-h-[40px] text-[11px]",
                  goal === opt
                    ? "bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-lg shadow-[#6C5CE7]/20"
                    : "bg-[#0B0E14] border-gray-800 text-gray-400 hover:text-white"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Complexity Level */}
        <div>
          <label className="block text-[#8E9AAF] text-xs font-bold mb-1.5 uppercase font-mono tracking-wider">
            Complexity Level
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {['Beginner', 'Intermediate', 'Advanced'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setComplexity(opt)}
                className={cn(
                  "py-2.5 rounded-xl border text-center transition-all font-bold select-none cursor-pointer min-h-[40px] text-[11px]",
                  complexity === opt
                    ? "bg-[#00D2FF] border-[#00D2FF] text-[#0B0E14] shadow-lg shadow-[#00D2FF]/20"
                    : "bg-[#0B0E14] border-gray-800 text-gray-400 hover:text-white"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Commitment */}
        <div>
          <label className="block text-[#8E9AAF] text-xs font-bold mb-1.5 uppercase font-mono tracking-wider">
            Daily commitment
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: '30m', value: 30 },
              { label: '1h', value: 60 },
              { label: '2h', value: 120 },
              { label: '4h+', value: 240 },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCommitment(opt.value)}
                className={cn(
                  "py-2.5 rounded-xl border text-center transition-all font-bold select-none cursor-pointer min-h-[40px] text-xs",
                  commitment === opt.value
                    ? "bg-[#6C5CE7] border-[#6C5CE7] text-white shadow-lg shadow-[#6C5CE7]/20"
                    : "bg-[#0B0E14] border-gray-800 text-gray-400 hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Study Time */}
        <div>
          <label className="block text-[#8E9AAF] text-xs font-bold mb-1.5 uppercase font-mono tracking-wider">
            Preferred Study Time (optional)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {['Morning', 'Afternoon', 'Evening', 'Night'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setPreferredTime(opt)}
                className={cn(
                  "py-2.5 rounded-xl border text-center transition-all font-bold select-none cursor-pointer min-h-[40px] text-[11px]",
                  preferredTime === opt
                    ? "bg-slate-300 border-slate-300 text-slate-900 shadow-md shadow-white/5"
                    : "bg-[#0B0E14] border-gray-800 text-gray-400 hover:text-white"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block text-[#8E9AAF] text-xs font-bold mb-1 uppercase font-mono tracking-wider">
            Focus Areas (optional)
          </label>
          <form
            onSubmit={handleAddFocusArea}
            className="flex bg-[#0B0E14] border border-gray-800 rounded-xl overflow-hidden px-1 py-1 min-h-[44px]"
          >
            <input
              type="text"
              placeholder="e.g., Set Notation, Calculus..."
              value={focusInput}
              onChange={(e) => setFocusInput(e.target.value)}
              className="flex-grow bg-transparent text-xs text-[#F0F3F8] outline-none px-2.5 placeholder-gray-700"
            />
            <button
              type="submit"
              className="bg-[#6C5CE7] text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-[#6C5CE7]/95 transition-all min-h-[36px] cursor-pointer"
            >
              Add
            </button>
          </form>
          {focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {focusAreas.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-gray-800 border border-gray-700 text-gray-300 text-[11px] px-2.5 py-1 rounded-full font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveFocusArea(tag)}
                    className="p-0.5 rounded-full hover:bg-gray-700 cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5 text-gray-500 hover:text-white" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Calendar Sync Toggle */}
        <div className="flex items-center justify-between bg-[#0B0E14] border border-gray-800 rounded-xl p-3 mt-2">
          <div>
            <p className="text-xs font-bold text-[#F0F3F8] flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-[#00E5A0]" />
              Enable Calendar Sync
            </p>
            <p className="text-[11px] text-gray-500 font-medium">Auto-add scheduled study sessions to calendar</p>
          </div>
          <button
            type="button"
            onClick={() => setCalendarSync(!calendarSync)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              calendarSync ? "bg-[#00E5A0]" : "bg-gray-800"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                calendarSync ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
