import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateFlashcardsOnClient } from '../lib/gemini';

export default function Flashcards() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { materials, user, showToast } = useAppContext();
  const material = materials.find((m) => m.id === id);

  const [cards, setCards] = useState<{ question: string; answer: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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

  // Handle swiping mapping directly to drag coordinates logic in framer motion
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold && currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else if (info.offset.x > swipeThreshold && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const activeCard = cards[currentIndex];

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-xl mx-auto h-full flex flex-col pt-16">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <span className="text-xs font-bold text-text-muted">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative perspective-1000 w-full min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="w-full absolute inset-0 preserve-3d cursor-pointer"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: 50, rotateY: isFlipped ? 180 : 0 }}
            animate={{ opacity: 1, x: 0, rotateY: isFlipped ? 180 : 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            onClick={handleFlip}
          >
            {/* Front side (Question) */}
            <div
              className={cn(
                'absolute inset-0 backface-hidden w-full h-full p-8 flex items-center justify-center text-center glass-card border-t-4 border-primary rounded-3xl shadow-2xl bg-surface/80',
                isFlipped && 'invisible'
              )}
            >
              <div className="flex-1 w-full flex items-center justify-center overflow-y-auto custom-scrollbar px-2 max-h-[80%]">
                <h2 className="text-2xl sm:text-3xl font-bold text-text-main drop-shadow-sm leading-snug">
                  {activeCard.question}
                </h2>
              </div>
              <div className="absolute bottom-6 text-[10px] text-text-muted font-bold tracking-widest uppercase flex items-center gap-2">
                <RefreshCw size={12} /> Tap to reveal answer
              </div>
            </div>

            {/* Back side (Answer) */}
            <div
              className={cn(
                'absolute inset-0 backface-hidden w-full h-full p-6 sm:p-8 flex flex-col items-center justify-center text-center glass-card border-t-4 border-secondary rounded-3xl shadow-2xl bg-surface/95',
                !isFlipped && 'invisible'
              )}
              style={{ transform: 'rotateY(180deg)' }}
            >
              <div className="flex-1 w-full flex items-center justify-center overflow-y-auto custom-scrollbar px-2 max-h-[80%]">
                <p className="text-lg sm:text-xl font-medium text-text-main leading-relaxed">
                  {activeCard.answer}
                </p>
              </div>
              <div className="absolute bottom-6 text-[10px] text-text-muted font-bold tracking-widest uppercase">
                Swipe left/right for next card
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-12 flex justify-between w-full">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex((p) => p - 1);
              setIsFlipped(false);
            }
          }}
          className={cn(
            'px-6 py-3 rounded-xl font-bold transition-all',
            currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-surface hover:bg-surface/80 border border-border text-text-main'
          )}
        >
          Previous
        </button>

        <button
          onClick={() => {
            if (currentIndex < cards.length - 1) {
              setCurrentIndex((p) => p + 1);
              setIsFlipped(false);
            }
          }}
          className={cn(
            'px-6 py-3 rounded-xl font-bold transition-all',
            currentIndex === cards.length - 1 ? 'opacity-30 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20'
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
