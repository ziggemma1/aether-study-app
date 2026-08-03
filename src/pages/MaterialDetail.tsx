import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Calendar, Sparkles, GraduationCap, ArrowLeft, Download, Share2, Volume2, Loader2, Lightbulb, Settings, Zap, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateSpeech, playAudio } from '../services/ttsService';
import { StudyTimer } from '../components/StudyTimer';
import { GenerationSettingsModal } from '../components/GenerationSettingsModal';
import { ShareModal } from '../components/ShareModal';
import { analyzeStudyMaterial, generateVisualAid } from '../services/geminiService';
import api from '../services/api';
import { cn } from '../lib/utils';
import { generateMaterialPDF } from '../lib/pdf';

export default function MaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { materials, setMaterials, showToast, isLoading } = useAppContext();
  const material = materials.find(m => m.id === id);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [generationType, setGenerationType] = useState<'Quiz' | 'Flashcards'>('Quiz');

  if (isLoading && !material) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-text-muted font-medium">Fetching material details...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-main">Material not found</h2>
        <Link to="/library" className="btn-primary">Back to Library</Link>
      </div>
    );
  }

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      showToast('Generating PDF...');
      await generateMaterialPDF(material);
      showToast('Study guide downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Failed to generate PDF download.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      // Use material.id specifically (mapped in context)
      const matId = material.id || (material as any)._id;
      const response = await api.post('/materials/share', { materialId: matId });
      const { shareUrl: generatedUrl } = response.data;
      setShareUrl(generatedUrl);
      setIsShareModalOpen(true);
    } catch (error: any) {
      console.error('Share failed:', error);
      showToast('Failed to generate share link', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const handleListen = async () => {
    if (isSpeaking || !material.summary) return;
    
    setIsSpeaking(true);
    try {
      const audioData = await generateSpeech(material.summary);
      if (audioData) {
        playAudio(audioData);
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleRegenerate = async () => {
    if (isRegenerating || !material) return;
    
    setIsRegenerating(true);
    try {
      console.log('Regenerating analysis for:', material.title);
      // Run analysis via server
      const analyzeResponse = await api.post('/materials/analyze', {
        content: material.content || material.title,
        title: material.title
      });
      const analysis = analyzeResponse.data;
      
      const response = await api.put(`/materials/${material.id}`, {
        summary: analysis.summary,
        keyTopics: analysis.keyTopics,
        realLifeApplications: analysis.realLifeApplications,
        detailedNotes: analysis.detailedNotes,
        noteSections: analysis.noteSections,
        visualAidUrl: analysis.visualAidUrl,
        suggestedQuizQuestions: analysis.suggestedQuizQuestions
      });

      // Update local state
      const updatedMaterials = materials.map(m => 
        m.id === material.id ? { ...m, ...response.data } : m
      );
      setMaterials(updatedMaterials);
      showToast('Analysis regenerated successfully!');
    } catch (error: any) {
      console.error('Regeneration error:', error);
      showToast('Failed to regenerate analysis: ' + error.message, 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateClick = (type: 'Quiz' | 'Flashcards') => {
    setGenerationType(type);
    setIsSettingsOpen(true);
  };

  const handleGenerate = (settings: any) => {
    setIsSettingsOpen(false);
    const path = generationType === 'Quiz' ? 'quiz' : 'flashcards';
    navigate(`/${path}/${id}`, { state: { settings } });
  };

  const isFallback = material.summary?.includes('(PDF text extraction would happen here)') || 
                     material.summary?.length < 100 || 
                     !material.keyTopics?.length;

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto pb-24 relative bg-surface-alt rounded-[40px] md:rounded-[64px] mb-10 border border-border/10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-primary mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} /> Back to Library
        </button>
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-bold uppercase tracking-wider">
                {material.type}
              </span>
              <span className="text-text-muted text-sm">{material.uploadDate}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-text-main">{material.title}</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="p-3 bg-surface rounded-xl shadow-sm text-text-muted hover:text-primary transition-colors border border-border disabled:opacity-50"
              title="Download Study Guide"
            >
              {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            </button>
            <button 
              onClick={handleShare}
              className="p-3 bg-surface rounded-xl shadow-sm text-text-muted hover:text-primary transition-colors border border-border"
              title="Share Study Guide"
            >
              <Share2 size={20} />
            </button>
          </div>
        </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Section */}
          <section className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="text-secondary" size={24} />
                <h2 className="text-xl font-bold text-text-main">AI Summary</h2>
              </div>
              <div className="flex gap-2">
                {isFallback && (
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-600 rounded-xl hover:bg-orange-500/20 transition-colors disabled:opacity-50 text-xs font-bold"
                  >
                    {isRegenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Regenerate
                  </button>
                )}
                <button
                  onClick={handleListen}
                  disabled={isSpeaking || !material.summary}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {isSpeaking ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={18} />
                      <span>Listen to Summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className={cn(
              "markdown-body text-text-main leading-relaxed",
              !material.summary && "italic text-text-muted"
            )}>
              {material.summary ? (
                <ReactMarkdown>{material.summary}</ReactMarkdown>
              ) : (
                "No summary available. Try regenerating the analysis."
              )}
            </div>

            {/* Detailed Notes Button */}
            <div className="mt-8 pt-6 border-t border-border">
              <Link
                to={`/materials/${material.id}/notes`}
                className="flex items-center justify-center gap-2 w-full p-4 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-xl transition-all font-bold border border-secondary/20 group"
              >
                <FileText size={20} className="group-hover:scale-110 transition-transform" />
                View Detailed Explained Notes
              </Link>
            </div>
          </section>

          {/* Key Topics */}
          <section className="glass-card p-8">
            <h2 className="text-xl font-bold mb-6 text-text-main">Key Topics</h2>
            <div className="flex flex-wrap gap-3">
              {material.keyTopics?.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-sm font-medium border border-primary/10"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>

          {/* Real Life Applications */}
          {material.realLifeApplications && material.realLifeApplications.length > 0 && (
            <section className="glass-card p-8">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="text-yellow-500" size={24} />
                <h2 className="text-xl font-bold text-text-main">Real Life Applications</h2>
              </div>
              <ul className="space-y-4">
                {material.realLifeApplications.map((app, idx) => (
                  <li key={idx} className="flex gap-3 text-text-main">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-sm leading-relaxed">{app}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {/* Study Actions Card */}
          <div className="rounded-[24px] p-6 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 text-white shadow-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-colors" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap size={16} className="text-secondary" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/90">Study Engine</h3>
              </div>

              <div className="space-y-3">
                {/* AI Practice Quiz */}
                <div className="flex gap-2">
                  <Link
                    to={`/quiz/${id}`}
                    className="flex-grow flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 hover:border-white/10 group/btn shadow-inner"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-white">AI Practice Quiz</span>
                      <span className="text-[11px] text-white/50 font-medium">Test your knowledge</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleGenerateClick('Quiz')}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 hover:border-white/10 text-white/40 hover:text-white"
                    title="Customize Quiz"
                  >
                    <Settings size={20} />
                  </button>
                </div>

                {/* Smart Flashcards */}
                <div className="flex gap-2">
                  <Link
                    to={`/flashcards/${id}`}
                    className="flex-grow flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 hover:border-white/10 group/btn shadow-inner"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-white">Smart Flashcards</span>
                      <span className="text-[11px] text-white/50 font-medium">Spaced repetition</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleGenerateClick('Flashcards')}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 hover:border-white/10 text-white/40 hover:text-white"
                    title="Customize Flashcards"
                  >
                    <Settings size={20} />
                  </button>
                </div>

                {/* Create Study Plan */}
                <Link
                  to={`/plans/create?materialId=${id}`}
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 hover:border-white/10 group/btn shadow-inner"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-400/20 flex items-center justify-center text-indigo-300 group-hover/btn:scale-110 transition-transform">
                    <Calendar size={20} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-white">Create Study Plan</span>
                    <span className="text-[11px] text-white/50 font-medium">Personalized roadmap</span>
                  </div>
                </Link>

                {/* Interactive AI Tutor */}
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 hover:border-white/10 group/btn shadow-inner"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-400/20 flex items-center justify-center text-orange-400 group-hover/btn:scale-110 transition-transform">
                    {isRegenerating ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold text-white">Regenerate Insights</span>
                    <span className="text-[11px] text-white/50 font-medium">Update smart analysis</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Card */}
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4 text-text-main">Your Progress</h3>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-grow h-2 bg-surface rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-secondary"
                  style={{ width: `${material.progress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-text-main">{material.progress}%</span>
            </div>
            <p className="text-xs text-text-muted">Last studied on March 25, 2024</p>
          </div>
        </div>
      </div>
      </motion.div>
      
      <StudyTimer materialId={material.id} title={material.title} />

      <GenerationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        type={generationType}
        onGenerate={handleGenerate}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={material.title}
        url={shareUrl || `${window.location.origin}/share/loading`}
      />
    </div>
  );
}
