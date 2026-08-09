import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Trophy, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { StudyTimer } from '../components/StudyTimer';
import { useConfetti } from '../hooks/useConfetti';
import { generateQuizQuestionsOnClient } from '../lib/gemini';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { sounds } from '../lib/sounds';

import api from '../services/api';

export default function QuizInterface() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { materials, setQuizResults, isLoading: isAppLoading, fetchAppData, user, setUser, updateMaterialInContext, showToast } = useAppContext();
  const { burstConfetti, fireConfetti } = useConfetti();
  const { success: hapticSuccess, error: hapticError, light: hapticLight } = useHapticFeedback();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ optionIdx: number; isCorrect: boolean } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);

  const material = materials.find(m => m.id === id);

  useEffect(() => {
    const generateCustomQuiz = async () => {
      if (location.state?.settings && material) {
        setIsGenerating(true);
        try {
          const { count, difficulty, complexity } = location.state.settings;
          const textToProcess = material.content || material.summary || material.title;
          const questions = await generateQuizQuestionsOnClient(
            textToProcess,
            user?.language,
            count,
            difficulty,
            complexity
          );
          setCustomQuestions(questions);
          
          // Optionally save these to the material? 
          // The user might want to keep the "suggested" ones and have "session" ones.
          // For now, let's just use them for this session.
        } catch (error) {
          console.error("Failed to generate custom quiz:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    };

    generateCustomQuiz();
  }, [location.state, material, user?.language]);

  if ((isAppLoading && !material) || isGenerating) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center bg-background">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse -z-10" />
        </div>
        <p className="text-text-muted font-black uppercase tracking-[0.2em] text-[11px] animate-pulse">
          {isGenerating ? "Crafting your custom AI quiz..." : "Syncing smart quiz..."}
        </p>
      </div>
    );
  }

  const questions = customQuestions.length > 0 ? customQuestions : (material?.suggestedQuizQuestions || []);

  const handleAnswer = (optionIdx: number) => {
    if (feedback) return; // Prevent double clicking during feedback

    const correct = questions[currentQuestion].correctAnswer === optionIdx;
    setFeedback({ optionIdx, isCorrect: correct });

    if (correct) {
      burstConfetti();
      sounds.play('correct');
      hapticSuccess();
    } else {
      sounds.play('wrong');
      hapticError();
    }

    // Delay move to next or just set answer
    setTimeout(() => {
      const newAnswers = [...selectedAnswers];
      newAnswers[currentQuestion] = optionIdx;
      setSelectedAnswers(newAnswers);
      setFeedback(null);
      
      // Auto move if it's not the last one? 
      // User might want to see the feedback longer, let's let them click next
    }, 800);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishQuiz = async () => {
    let correctCount = 0;
    selectedAnswers.forEach((answer, idx) => {
      if (answer === questions[idx].correctAnswer) {
        correctCount++;
      }
    });

    if ((correctCount / questions.length) >= 0.7) {
      fireConfetti();
      sounds.play('levelup');
    } else {
      sounds.play('wrong');
    }

    try {
      const response = await api.post('/quizzes', {
        quizId: id,
        score: correctCount,
        totalQuestions: questions.length,
        answers: selectedAnswers,
        date: new Date().toISOString()
      });
      
      const newResult = {
        ...response.data,
        id: response.data._id || response.data.id
      };

      setQuizResults(prev => [...prev, newResult]);

      // The server just recomputed aetherPoints/streak (and possibly unlocked
      // achievements) — apply them directly instead of waiting on a full
      // refetch, which fetchAppData below doesn't actually cover (it never
      // re-hits /auth/me).
      if (response.data.aetherPoints !== undefined && user) {
        setUser({
          ...user,
          aetherPoints: response.data.aetherPoints,
          streak: response.data.streak ?? user.streak,
          // Missing here meant a freeze auto-spent by this quiz never showed
          // up as a lower balance on the Shop page until the next full reload.
          freezeTokens: response.data.freezeTokens ?? user.freezeTokens
        });

        if (response.data.freezeUsed) {
          showToast(`A streak freeze covered yesterday — ${response.data.freezeTokens} left.`, 'success');
        }
      }

      if (Array.isArray(response.data.newlyUnlockedAchievements)) {
        response.data.newlyUnlockedAchievements.forEach((badge: any) => {
          window.dispatchEvent(new CustomEvent('achievement:unlocked', { detail: badge }));
        });
      }

      if (fetchAppData) {
        await fetchAppData();
      }
    } catch (err) {
      console.error('Failed to save quiz result', err);
    }

    setScore(correctCount);
    setIsFinished(true);
  };

  if (isFinished) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-12 border-b-8 border-primary"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-8"
          >
            <Trophy size={32} className="sm:hidden" />
            <Trophy size={48} className="hidden sm:block" />
          </motion.div>
          <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter mb-1 sm:mb-2">Session Complete</h1>
          <p className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-widest mb-6 sm:mb-8">
            Accuracy: {Math.round((score / questions.length) * 100)}%
          </p>
          
          <div className="text-5xl sm:text-7xl font-black text-primary mb-8 sm:mb-12 tabular-nums">
            {score}/{questions.length}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary w-full"
            >
              Finish
            </button>
            <button
              onClick={() => {
                setIsFinished(false);
                setCurrentQuestion(0);
                setSelectedAnswers([]);
              }}
              className="btn-secondary w-full"
            >
              Retry
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-main">No quiz questions available</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const questionText = question?.text || (question as any)?.question;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto animate-fade-in">
      <header className="mb-6 sm:mb-12 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-black uppercase text-text-muted tracking-[0.2em]">Step {currentQuestion + 1} / {questions.length}</span>
          <div className="w-32 sm:w-48 h-2 bg-surface-alt rounded-full mt-2 overflow-hidden ring-1 ring-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              className="h-full bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Clock size={16} className="animate-pulse" />
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest">Active Focus</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, scale: 0.98, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 1.02, x: -20 }}
          transition={{ duration: 0.3, ease: "anticipate" }}
          className="glass-card p-5 sm:p-12 relative"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles size={120} />
          </div>

          <h2 className="text-lg sm:text-2xl font-black mb-8 sm:mb-12 leading-tight relative z-10 tracking-tight">
            {questionText}
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {question.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestion] === idx;
              const isFeedback = feedback?.optionIdx === idx;
              const showCorrect = (isFeedback && feedback.isCorrect) || (isFeedback === false && feedback?.optionIdx !== undefined && idx === questions[currentQuestion].correctAnswer);
              const showWrong = isFeedback && !feedback.isCorrect;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={!!feedback || selectedAnswers[currentQuestion] !== undefined}
                  className={cn(
                    "w-full p-4 sm:p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group relative overflow-hidden",
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:border-border bg-surface-alt",
                    showCorrect && "border-accent bg-accent/10 correct-flash",
                    showWrong && "border-brand-pink bg-brand-pink/10 shake-wrong wrong-flash"
                  )}
                >
                  <span className={cn(
                    "text-xs sm:text-base font-bold transition-colors z-10",
                    isSelected || showCorrect ? "text-text-main" : "text-text-muted group-hover:text-text-main"
                  )}>
                    {option}
                  </span>
                  
                  <div className="flex items-center gap-2 z-10">
                    {showCorrect && <CheckCircle2 className="text-accent w-5 h-5 sm:w-6 sm:h-6" />}
                    {showWrong && <XCircle className="text-brand-pink w-5 h-5 sm:w-6 sm:h-6" />}
                    <div className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected || showCorrect ? "border-primary bg-primary" : "border-border group-hover:border-primary/50",
                      showCorrect && "border-accent bg-accent",
                      showWrong && "border-brand-pink bg-brand-pink"
                    )}>
                      {(isSelected || isFeedback) && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <footer className="mt-8 sm:mt-12 flex items-center justify-between">
        <button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          className="btn-secondary px-6"
        >
          Back
        </button>
        <button
          onClick={nextQuestion}
          disabled={selectedAnswers[currentQuestion] === undefined}
          className="btn-primary"
        >
          {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </footer>
      
      <StudyTimer title="Quiz Mode" />
    </div>
  );
}
