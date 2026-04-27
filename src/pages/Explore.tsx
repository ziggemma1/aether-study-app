import React, { useState, useEffect } from 'react';
import { Compass, Search, Download, Star, Filter, Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';

export default function Explore() {
  const { showToast, setMaterials } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [publicNotes, setPublicNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPublicNotes();
  }, []);

  const fetchPublicNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials/public');
      setPublicNotes(res.data);
    } catch (err) {
      showToast('Failed to load community notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (noteId: string, title: string) => {
    try {
      const res = await api.post(`/materials/clone/${noteId}`);
      if (setMaterials) {
        setMaterials(prev => [res.data, ...prev]);
      }
      showToast(`Cloned "${title}" to your library!`);
      // Update local download count
      setPublicNotes(prev => prev.map(n => (n._id === noteId || n.id === noteId) ? { ...n, downloads: n.downloads + 1 } : n));
    } catch (err) {
      showToast('Failed to clone material', 'error');
    }
  };

  const filteredNotes = publicNotes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    (n.authorName && n.authorName.toLowerCase().includes(search.toLowerCase())) ||
    (n.category && n.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <header className="mb-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 shadow-xl shadow-primary/10 border border-primary/20">
          <Compass size={36} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main mb-2">Community Note Explorer</h1>
        <p className="text-text-muted mb-8 max-w-lg">Discover top-rated notes and flashcards from students around the world. Clone them to your library.</p>
        
        <div className="w-full max-w-2xl relative">
          <input 
            type="text" 
            placeholder="Search for subjects, topics, or authors..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface border border-secondary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-text-main placeholder-text-muted/50"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-surface-alt rounded-xl hover:bg-secondary/20 transition-colors">
             <Filter size={18} className="text-text-main" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="text-primary animate-spin mb-4" />
          <p className="text-text-muted">Exploring the Aether for top notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted">No notes found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredNotes.map((note, index) => (
            <motion.div 
              key={note._id || note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                    {note.category || 'General'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                    <Star size={12} className="fill-amber-500" /> {note.rating || '5.0'}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-text-main mb-2 line-clamp-2">{note.title}</h3>
                <p className="text-sm text-text-muted mb-6">By @{note.authorName?.replace(/\s+/g, '_').toLowerCase() || 'aether_user'}</p>
              </div>
              
              <div className="flex items-center justify-between mt-auto relative z-10 pt-4 border-t border-border">
                <div className="flex items-center gap-4 text-xs font-bold text-text-muted">
                   <span className="flex items-center gap-1"><Heart size={14} className="text-red-400" /> {note.likes || 0}</span>
                   <span className="flex items-center gap-1"><Download size={14} /> {note.downloads || 0}</span>
                </div>
                <button 
                  onClick={() => handleClone(note._id || note.id, note.title)} 
                  className="p-2 sm:px-4 sm:py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all text-xs font-bold flex items-center gap-2"
                >
                   <Download size={14} /> <span className="hidden sm:inline">Clone to Library</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
