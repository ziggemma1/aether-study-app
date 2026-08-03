import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCw, X, Check, ArrowRight, Settings, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateFlashcardsOnClient } from '../lib/gemini';
import { useMotionValue, useTransform } from 'framer-motion';
import api from '../services/api';
import { Flashcard } from '../types';
import { useConfetti } from '../hooks/useConfetti';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { sounds } from '../lib/sounds';

export default function Flashcards() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { materials, user, showToast, updateMaterialInContext } = useAppContext();
  const material = materials.find((m) => m.id === id);
  const { burstConfetti, fireConfetti } = useConfetti();
  const { success: hapticSuccess, light: hapticLight } = useHapticFeedback();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Motion values for swipe effect
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const checkOpacity = useTransform(x, [50, 150], [0, 1]);
  const crossOpacity = useTransform(x, [-150, -50], [1, 0]);

  const [completedCount, setCompletedCount] = useState(0);
  const [totalInitial, setTotalInitial] = useState(0);

  // Reset x and direction for each new card
  useEffect(() => {
    x.set(0);
  }, [cards, x]);

  const fetchOrGenerateCards = useCallback(async () => {
    if (!material) return;
    
    try {
      // Check if we have custom settings
      if (location.state?.settings) {
        setIsGeneratingCustom(true);
        const { count } = location.state.settings;
        const textToProcess = material.content || material.summary || material.title;
        const generatedCards = await generateFlashcardsOnClient(textToProcess, user?.language, count);
        
        const newCards = generatedCards.map(c => ({
          ...c,
          interval: 0,
          repetitions: 0,
          easeFactor: 2.5,
          nextReview: new Date().toISOString(),
          _id: Math.random().toString(36).substr(2, 9) // Temporary ID for session
        }));
        
        setCards(newCards as Flashcard[]);
        setTotalInitial(newCards.length);
        setIsGeneratingCustom(false);
        return;
      }

      if (material.flashcards && material.flashcards.length > 0) {
        // Filter cards starting from those due today OR never reviewed
        const now = new Date();
        const dueCards = material.flashcards.filter(card => {
          if (!card.nextReview) return true;
          return new Date(card.nextReview) <= now;
        });
        
        // If everything is studied, maybe just show them all in randomized order for "practice"
        const sessionCards = dueCards.length > 0 ? dueCards : [...material.flashcards].sort(() => Math.random() - 0.5);
        
        setCards(sessionCards);
        setTotalInitial(sessionCards.length);
      } else {
        // Generate and SAVE
        const textToProcess = material.content || material.summary || material.title;
        const generatedCards = await generateFlashcardsOnClient(textToProcess, user?.language);
        
        // Save to backend
        const res = await api.put(`/materials/${material.id}`, {
          flashcards: generatedCards.map(c => ({
            ...c,
            interval: 0,
            repetitions: 0,
            easeFactor: 2.5,
            nextReview: new Date()
          }))
        });
        
        updateMaterialInContext(res.data);
        setCards(res.data.flashcards);
        setTotalInitial(res.data.flashcards.length);
      }
    } catch (error: any) {
      showToast('Failed to prepare flashcards: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [material, user?.language, showToast, updateMaterialInContext]);

  useEffect(() => {
    if (isLoading && material) {
      fetchOrGenerateCards();
    } else if (!material) {
      setIsLoading(false);
    }
  }, [material, isLoading, fetchOrGenerateCards]);

  const handleReview = async (quality: number) => {
    const currentCard = cards[0];
    if (!currentCard || !currentCard._id || !material) return;

    try {
      const res = await api.post(`/materials/${material.id}/flashcards/${currentCard._id}/review`, { quality });
      // update context with new card data
      const updatedFlashcards = material.flashcards?.map(f => f._id === currentCard._id ? res.data.card : f);
      updateMaterialInContext({ ...material, flashcards: updatedFlashcards });
    } catch (err) {
      console.error("Failed to save review", err);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    const swipeThreshold = 100;
    if (info.offset.x < -swipeThreshold) {
      reviewAgain();
    } else if (info.offset.x > swipeThreshold) {
      markKnown();
    }
  };

  const reviewAgain = async () => {
    setDirection(-1);
    setIsFlipped(false);
    hapticLight();
    sounds.play('wrong');

    // Save "Again" (quality 0)
    await handleReview(0);

    setTimeout(() => {
      setCards(prev => {
        const [current, ...rest] = prev;
        return [...rest, current];
      });
      setDirection(0);
    }, 200);
    showToast("We'll review this again shortly", "success");
  };

  const markKnown = async () => {
    setDirection(1);
    setCompletedCount(prev => prev + 1);
    setIsFlipped(false);
    hapticSuccess();
    burstConfetti();
    sounds.play('correct');

    // Save "Good" (quality 5)
    await handleReview(5);

    setTimeout(() => {
      if (cards.length > 1) {
        setCards(prev => prev.slice(1));
        setDirection(0);
      } else {
        fireConfetti();
        sounds.play('levelup');
        setIsFinished(true);
      }
    }, 200);
  };

  const restartSession = () => {
    setIsFinished(false);
    setCompletedCount(0);
    setIsFlipped(false);
    setIsLoading(true);
    fetchOrGenerateCards();
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (isFinished) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-12 border-b-8 border-emerald-500"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 sm:w-24 sm:h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-8"
          >
            <Trophy size={32} className="sm:hidden" />
            <Trophy size={48} className="hidden sm:block" />
          </motion.div>
          <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter mb-1 sm:mb-2">Deck Mastered</h1>
          <p className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-widest mb-6 sm:mb-8">
            Every card in this session reviewed
          </p>

          <div className="text-5xl sm:text-7xl font-black text-emerald-500 mb-8 sm:mb-12 tabular-nums">
            {completedCount}/{totalInitial}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button onClick={() => navigate(-1)} className="btn-primary w-full">
              Back to Material
            </button>
            <button onClick={restartSession} className="btn-secondary w-full">
              Study Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading || isGeneratingCustom) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-text-muted font-black uppercase tracking-[0.2em] text-[11px] animate-pulse">
          {isGeneratingCustom ? "Crafting custom flashcards..." : "Syncing your study cards..."}
        </p>
      </div>
    );
  }

  if (!material || cards.length === 0) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-main">No flashcards could be generated.</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
      </div>
    );
  }

  const activeCard = cards[0];

  return (
    <div className="p-4 max-w-xl mx-auto flex flex-col pt-2 overflow-y-visible">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm font-medium p-2"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[11px] font-black uppercase text-primary tracking-widest mb-0.5">Progress</span>
          <span className="text-xs font-bold text-text-muted">
            {completedCount} / {totalInitial} Mastered
          </span>
        </div>
      </div>

      <div className="relative perspective-1000 w-full flex items-center justify-center min-h-[400px] mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCard.question}
            style={{ x, rotate, opacity }}
            className="w-full max-w-[320px] h-[400px] relative preserve-3d cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.9, x: direction * 300 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.8, 
              x: x.get() === 0 ? (direction * 500) : (x.get() > 0 ? 500 : -500),
              rotate: x.get() > 0 ? 45 : -45
            }}
            transition={{ type: "spring", damping: 25, stiffness: 150 }}
            onClick={handleFlip}
          >
            {/* Swipe Indicators */}
            <motion.div 
              style={{ opacity: checkOpacity }}
              className="absolute top-10 right-10 z-50 bg-emerald-500 text-white p-4 rounded-2xl border-4 border-white shadow-xl rotate-12 pointer-events-none"
            >
              <Check size={40} strokeWidth={4} />
            </motion.div>

            <motion.div 
              style={{ opacity: crossOpacity }}
              className="absolute top-10 left-10 z-50 bg-rose-500 text-white p-4 rounded-2xl border-4 border-white shadow-xl -rotate-12 pointer-events-none"
            >
              <X size={40} strokeWidth={4} />
            </motion.div>

            {/* Front side (Question) */}
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", damping: 20 }}
              className={cn(
                'absolute inset-0 backface-hidden w-full h-full p-8 flex flex-col items-center justify-center text-center glass-card border-b-8 border-primary rounded-[40px] shadow-2xl bg-surface/90 transition-colors overflow-hidden',
                isFlipped && 'pointer-events-none'
              )}
            >
              {/* Subtle Texture/Pattern Background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                <div className="mb-6 w-16 h-1.5 bg-primary/30 rounded-full" />
                <div className="flex-1 w-full flex items-center justify-center px-2">
                  <h2 className="text-2xl sm:text-4xl font-black text-text-main leading-[1.1] tracking-tighter">
                    {activeCard.question}
                  </h2>
                </div>
                <div className="mt-8 py-3 px-8 bg-primary/10 rounded-full text-[11px] text-primary font-black tracking-[0.2em] uppercase flex items-center gap-3 border border-primary/20 backdrop-blur-sm group-hover:scale-105 transition-transform">
                  <RefreshCw size={14} className="animate-spin-slow" /> Tap to reveal
                </div>
              </div>
            </motion.div>

            {/* Back side (Answer) */}
            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: isFlipped ? 0 : 180 }}
              transition={{ duration: 0.6, type: "spring", damping: 20 }}
              className={cn(
                'absolute inset-0 backface-hidden w-full h-full p-8 flex flex-col items-center justify-center text-center glass-card border-b-8 border-emerald-500 rounded-[40px] shadow-2xl bg-surface/95 transition-colors overflow-hidden',
                !isFlipped && 'pointer-events-none'
              )}
              style={{ rotateY: 180 }}
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              
              <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                <div className="mb-6 w-16 h-1.5 bg-emerald-500/30 rounded-full" />
                <div className="flex-1 w-full flex items-center justify-center px-2">
                  <div className="text-lg sm:text-2xl font-medium text-text-main leading-relaxed italic font-serif">
                    {activeCard.answer}
                  </div>
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={(e) => { e.stopPropagation(); reviewAgain(); }}
                    className="py-4 bg-rose-500 text-white rounded-2xl text-[11px] font-black tracking-widest uppercase flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-500/20 active:scale-95 transition-transform"
                  >
                    <X size={18} />
                    <span>Still Learning</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); markKnown(); }}
                    className="py-4 bg-emerald-500 text-white rounded-2xl text-[11px] font-black tracking-widest uppercase flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
                  >
                    <Check size={18} />
                    <span>Got it!</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Instruction Bar */}
      <div className="mt-12 flex items-center justify-between px-4">
        <button 
          onClick={reviewAgain}
          className="flex flex-col items-center group active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all">
            <X size={20} />
          </div>
          <span className="text-[11px] font-black uppercase text-text-muted tracking-tighter">Review</span>
        </button>

        <div className="h-0.5 flex-1 mx-8 bg-gradient-to-r from-rose-500/20 via-transparent to-emerald-500/20 rounded-full opacity-30" />

        <button 
          onClick={markKnown}
          className="flex flex-col items-center group active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <Check size={20} />
          </div>
          <span className="text-[11px] font-black uppercase text-text-muted tracking-tighter">I Know This</span>
        </button>
      </div>
    </div>
  );
}
