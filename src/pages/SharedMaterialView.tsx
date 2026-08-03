import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  Save, 
  Loader2, 
  User, 
  Lock, 
  ChevronRight, 
  Clock, 
  Layers,
  ArrowRight
} from 'lucide-react';
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
      showToast('Redirecting to login to save...', 'success');
      navigate('/login', { state: { from: `/share/${token}` } });
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post('/materials/save-from-share', { shareToken: token });
      
      // Refresh the context's material list so it shows up without a reload
      if (typeof (window as any).refreshMaterials === 'function') {
        await (window as any).refreshMaterials();
      }
      
      showToast('Successfully added to your library!', 'success');
      
      // Navigate to the full detail view of the new material
      const newId = response.data._id || response.data.id;
      navigate(`/library/${newId}`);
    } catch (error: any) {
      console.error('Failed to save material:', error);
      showToast(error.message || 'Failed to save material', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f8fafc]">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
        <p className="mt-6 text-slate-500 font-medium tracking-tight">Accessing shared intelligence...</p>
      </div>
    );
  }

  if (!material) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-primary/10">
      {/* Premium Header */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div 
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white cursor-pointer shadow-lg shadow-primary/20 hover:scale-105 transition-all group"
            >
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate leading-tight">{material.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Shared Material</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all font-bold text-xs shadow-xl shadow-primary/25 disabled:opacity-50 whitespace-nowrap active:scale-95"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {window.innerWidth > 640 ? 'Save to My Collection' : 'Save'}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-10 pb-32">
        <motion.div
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Main Content Card */}
          <div className="bg-white rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden mb-8">
            <div className="p-8 md:p-12 border-b border-slate-50">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-[11px] font-black uppercase tracking-[0.1em]">
                  {material.type}
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <User size={13} strokeWidth={2.5} />
                  <span>{material.userId?.name || 'Academic Contributor'}</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                   <Clock size={13} strokeWidth={2.5} />
                   <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 leading-[1.1] tracking-tight">
                {material.title}
              </h1>

              <div className="flex flex-wrap gap-2.5 mb-2">
                {material.keyTopics?.map((topic: string, idx: number) => (
                  <span 
                    key={topic + idx} 
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full text-[11px] font-bold text-slate-600 border border-slate-200/10 cursor-default"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-slate-50/50 p-8 md:p-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-primary group">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Executive Summary</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">AI-generated core insights</p>
                </div>
              </div>
              
              <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed prose-headings:text-slate-900 prose-headings:font-bold">
                <ReactMarkdown>{material.summary || "No summary available."}</ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Detailed Content Preview */}
            <div className="md:col-span-8">
              <section className="bg-white rounded-[32px] border border-slate-200/60 shadow-lg shadow-slate-200/20 overflow-hidden relative">
                <div className="p-8 md:p-10">
                   <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <FileText size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">Comprehensive Study Guide</h3>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="prose prose-slate max-w-none pt-2 opacity-60 pointer-events-none select-none">
                       <ReactMarkdown>{material.detailedNotes || "No detailed notes available."}</ReactMarkdown>
                    </div>
                    
                    {/* Locked Paywall-style Overlay */}
                    <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-white via-white/40 to-transparent flex flex-col items-center justify-end pb-12 px-8 text-center bg-white/10 backdrop-blur-[2px]">
                      <div className="bg-white p-8 rounded-[28px] border border-slate-200 shadow-2xl max-w-sm mb-4 transform translate-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                          <Lock size={28} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Study guide is protected</h4>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium mb-8">
                          Save this material to unlock the full study guide and generate interactive flashcards & quizzes.
                        </p>
                        <button
                          onClick={handleSaveToLibrary}
                          disabled={isSaving}
                          className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
                        >
                          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                          Add to My Materials
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar Stats/CTA */}
            <div className="md:col-span-4 space-y-6">
              <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <h3 className="text-xl font-bold mb-4 relative z-10">Power up your learning</h3>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed relative z-10 font-medium">
                  Use Aether's proprietary AI to master this topic in half the time.
                </p>
                
                <div className="space-y-4 mb-10 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                      <Sparkles size={12} className="text-primary" />
                    </div>
                    <span className="text-xs font-bold">Smart Quiz Generation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                      <Layers size={12} className="text-primary" />
                    </div>
                    <span className="text-xs font-bold">Spaced Repetition Cards</span>
                  </div>
                </div>

                <a 
                  href="/signup"
                  className="block w-full py-4 bg-white text-slate-900 font-bold rounded-2xl text-center text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-lg"
                >
                  Join Aether Free
                </a>
              </div>

               {/* App Teaser Card */}
               <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10">
                  <div className="flex items-center gap-2 mb-4 text-primary">
                    <BookOpen size={16} />
                    <span className="text-[11px] font-black uppercase tracking-widest">About Aether Study</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Aether is an intelligent study assistant that helps you synthesize complex information from PDFs, Videos, and Articles into actionable knowledge.
                  </p>
               </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Modern Floating Bottom Bar for Mobile */}
      <AnimatePresence>
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 md:hidden z-[110] bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/90 to-transparent pt-8"
        >
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 disabled:opacity-50 active:scale-95 transition-transform"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save to My Library
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
