import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Calendar, Sparkles, GraduationCap, ArrowLeft, Download, Share2, Volume2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateSpeech, playAudio } from '../services/ttsService';

export default function MaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { materials } = useAppContext();
  const material = materials.find(m => m.id === id);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!material) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-main">Material not found</h2>
        <Link to="/library" className="btn-primary">Back to Library</Link>
      </div>
    );
  }

  const handleListen = async () => {
    if (isSpeaking) return;
    
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

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-muted hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft size={20} /> Back
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
          <button className="p-3 bg-surface rounded-xl shadow-sm text-text-muted hover:text-primary transition-colors border border-border">
            <Download size={20} />
          </button>
          <button className="p-3 bg-surface rounded-xl shadow-sm text-text-muted hover:text-primary transition-colors border border-border">
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
              <button
                onClick={handleListen}
                disabled={isSpeaking}
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
            <div className="markdown-body text-text-main">
              <ReactMarkdown>{material.summary}</ReactMarkdown>
            </div>
          </section>

          {/* Key Topics */}
          <section className="glass-card p-8">
            <h2 className="text-xl font-bold mb-6 text-text-main">Key Topics</h2>
            <div className="flex flex-wrap gap-3">
              {material.keyTopics.map((topic, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-sm font-medium border border-primary/10"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Actions Card */}
          <div className="glass-card p-6 bg-primary text-white">
            <h3 className="text-lg font-bold mb-6">Study Actions</h3>
            <div className="space-y-3">
              <Link
                to={`/quiz/${material.id}`}
                className="flex items-center gap-3 w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <GraduationCap size={20} className="text-secondary" />
                <span className="font-bold">Take AI Quiz</span>
              </Link>
              <Link
                to={`/plans/create?materialId=${material.id}`}
                className="flex items-center gap-3 w-full p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <Calendar size={20} className="text-secondary" />
                <span className="font-bold">Create Study Plan</span>
              </Link>
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
    </div>
  );
}
