import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Sparkles, Download, Share2, FileText, Trash2, Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { StudyTimer } from '../components/StudyTimer';
import api from '../services/api';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'framer-motion';
import { analyzeStudyMaterialOnClient, generateVisualAidOnClient, generateTopicSectionOnClient } from '../lib/gemini';

export default function DetailedNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, materials, setMaterials, showToast } = useAppContext();
  const material = materials.find(m => m.id === id);

  const [currentPage, setCurrentPage] = React.useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!material) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-main">Material not found</h2>
        <Link to="/library" className="btn-primary">Back to Library</Link>
      </div>
    );
  }

  const sections = material.noteSections || [];
  const totalPages = sections.length;

  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const handleRegenerate = async () => {
    if (isRegenerating || !material) return;
    
    setIsRegenerating(true);
    try {
      console.log('Regenerating detailed analysis for (Client-Side Gemini first):', material.title);
      
      // Step 1: Perform initial analysis on client to use platform API Key
      const analysis = await analyzeStudyMaterialOnClient(material.content || material.title, material.title, user?.language);
      
      // Step 2: Request massive chapters from backend (OpenRouter)
      let noteSections = [];
      try {
        const chaptersResponse = await api.post('/materials/generate-chapters', {
          content: material.content || material.title,
          title: material.title,
          keyTopics: analysis.keyTopics
        });
        noteSections = chaptersResponse.data.noteSections;
        console.log('Backend chapter generation successful');
      } catch (backendErr) {
        console.warn('Backend chapter generation failed, falling back to client-side Gemini:', backendErr);
        // Fallback to client-side Gemini for iterative chapter generation
        for (const topic of analysis.keyTopics) {
          try {
            console.log(`Generating fallback chapter for: ${topic}`);
            const section = await generateTopicSectionOnClient(material.content || material.title, material.title, topic, user?.language);
            noteSections.push(section);
          } catch (geminiErr) {
            console.error(`Gemini fallback failed for ${topic}:`, geminiErr);
          }
        }
      }

      if (noteSections.length === 0) {
        throw new Error('Both OpenRouter and Gemini fallback failed to generate chapters.');
      }

      // Step 3: Generate visual aids on client for each section
      console.log('Generating visual aids on client...');
      const processedSections = await Promise.all(
        noteSections.map(async (section: any) => {
          try {
            const imageUrl = await generateVisualAidOnClient(section.imagePrompt);
            return { ...section, imageUrl };
          } catch (err) {
            return { ...section, imageUrl: '' };
          }
        })
      );
      
      // Final detailed notes string
      const detailedNotes = processedSections.map((s: any) => `# ${s.heading}\n\n${s.content}`).join('\n\n---\n\n');

      const response = await api.put(`/materials/${material.id}`, {
        summary: analysis.summary,
        keyTopics: analysis.keyTopics,
        realLifeApplications: analysis.realLifeApplications,
        detailedNotes: detailedNotes,
        noteSections: processedSections,
        suggestedQuizQuestions: analysis.suggestedQuizQuestions
      });

      // Update local state
      const updatedMaterials = materials.map(m => 
        m.id === material.id ? { ...m, ...response.data } : m
      );
      setMaterials(updatedMaterials);
      setCurrentPage(0);
      showToast('Academic deep-dive complete! Your study guide is ready.');
    } catch (error: any) {
      console.error('Regeneration error:', error);
      const message = error.response?.data?.error || error.response?.data?.message || error.message;
      showToast('Analysis failed: ' + message, 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
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
    <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto pb-24 relative">
      <div className="atmosphere-bg" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} /> Back to Library
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-xl transition-all font-bold text-[10px] sm:text-sm disabled:opacity-50 border border-accent/20"
              title="Generate ultra-detailed, textbook-sized notes. This takes a few minutes."
            >
              {isRegenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              <div className="flex flex-col items-start leading-none">
                <span>Deep Analysis</span>
                <span className="text-[8px] opacity-60 font-medium">BETA • INTENSIVE</span>
              </div>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all font-bold text-sm"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        </div>

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
              <BookOpen size={20} />
            </div>
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">Detailed Study Notes</span>
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
                Page {currentPage + 1} of {totalPages}
              </span>
            </div>
          )}
        </header>

        <div className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            {sections.length > 0 ? (
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="glass-card shadow-2xl p-6 sm:p-12 relative border-t-8 border-primary"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-50" />
                
                <div className="space-y-10">
                  <header className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-accent animate-pulse" />
                      <span className="text-xs font-bold text-accent uppercase tracking-widest">Enhanced Insight • Chapter {currentPage + 1}</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight leading-none italic decoration-primary/30 underline decoration-4 underline-offset-8">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60 pointer-events-none" />
                      <div className="absolute bottom-4 left-4 right-4 bg-surface/60 backdrop-blur-xl p-3 flex items-center justify-center gap-2 border border-white/10 rounded-2xl">
                        <Sparkles size={14} className="text-secondary" />
                        <p className="text-[10px] text-white font-bold italic tracking-wide">
                          AI Visual Learning Aid
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="markdown-body text-text-main selection:bg-primary/30">
                    <ReactMarkdown>{sections[currentPage].content}</ReactMarkdown>
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
                      Previous Topic
                    </button>

                    <div className="hidden sm:block text-xs text-text-muted font-bold tracking-widest uppercase">
                      Page {currentPage + 1} / {totalPages}
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
                        <>Complete Review <Sparkles size={18} /></>
                      ) : (
                        <>Next Topic <ChevronRight size={20} /></>
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
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Core Concept Review</span>
                </div>
                <div className="markdown-body text-text-main leading-relaxed prose prose-invert max-w-none">
                  <ReactMarkdown>{material.detailedNotes}</ReactMarkdown>
                </div>
                
                <div className="mt-12 p-6 bg-primary/5 rounded-3xl border border-primary/10 text-center">
                  <p className="text-xs text-text-muted mb-4 font-medium italic">Want to dive deeper into these topics with textbooks-sized chapters and diagrams?</p>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="btn-primary py-2 text-xs flex items-center gap-2 mx-auto"
                  >
                    <Sparkles size={14} /> Start Deep Analysis
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center">
                <Sparkles className="w-12 h-12 text-secondary/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-text-main mb-2">Academic Analysis Required</h3>
                <p className="text-text-muted mb-8">This material hasn't been deeply analyzed yet. Run a Deep Analysis to generate Textbook-sized notes.</p>
                <button
                  onClick={handleRegenerate}
                  className="btn-primary"
                >
                  Start Deep Analysis
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-xl text-xs font-bold text-text-main hover:border-primary transition-all">
            <Download size={16} /> DOWNLOAD
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-xl text-xs font-bold text-text-main hover:border-primary transition-all">
            <Share2 size={16} /> SHARE
          </button>
        </div>
      </motion.div>

      <StudyTimer materialId={material.id} title={material.title} />

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
              <h3 className="text-xl font-bold text-text-main text-center mb-2">Delete Study?</h3>
              <p className="text-text-muted text-center text-sm mb-8">
                Are you sure you want to delete <span className="text-text-main font-bold italic">"{material.title}"</span>? This action is permanent.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-outline py-3"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Delete Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
