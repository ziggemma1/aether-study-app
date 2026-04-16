import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Sparkles, Download, Share2, FileText, Trash2, Loader2, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { StudyTimer } from '../components/StudyTimer';
import api from '../services/api';
import { cn } from '../lib/utils';

export default function DetailedNotes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { materials, setMaterials } = useAppContext();
  const material = materials.find(m => m.id === id);

  if (!material) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-main">Material not found</h2>
        <Link to="/library" className="btn-primary">Back to Library</Link>
      </div>
    );
  }

  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const handleRegenerate = async () => {
    if (isRegenerating || !material) return;
    
    setIsRegenerating(true);
    try {
      console.log('Regenerating detailed analysis for:', material.title);
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
      alert('Detailed notes successfully updated with better content!');
    } catch (error: any) {
      console.error('Regeneration error:', error);
      alert('Failed to regenerate: ' + error.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/materials/${material.id}`);
      setMaterials(materials.filter(m => m.id !== material.id));
      navigate('/library');
    } catch (error) {
      console.error('Failed to delete material:', error);
      alert('Failed to delete material. Please try again.');
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-4xl mx-auto pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all font-bold text-sm disabled:opacity-50"
            >
              {isRegenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Regenerate
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all font-bold text-sm"
            >
              <Trash2 size={18} />
              Delete Note
            </button>
          </div>
        </div>

        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
              <BookOpen size={20} />
            </div>
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">Detailed Study Notes</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-text-main mb-6 tracking-tighter leading-tight drop-shadow-sm">
            {material.title}
          </h1>
          <div className="flex items-center gap-4 text-text-muted text-sm border-t border-border pt-6 mt-6">
            <span className="flex items-center gap-2"><Calendar size={16} /> {material.uploadDate}</span>
            <span className="flex items-center gap-2"><FileText size={16} /> {material.type.toUpperCase()}</span>
          </div>
        </header>

        <div className="glass-card shadow-2xl p-6 sm:p-16 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-accent opacity-50" />
          
          {/* Render Multi-section Notes if available */}
          {material.noteSections && material.noteSections.length > 0 ? (
            <div className="space-y-20 divide-y divide-border">
              {material.noteSections.map((section, idx) => (
                <div key={idx} className={cn("space-y-10", idx > 0 && "pt-20")}>
                  <header className="space-y-2">
                    <span className="text-xs font-bold text-primary opacity-60 uppercase tracking-widest">Section {idx + 1}</span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight leading-none">
                      {section.heading}
                    </h2>
                  </header>
                  
                  {section.imageUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      className="rounded-3xl overflow-hidden border border-border bg-surface shadow-2xl group"
                    >
                      <img 
                        src={section.imageUrl} 
                        alt={section.heading} 
                        className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="bg-surface-alt p-4 flex items-center justify-center gap-2 border-t border-border">
                        <Sparkles size={14} className="text-secondary" />
                        <p className="text-[10px] text-text-muted italic tracking-wide">
                          AI-generated visual aid for "{section.heading}"
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="markdown-body text-text-main selection:bg-primary/30">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          ) : material.detailedNotes ? (
            <>
              {material.visualAidUrl && (
                <div className="mb-12">
                  <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-secondary" />
                    Conceptual Visual Aid
                  </h3>
                  <div className="rounded-2xl overflow-hidden border border-border bg-surface shadow-lg">
                    <img 
                      src={material.visualAidUrl} 
                      alt="Conceptual Visual Aid" 
                      className="w-full h-auto object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-3 text-center italic">
                    AI-generated visual representation of the core concepts.
                  </p>
                </div>
              )}
              <div className="markdown-body text-text-main leading-relaxed prose prose-invert max-w-none">
                <ReactMarkdown>{material.detailedNotes}</ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-secondary/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text-main mb-2">No detailed notes yet</h3>
              <p className="text-text-muted mb-8">Go back and click "Regenerate" to have AI create detailed notes for this material.</p>
              <button
                onClick={() => navigate(-1)}
                className="btn-primary"
              >
                Go Back
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-xl text-text-main hover:border-primary transition-all">
            <Download size={20} />
            Download PDF
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-xl text-text-main hover:border-primary transition-all">
            <Share2 size={20} />
            Share Notes
          </button>
        </div>
      </motion.div>

      <StudyTimer materialId={material.id} title={material.title} />
    </div>
  );
}
