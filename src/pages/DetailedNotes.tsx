import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Sparkles, Download, Share2, FileText, Trash2, Loader2, Calendar, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { StudyTimer } from '../components/StudyTimer';
import { TutorChat } from '../components/TutorChat';
import api from '../services/api';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'framer-motion';
import { analyzeStudyMaterialOnClient, generateVisualAidOnClient, generateTopicSectionOnClient, simplifyContentELI5 } from '../lib/gemini';
import { generateMaterialPDF } from '../lib/pdf';
import { ShareModal } from '../components/ShareModal';

import { StructuredNoteRenderer } from '../components/StructuredNoteRenderer';

export default function DetailedNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, materials, setMaterials, showToast, t, isLoading } = useAppContext();
  const material = materials.find(m => m.id === id);

  const [currentPage, setCurrentPage] = React.useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  
  const [isELI5, setIsELI5] = React.useState(false);

  const handleDownload = async () => {
    if (isDownloading || !material) return;
    setIsDownloading(true);
    try {
      showToast('Generating PDF study guide...');
      await generateMaterialPDF(material);
      showToast('Study guide downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      showToast('Failed to generate PDF.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };
  const handleShare = async () => {
    setIsShareModalOpen(true);
  };

  const [eli5Content, setEli5Content] = React.useState<{ [pageId: number]: string }>({});
  const [isLoadingELI5, setIsLoadingELI5] = React.useState(false);

  const handleToggleELI5 = async (pageContent: string, pageIndex: number) => {
    if (isELI5) {
      setIsELI5(false);
      return;
    }
    
    if (eli5Content[pageIndex]) {
      setIsELI5(true);
      return;
    }

    setIsLoadingELI5(true);
    try {
      const simplified = await simplifyContentELI5(pageContent, user?.language);
      setEli5Content(prev => ({ ...prev, [pageIndex]: simplified }));
      setIsELI5(true);
    } catch (err: any) {
      showToast('Failed to simplify content: ' + err.message, 'error');
    } finally {
      setIsLoadingELI5(false);
    }
  };

  if (isLoading && !material) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-text-muted font-medium">{t('loading_data')}...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-main">{t('material_not_found')}</h2>
        <Link to="/library" className="btn-primary">{t('back_to_library')}</Link>
      </div>
    );
  }

  const isPending = (material as any)?.generationStatus === 'pending' && !material?.detailedNotes;
  const isFailed = (material as any)?.generationStatus === 'failed';

  // Sections and pages
  const sections = material?.noteSections || [];
  const totalPages = sections.length;

  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const handleManualRetry = async () => {
    if (!material) return;
    setIsRegenerating(true);
    try {
      await api.post('/materials/generate-chapters', {
        content: material.content,
        title: material.title,
        materialId: id
      });
      // Refresh local data
      const res = await api.get(`/materials/${id}`);
      const updated = materials.map(m => (m.id === id) ? { ...m, ...res.data } : m);
      setMaterials(updated as any);
      showToast('Analysis triggered successfully.');
    } catch (err) {
      console.error('Retry failed', err);
      showToast('Failed to start analysis.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (isRegenerating || !material) return;
    
    setIsRegenerating(true);
    try {
      showToast('Engaging Academic Deep-Dive Analysis...');
      
      // Call backend which now handles Gemini -> OpenRouter fallback automatically
      const chaptersResponse = await api.post('/materials/generate-chapters', {
        content: material.content || material.title,
        title: material.title,
        materialId: id // This will update the DB
      });

      // Update local state with the same structured response format the server returns
      const updatedMaterials = materials.map(m => 
        (m.id === id || (m as any)._id === id) 
          ? { ...m, ...chaptersResponse.data, generationStatus: 'completed' } 
          : m
      );
      setMaterials(updatedMaterials);
      setCurrentPage(0);
      showToast('Deep-dive complete! Your study guide is now fully ready.');
    } catch (error: any) {
      console.error('Regeneration error:', error);
      const message = error.response?.data?.message || error.message;
      showToast('Deep analysis failed. Please try again later. ' + message, 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      setIsELI5(false);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      setIsELI5(false);
      window.scrollTo(0, 0);
    }
  };

  const handleDelete = async () => {
    if (!material) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/materials/${material.id}`);
      setMaterials(materials.filter(m => m.id !== material.id));
      showToast('Material deleted successfully.');
      navigate('/library');
    } catch (error) {
      console.error('Failed to delete material:', error);
      showToast('Failed to delete material.', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto pb-24 relative bg-surface-alt rounded-[40px] md:rounded-[64px] mb-10 border border-border/10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-text-muted hover:text-primary transition-colors text-[10px] sm:text-sm font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" /> back
          </button>

          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-xl transition-all font-bold text-[9px] sm:text-sm disabled:opacity-50 border border-accent/20"
              title={t('deep_analysis_tooltip')}
            >
              {isRegenerating ? <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" /> : <Sparkles size={14} className="sm:w-4 sm:h-4" />}
              <div className="flex flex-col items-start leading-none text-left">
                <span>{t('deep_analysis')}</span>
                <span className="hidden sm:block text-[8px] opacity-60 font-medium">{t('beta_intensive')}</span>
              </div>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all font-bold text-[10px] sm:text-sm"
            >
              <Trash2 size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">{t('delete')}</span>
            </button>
          </div>
        </div>

        {!material.structuredNote && (
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
                <BookOpen size={20} />
              </div>
              <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">{t('detailed_study_notes')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-6 tracking-tighter leading-tight drop-shadow-sm">
              {material.title}
            </h1>
            
            {totalPages > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-grow bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
                <span className="text-[10px] font-bold text-text-muted uppercase shrink-0">
                  {t('page_info', { current: currentPage + 1, total: totalPages })}
                </span>
              </div>
            )}
          </header>
        )}

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {isFailed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 text-center border-red-500/20"
              >
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-2">Generation Failed</h3>
                <p className="text-text-muted mb-6 max-w-sm mx-auto">
                  We encountered an issue while generating your detailed notes. This might be due to a temporary model outage.
                </p>
                <button
                  onClick={handleManualRetry}
                  disabled={isRegenerating}
                  className="btn-primary w-full max-w-xs mx-auto flex items-center justify-center gap-2"
                >
                  {isRegenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  Retry Generation
                </button>
              </motion.div>
            ) : material.structuredNote ? (
              <motion.div
                key="structured"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-transparent"
              >
                <StructuredNoteRenderer note={material.structuredNote} />
              </motion.div>
            ) : sections.length > 0 ? (
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="glass-card shadow-2xl p-6 sm:p-12 relative border-t-8 border-primary"
              >
                
                <div className="space-y-10">
                  <header className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-accent animate-pulse" />
                        <span className="text-xs font-bold text-accent uppercase tracking-widest">{t('enhanced_insight_chapter', { count: currentPage + 1 })}</span>
                      </div>
                      
                      <button
                        onClick={() => handleToggleELI5(sections[currentPage].content, currentPage)}
                        disabled={isLoadingELI5}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                          isELI5 
                            ? "bg-accent/20 border-accent/50 text-accent" 
                            : "bg-surface border-border text-text-muted hover:border-accent/30 hover:text-accent"
                        )}
                      >
                        {isLoadingELI5 ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {isELI5 ? 'Reading ELI5' : 'ELI5'}
                      </button>
                    </div>
                    <h2 className="font-extrabold text-text-main tracking-tight leading-none">
                      {sections[currentPage].heading}
                    </h2>
                  </header>
                  
                  {sections[currentPage].imageUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-3xl overflow-hidden border-2 border-primary/20 bg-surface shadow-2xl group relative"
                    >
                      <img 
                        src={sections[currentPage].imageUrl} 
                        alt={sections[currentPage].heading} 
                        className="w-full h-[300px] object-cover transform group-hover:scale-[1.02] transition-transform duration-1000"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-4 left-4 right-4 bg-surface/60 backdrop-blur-xl p-3 flex items-center justify-center gap-2 border border-white/10 rounded-2xl">
                        <Sparkles size={14} className="text-secondary" />
                        <p className="text-[10px] text-white font-bold italic tracking-wide">
                          {t('visual_aid')}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="markdown-body text-text-main selection:bg-primary/30 p-2 sm:p-4 bg-white/10 dark:bg-black/5 rounded-2xl">
                    <ReactMarkdown>
                      {isELI5 && eli5Content[currentPage] 
                        ? eli5Content[currentPage] 
                        : sections[currentPage].content}
                    </ReactMarkdown>
                  </div>

                  {/* Page Navigation Controls inside the card */}
                  <div className="pt-12 mt-12 border-t border-border flex items-center justify-between">
                    <button
                      onClick={handlePrev}
                      disabled={currentPage === 0}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                        currentPage === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-primary/10 text-primary"
                      )}
                    >
                      <ChevronLeft size={20} />
                      {t('previous_topic')}
                    </button>

                    <div className="hidden sm:block text-xs text-text-muted font-bold tracking-widest uppercase">
                      {t('page_info', { current: currentPage + 1, total: totalPages })}
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={currentPage === totalPages - 1}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                        currentPage === totalPages - 1 ? "opacity-30 cursor-not-allowed text-green-500" : "bg-primary text-white shadow-lg hover:shadow-primary/20 hover:scale-105"
                      )}
                    >
                      {currentPage === totalPages - 1 ? (
                        <>{t('complete_review')} <Sparkles size={18} /></>
                      ) : (
                        <>{t('next_topic')} <ChevronRight size={20} /></>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : material.detailedNotes ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card shadow-2xl p-6 sm:p-12 border-l-8 border-secondary/30"
              >
                <div className="flex items-center gap-2 mb-8 opacity-60">
                  <BookOpen size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{t('core_concept_review')}</span>
                </div>
                <div className="markdown-body text-text-main leading-relaxed prose prose-invert max-w-none">
                  <ReactMarkdown>{material.detailedNotes}</ReactMarkdown>
                </div>
                
                <div className="mt-12 p-6 bg-primary/5 rounded-3xl border border-primary/10 text-center">
                  <p className="text-xs text-text-muted mb-4 font-medium italic">{t('dive_deeper_prompt')}</p>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="btn-primary py-2 text-xs flex items-center gap-2 mx-auto"
                  >
                    <Sparkles size={14} /> {t('start_deep_analysis')}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center">
                <Sparkles className="w-12 h-12 text-secondary/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-main mb-2">{t('academic_analysis_required')}</h3>
                <p className="text-text-muted mb-8">{t('academic_analysis_desc')}</p>
                <button
                  onClick={handleRegenerate}
                  className="btn-primary"
                >
                  {t('start_deep_analysis')}
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-xl text-xs font-bold text-text-main hover:border-primary transition-all disabled:opacity-50"
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isDownloading ? 'Generating...' : t('download')}
          </button>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-xl text-xs font-bold text-text-main hover:border-primary transition-all"
          >
            <Share2 size={16} /> {t('share')}
          </button>
        </div>
      </motion.div>

      <StudyTimer 
        materialId={material.id} 
        title={material.title} 
        readContent={sections.length > 0 ? sections[currentPage].content : material.detailedNotes}
      />

      <TutorChat 
        materialTitle={material.title}
        materialContent={sections.length > 0 ? sections[currentPage].content : (material.detailedNotes || material.content || "")}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-card p-8 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-main text-center mb-2">{t('delete_study_confirm_title')}</h3>
              <p className="text-text-muted text-center text-sm mb-8">
                {t('delete_study_confirm_desc')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-outline py-3"
                  disabled={isDeleting}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : t('delete_now')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {material && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={material.title}
          url={window.location.href}
        />
      )}
    </div>
  );
}
