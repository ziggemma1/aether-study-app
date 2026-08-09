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
          className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl border border-border bg-surface text-text-main shadow-[var(--shadow-card-hover)] z-10"
        >
          {/* Header (Touch Close Target: 44px) */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <h2 className="text-base font-extrabold text-text-main tracking-tight">📤 Share with Community</h2>
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-alt text-text-muted hover:bg-surface-alt active:scale-95 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form container */}
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Material Title <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Set Theory Introduction"
                className="w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-sm text-text-main placeholder-text-muted outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Drag & Drop File Zone */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Upload File or Document
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : fileName 
                      ? 'border-accent/50 bg-accent/5' 
                      : 'border-border bg-surface-alt hover:border-primary/50'
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
                    <CheckCircle2 className="h-8 w-8 text-accent" />
                    <span className="text-xs font-bold text-text-main max-w-[250px] truncate">{fileName}</span>
                    <span className="text-[11px] text-text-muted">Ready to upload public copy</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 select-none">
                    <Upload className="h-8 w-8 text-text-muted" />
                    <span className="text-xs font-bold text-text-main">Drag & Drop or Click to Upload</span>
                    <span className="text-[11px] text-text-muted">Supports PDF, Lecture Notes, Images, or Text files</span>
                  </div>
                )}
              </div>
            </div>

            {/* Type and Subject selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Material Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary transition-all cursor-pointer"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-primary transition-all cursor-pointer"
                >
                  {SUBJECT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Description / Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a brief overview of this folder to help students search..."
                rows={3}
                className="w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-sm text-text-main placeholder-text-muted outline-none focus:border-primary transition-all resize-none"
              />
            </div>

            {/* Tags comma separated */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Comma-separated Tags
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. SetTheory, Algebra, Homework Help"
                className="w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-sm text-text-main placeholder-text-muted outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Toggle isPublic notice */}
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-2.5">
              <span className="text-base">🌐</span>
              <p className="text-[11px] text-text-muted leading-relaxed">
                By uploading, this folder is instantly published as <strong className="text-text-main">Public</strong>. Any community student can discover, bookmark, or clone it!
              </p>
            </div>

            {/* Actions Submit / Cancel */}
            <div className="flex gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-sm font-semibold text-text-muted bg-surface-alt hover:bg-surface-alt rounded-xl transition-all cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="flex-1 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl transition-all cursor-pointer min-h-[44px]"
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
