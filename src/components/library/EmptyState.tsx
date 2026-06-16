import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-[#141A24] border border-[#8E9AAF]/5">
      <div className="text-5xl mb-4">📚</div>
      <h3 className="text-lg font-bold text-[#F0F3F8] mb-2 tracking-tight">
        Your library is empty
      </h3>
      <p className="text-sm text-[#8E9AAF] max-w-sm mb-6 leading-relaxed">
        Upload your first PDF, note, or video to get started.
      </p>
      <button
        onClick={() => navigate('/upload')}
        id="empty-state-upload-btn"
        className="flex items-center gap-2 px-6 py-3.5 bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 active:scale-95 text-[#F0F3F8] text-sm font-semibold rounded-xl shadow-lg shadow-[#6C5CE7]/10 transition-all cursor-pointer min-h-[44px]"
      >
        <Upload size={16} />
        <span>Upload Material &rarr;</span>
      </button>
    </div>
  );
}
