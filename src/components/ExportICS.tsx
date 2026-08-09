import React, { useState } from 'react';
import { Download, FileDown, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ExportICS() {
  const { studySessions } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const handleExport = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Aether Study//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];

      (studySessions || []).forEach((session: any) => {
        const start = formatICSDate(new Date(session.startTime));
        const end = formatICSDate(new Date(session.endTime || new Date(new Date(session.startTime).getTime() + 60 * 60 * 1000)));
        const now = formatICSDate(new Date());

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:${session._id || session.id || Math.random().toString(36).substr(2, 9)}@aetherstudy.app`,
          `DTSTAMP:${now}`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `SUMMARY:${session.title || 'Study Session'}`,
          `DESCRIPTION:${session.description || 'Aether Study Session'}`,
          'END:VEVENT'
        );
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'aether_study_plan.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    }, 500); // Small delay for UX simulation
  };

  return (
    <div className="bg-surface/50 border border-border/30 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-brand-orange">
          <FileDown size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-main">Export iCal</h3>
          <p className="text-[11px] text-text-muted">For Apple Calendar, Outlook</p>
        </div>
      </div>

      <button 
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-alt hover:bg-surface border border-border/50 text-text-main rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
      >
        {exported ? (
          <><CheckCircle2 size={14} className="text-accent" /> Exported successfully</>
        ) : (
          <><Download size={14} /> Download .ics file</>
        )}
      </button>
    </div>
  );
}
