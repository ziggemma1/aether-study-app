import React, { useState, useEffect } from 'react';
import { CalendarEventData } from '../../hooks/useCalendar';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface EventModalProps {
  event: CalendarEventData | null;
  date: Date | null;
  onClose: () => void;
  onSave: (event: CalendarEventData) => void;
  onDelete: () => void;
}

export default function EventModal({ event, date, onClose, onSave, onDelete }: EventModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'study' | 'deadline' | 'personal' | 'exam'>('study');
  
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setType(event.type || 'study');
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      type,
      start: event?.start || date || new Date(),
      end: event?.end || new Date(new Date(date || new Date()).getTime() + 3600000),
      color: type === 'study' ? '#6C5CE7' : type === 'exam' ? '#FF5E7E' : type === 'deadline' ? '#F5B042' : '#00D2FF'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0E14]/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#141A24] border border-white/5 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-[#8E9AAF] hover:text-[#F0F3F8] hover:bg-[#1A2230] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-semibold text-[#F0F3F8] mb-6 flex items-center gap-2">
            ✏️ {event ? 'Edit Event' : 'Add Event'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#8E9AAF] mb-1.5">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[#0B0E14] border border-white/5 rounded-xl px-4 py-2.5 text-[#F0F3F8] focus:outline-none focus:border-[#6C5CE7] transition-colors"
                placeholder="e.g. Study: Purple Hibiscus"
                autoFocus
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#8E9AAF] mb-1.5">Type</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-[#0B0E14] border border-white/5 rounded-xl px-4 py-2.5 text-[#F0F3F8] focus:outline-none focus:border-[#6C5CE7] transition-colors appearance-none"
              >
                <option value="study">○ Study</option>
                <option value="deadline">● Deadline</option>
                <option value="exam">○ Exam</option>
                <option value="personal">○ Personal</option>
              </select>
            </div>
            
            <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-white/5">
              {event && (
                <button 
                  type="button"
                  onClick={onDelete}
                  className="px-5 py-2.5 text-[#FF5E7E] hover:bg-[#FF5E7E]/10 rounded-xl transition-colors font-medium border border-[#FF5E7E]/20"
                >
                  Delete
                </button>
              )}
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-[#8E9AAF] hover:text-[#F0F3F8] hover:bg-[#1A2230] rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 bg-[#6C5CE7] hover:bg-[#5B4CDB] text-white rounded-xl transition-all font-medium shadow-lg shadow-[#6C5CE7]/20"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
