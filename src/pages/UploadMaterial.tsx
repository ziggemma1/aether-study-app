import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Youtube, BookOpen, Mic, X, CheckCircle2, Loader2, Camera, Image as ImageIcon, Sparkles } from 'lucide-react';
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
  const { user, materials, setMaterials, showToast } = useAppContext();
  const [activeTab, setActiveTab] = React.useState<'file' | 'youtube' | 'article' | 'voice' | 'ocr'>('file');
  const [isUploading, setIsUploading] = React.useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = React.useState(0);
  const loadingPhrases = [
    "Analyzing Context...",
    "Extracting Key Concepts...",
    "Synthesizing Notes...",
    "Generating Smart Quiz...",
    "Almost Ready..."
  ];

  React.useEffect(() => {
    let interval: any;
    if (isUploading) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

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

  // Audio Note Dictation State
  const [isRecording, setIsRecording] = React.useState(false);
  const [dictationText, setDictationText] = React.useState('');
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          // We just append interim/final. For simplicity just rewrite with full mapped
          // Actually, 'continuous' concatenates differently depending on browser.
          // Let's manually concatenate final results, and show interim.
        };
        // A better approach for continuous appending
        let finalTranscript = '';
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setDictationText(finalTranscript + interimTranscript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsRecording(false);
        };
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!recognitionRef.current) {
        showToast("Speech recognition is not supported in this browser.", 'error');
        return;
      }
      setDictationText(''); // reset
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        console.warn('Speech recognition start failed', err);
        showToast('Speech recognition could not be started', 'error');
        setIsRecording(false);
      }
    }
  };

  const handleUpload = async (materialTitle: string, materialType: string, materialContent?: string) => {
    if (!user) {
      showToast('Please log in to upload materials.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    console.log('Starting upload:', { materialTitle, materialType, hasContent: !!materialContent });

    try {
      let finalContent = materialContent || '';
      
      if (materialType === 'youtube' && url) {
        try {
          const res = await api.post('/materials/youtube-transcript', { url });
          finalContent = res.data.content;
          materialTitle = materialTitle || 'YouTube Transcript Summarized';
        } catch (err: any) {
          console.warn("Failed getting transcript:", err);
          showToast(err.response?.data?.message || 'Failed to fetch YouTube transcript. The video might not have closed captions enabled.', 'error');
          setIsUploading(false);
          return;
        }
      }
      
      if (materialType === 'audio' && !finalContent) {
        finalContent = 'Voice recording session started.';
      }

      setUploadProgress(30);
      console.log('Analyzing material with AI (Summary Only)...');
      
      // AI Analysis via client - Fast summary and topics only
      let analysis: any;
      try {
        analysis = await analyzeStudyMaterialOnClient(finalContent || materialTitle, materialTitle, user?.language);
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
      console.log('Generating Deep Explained Notes (Synchronous)...');
      
      // Step 2: Detailed Notes Generation (Now Synchronous to satisfy user request)
      let detailedNotesData: any = { detailedNotes: '', noteSections: [], structuredNote: null };
      try {
        const chaptersResponse = await api.post('/materials/generate-chapters', {
          content: finalContent,
          title: materialTitle || 'Untitled Material'
        });
        detailedNotesData = chaptersResponse.data;
        console.log('Deep Notes generation successful');
      } catch (genErr: any) {
        console.warn('Backend deep generation failed, using simple notes:', genErr);
        detailedNotesData = { 
          detailedNotes: analysis.detailedNotes || analysis.simpleDetailedNotes || '', 
          noteSections: analysis.noteSections || [],
          structuredNote: analysis.structuredNote || null
        };
      }

      setUploadProgress(85);
      console.log('Saving completed material to database...');

      const response = await api.post('/materials', {
        title: materialTitle || 'Untitled Material',
        type: materialType,
        content: finalContent,
        summary: analysis.summary,
        keyTopics: analysis.keyTopics,
        realLifeApplications: analysis.realLifeApplications,
        detailedNotes: detailedNotesData.detailedNotes,
        noteSections: detailedNotesData.noteSections,
        structuredNote: detailedNotesData.structuredNote,
        visualAidUrl: analysis.visualAidUrl,
        suggestedQuizQuestions: analysis.suggestedQuizQuestions,
        generationStatus: 'completed', // Immediately completed
        flashcards: analysis.recommendedFlashcards?.map((c: any) => ({
          ...c,
          interval: 0,
          repetitions: 0,
          easeFactor: 2.5,
          nextReview: new Date()
        }))
      });

      const newId = response.data._id || response.data.id;
      console.log('Material saved successfully:', response.data);
      
      // Update local context immediately
      const newMaterial = {
        ...response.data,
        id: newId,
        uploadDate: new Date().toLocaleDateString(),
        generationStatus: 'completed'
      };
      setMaterials([newMaterial, ...materials]);
      
      setUploadProgress(100);
      setIsUploading(false);
      setIsSuccess(true);
      showToast('Material uploaded successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast('Failed to save material: ' + (err.response?.data?.message || err.message), 'error');
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
      showToast('Failed to extract text. Please try again with a clearer photo.', 'error');
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
        showToast('Text extracted from PDF successfully.');
      } catch (error: any) {
        console.error('PDF extraction error:', error);
        showToast(error.message || 'Failed to extract text from PDF.', 'error');
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
    <div className="p-3 sm:p-8 lg:p-12 w-full max-w-full lg:max-w-3xl mx-auto pb-40 lg:pb-12 overflow-x-hidden box-border">
      <header className="mb-6 sm:mb-12 text-center w-full">
        <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 text-text-main">Upload Material</h1>
        <p className="text-[10px] sm:text-base text-text-muted">Upload a file, paste a link, or scan your notes.</p>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 sm:mb-10 overflow-x-auto overflow-y-hidden custom-scrollbar pb-2 sm:pb-3 px-1 w-full max-w-full">
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
              "flex flex-shrink-0 items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-sm font-semibold transition-all whitespace-nowrap border border-border shadow-sm",
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
      <div className="glass-card p-4 sm:p-6 md:p-12 w-full max-w-full overflow-hidden box-border">
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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 sm:py-16 relative overflow-hidden"
          >
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent blur-3xl" />
            <div className="relative">
              <div className="relative w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8">
                <Loader2 className="w-full h-full text-primary animate-spin" />
                <Sparkles className="absolute top-0 right-0 text-accent animate-pulse" size={20} />
              </div>
              <h2 className="text-lg sm:text-2xl font-black mb-3 sm:mb-4 text-text-main tracking-tight italic">
                {loadingPhrases[loadingPhraseIndex]}
              </h2>
              <div className="max-w-[200px] sm:max-w-xs mx-auto h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-indigo-500 to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] sm:text-sm text-text-muted mt-6 sm:mt-8 font-medium max-w-xs mx-auto leading-relaxed">
                The AI is extracting key topics and preparing your explained notes.
              </p>
            </div>
          </motion.div>
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
                    className="border-2 border-dashed border-primary/20 rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer relative bg-surface/50 w-full max-w-full overflow-hidden break-words box-border"
                  >
                    <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-primary/40 mx-auto mb-3 sm:mb-4 shrink-0" />
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
                          <label className="block text-[10px] sm:text-sm font-bold mb-1.5 sm:mb-2 text-text-main flex items-center justify-between">
                            <span>Review Extracted Text</span>
                            <span className="text-secondary font-medium text-[9px] sm:text-[10px] bg-secondary/10 px-2 py-0.5 rounded-full">Correct Handwriting Errors Here</span>
                          </label>
                          <textarea
                            rows={8}
                            value={ocrText}
                            onChange={(e) => setOcrText(e.target.value)}
                            placeholder="Review and correct any mistaken words before analyzing..."
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-secondary/30 bg-surface/80 text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-secondary outline-none resize-y shadow-inner"
                          />
                        </div>
                        <button 
                          onClick={() => handleUpload('Scanned Notes', 'image', ocrText)} 
                          disabled={!ocrText}
                          className="w-full btn-primary bg-secondary hover:bg-secondary/90 py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
                        >
                          Confirm & Analyze Text
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
                    className="w-full box-border px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/20 rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer relative bg-surface/50 w-full max-w-full overflow-hidden break-words box-border"
                >
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-primary/40 mx-auto mb-3 sm:mb-4 shrink-0" />
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
                      <Loader2 className="w-6 h-6 text-primary animate-spin shrink-0" />
                      <p className="text-[10px] sm:text-xs font-medium text-text-muted">Extracting text from PDF...</p>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpload(title, 'pdf', content); }} 
                      disabled={!title || !content}
                      className="mt-6 sm:mt-8 btn-primary w-full sm:w-auto py-2 sm:py-3 px-4 text-xs sm:text-sm disabled:opacity-50 whitespace-normal h-auto break-words"
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
                    className="w-full box-border px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none placeholder:text-text-muted"
                  />
                </div>
                <button 
                  onClick={() => handleUpload('YouTube Video', 'youtube')} 
                  disabled={!url}
                  className="w-full box-border btn-primary py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
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
                    className="w-full box-border px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-border bg-surface text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-primary outline-none resize-none placeholder:text-text-muted"
                  />
                </div>
                <button 
                  onClick={() => handleUpload('Article Summary', 'article', content)} 
                  disabled={!content}
                  className="w-full box-border btn-primary py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
                >
                  Summarize
                </button>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center py-6 sm:py-8 bg-surface/50 rounded-xl sm:rounded-2xl border border-border">
                  <div 
                    onClick={toggleRecording}
                    className={cn(
                      "w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 cursor-pointer hover:scale-105 transition-all shadow-lg border-4",
                      isRecording ? "bg-red-500/20 text-red-500 border-red-500 shadow-red-500/50 animate-pulse" : "bg-surface-alt text-text-muted border-border"
                    )}
                  >
                    <Mic size={28} className="sm:hidden" />
                    <Mic size={40} className="hidden sm:block" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold mb-1 sm:mb-2 text-text-main">
                    {isRecording ? "Recording Notes..." : "Dictate Audio Notes"}
                  </h3>
                  <p className="text-[10px] sm:text-sm text-text-muted">
                    {isRecording ? "Tap to stop." : "Talk out loud to synthesize your thoughts."}
                  </p>
                </div>
                
                {dictationText && (
                  <div className="space-y-4">
                    <label className="block text-[10px] sm:text-sm font-bold mb-1.5 sm:mb-2 text-text-main">Transcribed Text</label>
                    <textarea
                      rows={6}
                      value={dictationText}
                      onChange={(e) => setDictationText(e.target.value)}
                      className="w-full box-border px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-secondary/30 bg-surface/80 text-[10px] sm:text-sm text-text-main focus:ring-2 focus:ring-secondary outline-none resize-y"
                    />
                    <button 
                      onClick={() => handleUpload('Audio Dictation Notes', 'audio', dictationText)} 
                      disabled={isRecording || !dictationText}
                      className="w-full box-border btn-primary py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
                    >
                      Process & Analyze Notes
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
