import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Youtube, BookOpen, Mic, X, CheckCircle2, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { extractTextFromImage } from '../services/OCRService';

export default function UploadMaterial() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'file' | 'youtube' | 'article' | 'voice' | 'ocr'>('file');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [ocrText, setOcrText] = React.useState('');
  const [isOcrProcessing, setIsOcrProcessing] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setIsSuccess(true);
      }
    }, 300);
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsOcrProcessing(true);
    try {
      const text = await extractTextFromImage(file);
      setOcrText(text);
    } catch (error) {
      console.error(error);
      alert('Failed to extract text. Please try again with a clearer photo.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const tabs = [
    { id: 'file', icon: Upload, label: 'PDF / File' },
    { id: 'ocr', icon: Camera, label: 'Snap & Scan' },
    { id: 'youtube', icon: Youtube, label: 'YouTube' },
    { id: 'article', icon: BookOpen, label: 'Articles' },
    { id: 'voice', icon: Mic, label: 'Voice' },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-3xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold mb-2 text-text-main">Upload Study Material</h1>
        <p className="text-text-muted">Upload a file, paste a YouTube link, or snap a photo of your notes.</p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap border border-border shadow-sm",
              activeTab === tab.id
                ? "bg-primary text-white shadow-md border-primary"
                : "bg-surface text-text-muted hover:bg-surface/80 hover:border-primary/30"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Area */}
      <div className="glass-card p-8 md:p-12">
        {isSuccess ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-text-main">Upload Successful!</h2>
            <p className="text-text-muted mb-8">Your material has been processed and summarized.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/library')}
                className="btn-primary"
              >
                View in Library
              </button>
              <button
                onClick={() => setIsSuccess(false)}
                className="btn-outline"
              >
                Upload More
              </button>
            </div>
          </motion.div>
        ) : isUploading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-4 text-text-main">Processing Material...</h2>
            <div className="max-w-xs mx-auto h-2 bg-surface rounded-full overflow-hidden border border-border">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-text-muted mt-4">Our AI is analyzing your content.</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {activeTab === 'ocr' && (
              <div className="space-y-6">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-primary/20 rounded-2xl p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer relative bg-surface/50">
                    <Camera className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                    <h3 className="font-bold mb-2 text-text-main">📸 Scan Physical Notes</h3>
                    <p className="text-sm text-text-muted">Take a photo or upload an image of your notes</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleOcrUpload}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative rounded-xl overflow-hidden border border-border bg-surface aspect-video flex items-center justify-center">
                      <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                      <button 
                        onClick={() => { setImagePreview(null); setOcrText(''); }}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {isOcrProcessing ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-sm font-medium text-text-muted">Processing image... extracting text.</p>
                      </div>
                    ) : ocrText ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold mb-2 text-text-main">Extracted Text (Edit if needed)</label>
                          <textarea
                            rows={8}
                            value={ocrText}
                            onChange={(e) => setOcrText(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none resize-none"
                          />
                        </div>
                        <button onClick={handleUpload} className="w-full btn-primary">Process Extracted Text</button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'file' && (
              <div className="border-2 border-dashed border-primary/20 rounded-2xl p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer relative bg-surface/50">
                <Upload className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                <h3 className="font-bold mb-2 text-text-main">Click or drag PDF to upload</h3>
                <p className="text-sm text-text-muted">Max file size: 20MB</p>
                <input type="file" className="hidden" />
                <button onClick={handleUpload} className="mt-8 btn-primary">Select File</button>
              </div>
            )}

            {activeTab === 'youtube' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-text-main">YouTube Video URL</label>
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none placeholder:text-text-muted"
                  />
                </div>
                <button onClick={handleUpload} className="w-full btn-primary">Process Video</button>
              </div>
            )}

            {activeTab === 'article' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 text-text-main">Article URL or Text</label>
                  <textarea
                    rows={6}
                    placeholder="Paste the article URL or content here..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text-main focus:ring-2 focus:ring-primary outline-none resize-none placeholder:text-text-muted"
                  />
                </div>
                <button onClick={handleUpload} className="w-full btn-primary">Summarize Article</button>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 cursor-pointer hover:scale-105 transition-transform border border-red-100">
                  <Mic size={40} />
                </div>
                <h3 className="font-bold mb-2 text-text-main">Record Audio Session</h3>
                <p className="text-sm text-text-muted mb-8">Record your lecture or study group discussion.</p>
                <button onClick={handleUpload} className="btn-primary">Start Recording</button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
