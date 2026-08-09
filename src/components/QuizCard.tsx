import { useState } from 'react';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { sounds } from '../lib/sounds';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizCardProps {
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct answer
  onAnswer?: (isCorrect: boolean) => void;
}

export function QuizCard({ question, options, correctAnswer, onAnswer }: QuizCardProps) {
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [effect, setEffect] = useState('');
  const { success, error } = useHapticFeedback();

  const handleAnswer = (optionIdx: number) => {
    if (answered) return;
    
    setSelectedIdx(optionIdx);
    const correct = optionIdx === correctAnswer;
    setAnswered(true);
    
    if (correct) {
      setEffect('quiz-correct');
      success();
      sounds.play('correct');
      
      // Dispatch a quiz-correct event
      const event = new CustomEvent('quiz-correct', { detail: { score: 100 } });
      window.dispatchEvent(event);
    } else {
      setEffect('quiz-wrong');
      error();
      sounds.play('wrong');
    }
    
    if (onAnswer) {
      onAnswer(correct);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-hover p-5 sm:p-6 bg-surface border border-border/10 rounded-[24px] ${effect}`}
    >
      <h3 className="text-sm font-semibold text-text-main mb-4 leading-normal">
        {question}
      </h3>
      <div className="flex flex-col gap-2.5">
        {options.map((option, idx) => {
          let optionStyle = "bg-surface-alt border border-border/10 text-text-main";
          
          if (answered) {
            if (idx === correctAnswer) {
              optionStyle = "bg-accent/25 border-accent text-accent font-bold scale-[1.01]";
            } else if (idx === selectedIdx) {
              optionStyle = "bg-brand-pink/20 border-brand-pink text-brand-pink font-bold scale-[0.99]";
            } else {
              optionStyle = "opacity-40 bg-surface-alt border-border/5 text-text-muted";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={answered}
              className={`btn-ripple text-left p-3.5 rounded-xl text-xs flex items-center justify-between transition-all duration-200 outline-none ${optionStyle}`}
            >
              <span className="flex-1 pr-4">{option}</span>
              {answered && idx === correctAnswer && (
                <span className="text-accent text-[11px] uppercase font-black tracking-widest shrink-0">✓ Correct</span>
              )}
              {answered && idx === selectedIdx && idx !== correctAnswer && (
                <span className="text-brand-pink text-[11px] uppercase font-black tracking-widest shrink-0">✗ Wrong</span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
