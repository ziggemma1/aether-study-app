import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Sparkles, Download, Share2, FileText, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { StudyTimer } from '../components/StudyTimer';
import api from '../services/api';

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
            className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={20} /> Back to Material
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-all font-bold text-sm"
          >
            <Trash2 size={18} />
            Delete Note
          </button>
        </div>

        <header className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
              <FileText size={20} />
            </div>
            <span className="text-text-muted text-sm font-medium uppercase tracking-wider">Detailed Study Notes</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-main mb-4">{material.title}</h1>
          <p className="text-text-muted">A deep dive into the core concepts and detailed explanations.</p>
        </header>

        <div className="glass-card p-8 sm:p-12">
          {/* Render Multi-section Notes if available */}
          {material.noteSections && material.noteSections.length > 0 ? (
            <div className="space-y-16">
              {material.noteSections.map((section, idx) => (
                <div key={idx} className="space-y-6">
                  <h2 className="text-2xl font-bold text-text-main border-b border-border pb-2">
                    {section.heading}
                  </h2>
                  
                  {section.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-border bg-surface shadow-lg max-w-2xl mx-auto">
                      <img 
                        src={section.imageUrl} 
                        alt={section.heading} 
                        className="w-full h-auto object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] text-text-muted p-2 text-center italic bg-surface/50">
                        Visual representation for: {section.heading}
                      </p>
                    </div>
                  )}

                  <div className="markdown-body text-text-main leading-relaxed prose prose-invert max-w-none">
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
