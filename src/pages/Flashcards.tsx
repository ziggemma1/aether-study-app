import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCw, X, Check, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateFlashcardsOnClient } from '../lib/gemini';
import { useMotionValue, useTransform } from 'framer-motion';

export default function Flashcards() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { materials, user, showToast } = useAppContext();
  const material = materials.find((m) => m.id === id);

  const [cards, setCards] = useState<{ question: string; answer: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  // Motion values for swipe effect
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const checkOpacity = useTransform(x, [50, 150], [0, 1]);
  const crossOpacity = useTransform(x, [-150, -50], [1, 0]);

  useEffect(() => {
    if (!material) {
      setIsLoading(false);
      return;
    }

    const fetchCards = async () => {
      try {
        const textToProcess = material.content || material.summary || material.title;
        const generatedCards = await generateFlashcardsOnClient(textToProcess, user?.language);
        setCards(generatedCards);
      } catch (error: any) {
        showToast('Failed to generate flashcards: ' + error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCards();
  }, [material, user?.language, showToast]);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 100;
    if (info.offset.x < -swipeThreshold) {
      // Swipe Left = Review again
      nextCard(-1);
    } else if (info.offset.x > swipeThreshold) {
      // Swipe Right = Knew it
      nextCard(1);
    }
  };

  const nextCard = (dir: number) => {
    setDirection(dir);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      showToast("Session complete! You've reviewed all cards.", "success");
      navigate(-1);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-text-muted font-medium">Generating smart flashcards using AI...</p>
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

  const activeCard = cards[currentIndex];

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-xl mx-auto h-full flex flex-col pt-16 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Progress</span>
          <span className="text-xs font-bold text-text-muted">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative perspective-1000 w-full min-h-[450px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            style={{ x, rotate, opacity }}
            className="w-full absolute inset-0 preserve-3d cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.8, x: direction * 200 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.5, 
              x: x.get() === 0 ? (direction * -200) : (x.get() > 0 ? 500 : -500),
              rotate: x.get() > 0 ? 45 : -45
            }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
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
                'absolute inset-0 backface-hidden w-full h-full p-8 flex flex-col items-center justify-center text-center glass-card border-b-8 border-primary rounded-[40px] shadow-2xl bg-surface/90 transition-colors',
                isFlipped && 'pointer-events-none'
              )}
            >
              <div className="mb-4 w-12 h-1 bg-primary/20 rounded-full" />
              <div className="flex-1 w-full flex items-center justify-center overflow-y-auto custom-scrollbar px-2">
                <h2 className="text-2xl sm:text-3xl font-black text-text-main leading-tight tracking-tight">
                  {activeCard.question}
                </h2>
              </div>
              <div className="mt-8 py-3 px-6 bg-primary/10 rounded-2xl text-[10px] text-primary font-black tracking-widest uppercase flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin-slow" /> Tap to reveal
              </div>
            </motion.div>

            {/* Back side (Answer) */}
            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: isFlipped ? 0 : 180 }}
              transition={{ duration: 0.6, type: "spring", damping: 20 }}
              className={cn(
                'absolute inset-0 backface-hidden w-full h-full p-8 flex flex-col items-center justify-center text-center glass-card border-b-8 border-secondary rounded-[40px] shadow-2xl bg-surface/95 transition-colors',
                !isFlipped && 'pointer-events-none'
              )}
              style={{ rotateY: 180 }}
            >
              <div className="mb-4 w-12 h-1 bg-secondary/20 rounded-full" />
              <div className="flex-1 w-full flex items-center justify-center overflow-y-auto custom-scrollbar px-2">
                <p className="text-lg sm:text-xl font-bold text-text-main leading-relaxed">
                  {activeCard.answer}
                </p>
              </div>
              <div className="mt-8 flex gap-4 w-full">
                <div className="flex-1 py-3 bg-rose-500/10 rounded-2xl text-[10px] text-rose-500 font-black tracking-widest uppercase flex items-center justify-center gap-2 border border-rose-500/20">
                  <ArrowLeft size={14} /> Swipe Left
                </div>
                <div className="flex-1 py-3 bg-emerald-500/10 rounded-2xl text-[10px] text-emerald-500 font-black tracking-widest uppercase flex items-center justify-center gap-2 border border-emerald-500/20">
                  Swipe Right <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Instruction Bar */}
      <div className="mt-12 flex items-center justify-between px-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2 border border-rose-500/20">
            <X size={20} />
          </div>
          <span className="text-[10px] font-black uppercase text-text-muted tracking-tighter">Review</span>
        </div>

        <div className="h-0.5 flex-1 mx-8 bg-gradient-to-r from-rose-500/20 via-transparent to-emerald-500/20 rounded-full" />

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 border border-emerald-500/20">
            <Check size={20} />
          </div>
          <span className="text-[10px] font-black uppercase text-text-muted tracking-tighter">I Know This</span>
        </div>
      </div>
    </div>
  );
}
