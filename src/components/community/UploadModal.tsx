import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (formData: {
    title: string;
    type: string;
    summary: string;
    content: string;
    keyTopics: string[];
    category: string;
  }) => Promise<{ success: boolean }>;
}

const TYPE_OPTIONS = [
  { value: 'note', label: 'Notes / Essay' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'flashcards', label: 'Flashcards Set' },
  { value: 'video', label: 'Video Lecture' }
];

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Biology",
  "English Literature",
  "General Education",
  "History"
];

export function UploadModal({ onClose, onUpload }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('note');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    
    // Parse tags list
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const result = await onUpload({
      title,
      type,
      summary,
      content: content || `Aether community study material for ${title}. Includes deep dive questions.`,
      keyTopics: parsedTags.length > 0 ? parsedTags : [subject, "Community"],
      category: subject
    });

    setIsSubmitting(false);
    if (result.success) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0B0E14]/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl border border-[#8E9AAF]/10 bg-[#141A24] text-[#F0F3F8] shadow-2xl z-10"
        >
          {/* Header (Touch Close Target: 44px) */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#8E9AAF]/5">
            <h2 className="text-base font-extrabold text-[#F0F3F8] tracking-tight">📤 Share with Community</h2>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8E9AAF]/5 text-[#8E9AAF] hover:bg-[#8E9AAF]/10 active:scale-95 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form container */}
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8E9AAF] mb-1.5">
                Material Title <span className="text-[#6C5CE7]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Set Theory Introduction"
                className="w-full bg-[#0B0E14] border border-[#8E9AAF]/10 rounded-xl px-4 py-3 text-sm text-[#F0F3F8] placeholder-[#8E9AAF]/40 outline-none focus:border-[#6C5CE7] transition-all"
              />
            </div>

            {/* Drag & Drop File Zone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8E9AAF] mb-1.5">
                Upload File or Document
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  dragActive 
                    ? 'border-[#6C5CE7] bg-[#6C5CE7]/5' 
                    : fileName 
                      ? 'border-[#00E5A0]/50 bg-[#00E5A0]/5' 
                      : 'border-[#8E9AAF]/10 bg-[#0B0E14] hover:border-[#6C5CE7]/50'
                }`}
                onClick={() => document.getElementById('community-file-uploader')?.click()}
              >
                <input
                  id="community-file-uploader"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {fileName ? (
                  <div className="flex flex-col items-center gap-1.5 select-none">
                    <CheckCircle2 className="h-8 w-8 text-[#00E5A0]" />
                    <span className="text-xs font-bold text-[#F0F3F8] max-w-[250px] truncate">{fileName}</span>
                    <span className="text-[10px] text-[#8E9AAF]">Ready to upload public copy</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 select-none">
                    <Upload className="h-8 w-8 text-[#8E9AAF]" />
                    <span className="text-xs font-bold text-[#F0F3F8]">Drag & Drop or Click to Upload</span>
                    <span className="text-[10px] text-[#8E9AAF]/60">Supports PDF, Lecture Notes, Images, or Text files</span>
                  </div>
                )}
              </div>
            </div>

            {/* Type and Subject selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8E9AAF] mb-1.5">
                  Material Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#8E9AAF]/10 rounded-xl px-4 py-3 text-sm text-[#F0F3F8] outline-none focus:border-[#6C5CE7] transition-all cursor-pointer"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8E9AAF] mb-1.5">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-[#8E9AAF]/10 rounded-xl px-4 py-3 text-sm text-[#F0F3F8] outline-none focus:border-[#6C5CE7] transition-all cursor-pointer"
                >
                  {SUBJECT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8E9AAF] mb-1.5">
                Description / Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a brief overview of this folder to help students search..."
                rows={3}
                className="w-full bg-[#0B0E14] border border-[#8E9AAF]/10 rounded-xl px-4 py-3 text-sm text-[#F0F3F8] placeholder-[#8E9AAF]/40 outline-none focus:border-[#6C5CE7] transition-all resize-none"
              />
            </div>

            {/* Tags comma separated */}
            <div>
              <label className="block text-[#8E9AAF] text-xs font-bold uppercase tracking-wider mb-1.5">
                Comma-separated Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. SetTheory, Algebra, Homework Help"
                className="w-full bg-[#0B0E14] border border-[#8E9AAF]/10 rounded-xl px-4 py-3 text-sm text-[#F0F3F8] placeholder-[#8E9AAF]/40 outline-none focus:border-[#6C5CE7] transition-all"
              />
            </div>

            {/* Toggle isPublic notice */}
            <div className="p-3 bg-[#6C5CE7]/5 rounded-xl border border-[#6C5CE7]/10 flex items-start gap-2.5">
              <span className="text-base">🌐</span>
              <p className="text-[11px] text-[#8E9AAF] leading-relaxed">
                By uploading, this folder is instantly published as <strong className="text-[#F0F3F8]">Public</strong>. Any community student can discover, bookmark, or clone it!
              </p>
            </div>

            {/* Actions Submit / Cancel */}
            <div className="flex gap-2.5 pt-3 border-t border-[#8E9AAF]/5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-[#8E9AAF] bg-[#8E9AAF]/5 hover:bg-[#8E9AAF]/10 rounded-xl transition-all cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-[#F0F3F8] bg-[#6C5CE7] hover:bg-[#6C5CE7]/90 disabled:opacity-50 rounded-xl shadow-lg transition-all cursor-pointer min-h-[44px]"
              >
                {isSubmitting ? 'Sharing...' : 'Share Note'}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
