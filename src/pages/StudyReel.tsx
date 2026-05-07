import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Player } from '@remotion/player';
import { MyComposition } from '../remotion/Composition';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Share2, Sparkles } from 'lucide-react';

export default function StudyReel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { materials } = useAppContext();
  const material = materials.find(m => m.id === id);

  if (!material) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-main">Material not found</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-primary mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} /> Back to Details
        </button>

        <header className="mb-8">
            <h1 className="text-3xl font-bold text-text-main mb-2">Study Reel: {material.title}</h1>
            <p className="text-text-muted">AI-generated visual summary of your study material</p>
        </header>

        <div className="glass-card overflow-hidden bg-black aspect-video relative group">
          <Player
            component={MyComposition}
            durationInFrames={600}
            compositionWidth={1280}
            compositionHeight={720}
            fps={30}
            controls
            loop
            style={{
              width: '100%',
              height: '100%',
            }}
            inputProps={{
              title: material.title,
              summary: material.summary || '',
              topics: material.keyTopics || []
            }}
          />
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              <Download size={20} />
              Export Video
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-surface border border-border text-text-main rounded-2xl font-bold hover:bg-border/10 transition-all">
              <Share2 size={20} />
              Share Reel
            </button>
          </div>

          <div className="flex items-center gap-2 text-secondary font-bold bg-secondary/10 px-4 py-2 rounded-full border border-secondary/20">
            <Sparkles size={16} />
            <span>AI Enhanced Visuals</span>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 border-l-4 border-primary">
                <h4 className="font-bold text-primary mb-2 italic">Why Study Reels?</h4>
                <p className="text-sm text-text-muted">Visual learning increases retention by 65%. These reels are designed to hit your brain's pleasure centers while delivering facts.</p>
            </div>
            <div className="glass-card p-6 border-l-4 border-secondary">
                <h4 className="font-bold text-secondary mb-2 italic">Dynamic Text</h4>
                <p className="text-sm text-text-muted">The text movements are synced to optimal reading speeds (WPM) for maximum absorption.</p>
            </div>
            <div className="glass-card p-6 border-l-4 border-accent">
                <h4 className="font-bold text-accent mb-2 italic">Audio Sync</h4>
                <p className="text-sm text-text-muted">Best paired with the focus sounds from the Study Timer for deep immersion.</p>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
