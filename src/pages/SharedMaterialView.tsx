import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Sparkles, Download, Share2, Loader2, Link, Save, ArrowLeft, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import { cn } from '../lib/utils';

export default function SharedMaterialView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, showToast } = useAppContext();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSharedMaterial = async () => {
      try {
        const response = await api.get(`/materials/shared/${token}`);
        setMaterial(response.data);
      } catch (error: any) {
        console.error('Failed to fetch shared material:', error);
        showToast('Shared content not found or expired', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedMaterial();
  }, [token, navigate, showToast]);

  const handleSaveToLibrary = async () => {
    if (!user) {
      showToast('Please sign in to save this material to your library', 'success');
      navigate('/login', { state: { from: `/share/${token}` } });
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post('/materials/save-from-share', { shareToken: token });
      showToast('Saved successfully to your library!');
      navigate(`/library/${response.data._id || response.data.id}`);
    } catch (error: any) {
      console.error('Failed to save material:', error);
      showToast(error.message || 'Failed to save material', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-text-muted font-medium">Decrypting knowledge...</p>
      </div>
    );
  }

  if (!material) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/10 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary cursor-pointer hover:scale-105 transition-transform"
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-main line-clamp-1">{material.title}</h1>
              <p className="text-[10px] text-text-muted font-medium">Shared via Aether Study</p>
            </div>
          </div>
          
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all font-bold text-xs shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save to My Materials
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto pb-24">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          {/* Material Info Card */}
          <div className="glass-card p-6 md:p-8 mb-8 border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BookOpen size={100} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[10px] font-black uppercase tracking-wider">
                  {material.type}
                </span>
                {material.userId?.name && (
                  <div className="flex items-center gap-1.5 text-text-muted text-xs font-medium ml-2">
                    <User size={12} />
                    <span>Shared by {material.userId.name}</span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-main mb-6 leading-tight">
                {material.title}
              </h2>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {material.keyTopics?.map((topic: string, idx: number) => (
                  <span key={topic + idx} className="px-3 py-1 bg-surface-alt border border-border rounded-lg text-[10px] font-bold text-text-muted uppercase tracking-wider">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Summary */}
              <section className="bg-surface rounded-[24px] p-6 md:p-8 border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                   <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-lg font-bold text-text-main">Brief Summary</h3>
                </div>
                <div className="markdown-body text-text-main leading-relaxed text-sm md:text-base">
                  <ReactMarkdown>{material.summary || "No summary available."}</ReactMarkdown>
                </div>
              </section>

              {/* Detailed Notes Preview */}
              {material.detailedNotes && (
                <section className="bg-surface rounded-[24px] p-6 md:p-8 border border-border/50 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent z-10" />
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <FileText size={16} />
                    </div>
                    <h3 className="text-lg font-bold text-text-main">Detailed Notes</h3>
                  </div>
                  <div className="markdown-body text-text-main/80 space-y-4 text-sm max-h-96 overflow-hidden">
                    <ReactMarkdown>{material.detailedNotes}</ReactMarkdown>
                  </div>
                  
                  <div className="relative z-20 mt-4 text-center">
                    <p className="text-xs text-text-muted mb-4 font-medium italic">Save this material to view the full detailed notes and interactive study guides.</p>
                    <button 
                      onClick={handleSaveToLibrary}
                      className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                      <Save size={16} />
                      Save to unlock full content
                    </button>
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              {/* Call to Action Card */}
              <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                <h3 className="text-xl font-bold mb-4 relative z-10">Study Smart with Aether</h3>
                <p className="text-sm text-white/80 mb-6 leading-relaxed relative z-10">
                  Join Aether Study to transform your materials into interactive quizzes, smart flashcards, and AI-powered study plans.
                </p>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-4 bg-white text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10 shadow-lg shadow-black/10"
                >
                  Create Free Account
                </button>
              </div>

               {/* Real Life Applications */}
               {material.realLifeApplications && material.realLifeApplications.length > 0 && (
                <section className="bg-surface rounded-[24px] p-6 border border-border/50">
                  <h3 className="font-bold text-text-main mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <Sparkles size={12} />
                    </div>
                    Applications
                  </h3>
                  <div className="space-y-3">
                    {material.realLifeApplications.slice(0, 3).map((app: string, idx: number) => (
                      <div key={idx} className="flex gap-3">
                        <div className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                        <p className="text-xs text-text-main/70 leading-relaxed">{app}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Floating Save Button for Mobile */}
      <div className="fixed bottom-6 left-0 right-0 px-4 md:hidden z-[60]">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveToLibrary}
          disabled={isSaving}
          className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? 'Processing...' : 'Save to Library'}
        </motion.button>
      </div>
    </div>
  );
}
