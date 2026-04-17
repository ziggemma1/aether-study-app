import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Youtube, BookOpen, Mic, X, CheckCircle2, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { extractTextFromImage } from '../services/OCRService';
import { analyzeStudyMaterialOnClient, generateVisualAidOnClient, generateTopicSectionOnClient } from '../lib/gemini';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs using unpkg which is often more reliable for ES modules
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

export default function UploadMaterial() {
  const navigate = useNavigate();
  const { user, materials, setMaterials } = useAppContext();
  const [activeTab, setActiveTab] = React.useState<'file' | 'youtube' | 'article' | 'voice' | 'ocr'>('file');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [ocrText, setOcrText] = React.useState('');
  const [isOcrProcessing, setIsOcrProcessing] = React.useState(false);
  const [isPdfProcessing, setIsPdfProcessing] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [content, setContent] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const ocrInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (materialTitle: string, materialType: string, materialContent?: string) => {
    if (!user) {
      alert('Please log in to upload materials.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    console.log('Starting upload:', { materialTitle, materialType, hasContent: !!materialContent });

    try {
      let finalContent = materialContent || '';
      
      if (materialType === 'youtube' && url) {
        finalContent = `YouTube Video URL: ${url}`;
      }
      
      if (materialType === 'audio' && !finalContent) {
        finalContent = 'Voice recording session started.';
      }

      setUploadProgress(30);
      console.log('Analyzing material with AI (Summary Only)...');
      
      // AI Analysis via client - Fast summary and topics only
      let analysis: any;
      try {
        analysis = await analyzeStudyMaterialOnClient(finalContent || materialTitle, materialTitle);
        console.log('Summary & Simple Detailed Notes Analysis successful');
        
        // Initial state for simple view
        analysis.noteSections = [];
        analysis.visualAidUrl = '';

      } catch (aiErr: any) {
        console.warn('AI Analysis failed, using fallback:', aiErr);
        analysis = {
          summary: finalContent ? finalContent.substring(0, 200) + '...' : `Study material for ${materialTitle}`,
          keyTopics: [],
          realLifeApplications: [],
          detailedNotes: '',
          noteSections: [],
          visualAidUrl: '',
          suggestedQuizQuestions: []
        };
      }
      
      setUploadProgress(70);
      console.log('Saving material to database...');

      const response = await api.post('/materials', {
        title: materialTitle || 'Untitled Material',
        type: materialType,
        content: finalContent,
        summary: analysis.summary,
        keyTopics: analysis.keyTopics,
        realLifeApplications: analysis.realLifeApplications,
        detailedNotes: analysis.detailedNotes,
        noteSections: analysis.noteSections,
        visualAidUrl: analysis.visualAidUrl,
        suggestedQuizQuestions: analysis.suggestedQuizQuestions
      });

      console.log('Material saved successfully:', response.data);
      
      // Update local context immediately
      const newMaterial = {
        ...response.data,
        id: response.data._id || response.data.id,
        uploadDate: new Date().toLocaleDateString()
      };
      setMaterials([newMaterial, ...materials]);
      
      setUploadProgress(100);
      setIsUploading(false);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Failed to save material: ' + (err.response?.data?.message || err.message));
      setIsUploading(false);
    }
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!title) {
      setTitle(file.name.split('.')[0]);
    }

    if (file.type === 'application/pdf') {
      setIsPdfProcessing(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        const maxPages = Math.min(pdf.numPages, 10); // Limit to 10 pages for OCR performance
        
        // First try normal text extraction
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        // If no text found, attempt OCR fallback
        if (!fullText.trim()) {
          console.log('No text layer found, attempting OCR fallback...');
          let ocrResult = '';
          
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (context) {
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              await page.render({
                canvasContext: context,
                viewport: viewport,
                canvas: canvas
              }).promise;
              
              // Use Tesseract on the canvas
              const text = await extractTextFromImage(canvas as any);
              ocrResult += text + '\n';
            }
          }
          fullText = ocrResult;
        }
        
        if (!fullText.trim()) {
          throw new Error('No text found in PDF even after OCR. The file might be corrupted or unreadable.');
        }
        
        setContent(fullText);
      } catch (error: any) {
        console.error('PDF extraction error:', error);
        alert(error.message || 'Failed to extract text from PDF.');
        setContent(`Failed to extract text from ${file.name}.`);
      } finally {
        setIsPdfProcessing(false);
      }
    } else if (file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setContent(event.target?.result as string);
      };
      reader.readAsText(file);
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
    <div className="p-3 sm:p-8 lg:p-12 max-w-3xl mx-auto pb-24">
      <header className="mb-6 sm:mb-12 text-center">
        <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 text-text-main">Upload Material</h1>
        <p className="text-[10px] sm:text-base text-text-muted">Upload a file, paste a link, or scan your notes.</p>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 sm:mb-10 overflow-x-auto no-scrollbar pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setIsSuccess(false);
              setContent('');
              setTitle('');
              setUrl('');
              setOcrText('');
              setImagePreview(null);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap border border-border shadow-sm",
              activeTab === tab.id
                ? "bg-primary text-white shadow-md border-primary"
                : "bg-surface text-text-muted hover:bg-surface/80 hover:border-primary/30"
            )}
          >
            <tab.icon size={14} className="sm:hidden" />
            <tab.icon size={18} className="hidden sm:block" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Area */}
      <div className="glass-card p-6 sm:p-12">
        {isSuccess ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-4 sm:py-8"
          >
            <div className="w-12 h-12 sm:w-20 sm:h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle2 size={24} className="sm:hidden" />
              <CheckCircle2 size={40} className="hidden sm:block" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 text-text-main">Success!</h2>
            <p className="text-[10px] sm:text-base text-text-muted mb-6 sm:mb-8">Material processed and summarized.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => navigate('/library')}
                className="btn-primary py-2 sm:py-3 text-xs sm:text-sm"
              >
                View Library
              </button>
              <button
                onClick={() => setIsSuccess(false)}
                className="btn-outline py-2 sm:py-3 text-xs sm:text-sm"
              >
                Upload More
              </button>
            </div>
          </motion.div>
        ) : isUploading ? (
          <div className="text-center py-8 sm:py-12">
            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-primary animate-spin mx-auto mb-4 sm:mb-6" />
            <h2 className="text-sm sm:text-xl font-bold mb-3 sm:mb-4 text-text-main">Processing...</h2>
            <div className="max-w-[200px] sm:max-w-xs mx-auto h-1.5 sm:h-2 bg-surface rounded-full overflow-hidden border border-border">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[10px] sm:text-sm text-text-muted mt-3 sm:mt-4">Our AI is analyzing your content.</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {activeTab === 'ocr' && (
              <div className="space-y-4 sm:space-y-6">
                {!imagePreview ? (
                  <div 
                    onClick={() => ocrInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/20 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer relative bg-surface/50"
                  >
                    <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-primary/40 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 text-text-main">📸 Scan Notes</h3>
                    <p className="text-[10px] sm:text-sm text-text-muted">Take a photo of your notes</p>
                    <input 
                      ref={ocrInputRef}
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      onChange={handleOcrUpload}
                    />
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="relative rounded-lg sm:rounded-xl overflow-hidden border border-border bg-surface aspect-video flex items-center justify-center">
                      <img src={imagePreview} alt="Preview" className="max-h-full object-contain" />
                      <button 
                        onClick={() => { setImagePreview(null); setOcrText(''); }}
                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {isOcrProcessing ? (
                      <div className="text-center py-6 sm:py-8">
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin mx-auto mb-3 sm:mb-4" />
                        <p className="text-[10px] sm:text-sm font-medium text-text-muted">Extracting text...</p>
                      </div>
                    ) : ocrText ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className="block text-[10px] sm:text-sm font-bold mb-1.5 sm:mb-2 text-text-main">Extracted Text</label>
                          <textarea
                            rows={6}
                            value={ocrText}
                            onChange={(e) => setOcrText(e.target.value)}
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none resize-none"
                          />
                        </div>
                        <button 
                          onClick={() => handleUpload('Scanned Notes', 'image', ocrText)} 
                          disabled={!ocrText}
                          className="w-full btn-primary py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
                        >
                          Process Text
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'file' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] sm:text-sm font-bold text-text-main">Material Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Biology Chapter 1"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/20 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer relative bg-surface/50"
                >
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-primary/40 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 text-text-main">Upload PDF / Text</h3>
                  <p className="text-[10px] sm:text-sm text-text-muted">Max file size: 20MB</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  {isPdfProcessing ? (
                    <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <p className="text-[10px] sm:text-xs font-medium text-text-muted">Extracting text from PDF...</p>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpload(title, 'pdf', content); }} 
                      disabled={!title || !content}
                      className="mt-6 sm:mt-8 btn-primary py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
                    >
                      {content ? 'Process Selected File' : 'Select File'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'youtube' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-[10px] sm:text-sm font-bold mb-1.5 sm:mb-2 text-text-main">YouTube URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none placeholder:text-text-muted"
                  />
                </div>
                <button 
                  onClick={() => handleUpload('YouTube Video', 'youtube')} 
                  disabled={!url}
                  className="w-full btn-primary py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
                >
                  Process Video
                </button>
              </div>
            )}

            {activeTab === 'article' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-[10px] sm:text-sm font-bold mb-1.5 sm:mb-2 text-text-main">Article Content</label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste article content..."
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none resize-none placeholder:text-text-muted"
                  />
                </div>
                <button 
                  onClick={() => handleUpload('Article Summary', 'article', content)} 
                  disabled={!content}
                  className="w-full btn-primary py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
                >
                  Summarize
                </button>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 cursor-pointer hover:scale-105 transition-transform border border-red-100">
                  <Mic size={28} className="sm:hidden" />
                  <Mic size={40} className="hidden sm:block" />
                </div>
                <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 text-text-main">Record Session</h3>
                <p className="text-[10px] sm:text-sm text-text-muted mb-6 sm:mb-8">Record your lecture or discussion.</p>
                <button onClick={() => handleUpload('Voice Note', 'audio')} className="btn-primary py-2 sm:py-3 text-xs sm:text-sm">Start Recording</button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
