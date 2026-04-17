import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Trophy, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { StudyTimer } from '../components/StudyTimer';

export default function QuizInterface() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { materials } = useAppContext();
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<number[]>([]);
  const [isFinished, setIsFinished] = React.useState(false);
  const [score, setScore] = React.useState(0);

  const material = materials.find(m => m.id === id);
  const questions = material?.suggestedQuizQuestions || [];

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIdx;
    setSelectedAnswers(newAnswers);
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

  const finishQuiz = () => {
    let correct = 0;
    selectedAnswers.forEach((answer, idx) => {
      if (answer === questions[idx].correctAnswer) {
        correct++;
      }
    });
    setScore(correct);
    setIsFinished(true);
  };

  if (isFinished) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-6 sm:p-12"
        >
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-8">
            <Trophy size={32} className="sm:hidden" />
            <Trophy size={48} className="hidden sm:block" />
          </div>
          <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">Quiz Completed!</h1>
          <p className="text-[10px] sm:text-sm text-gray-600 mb-6 sm:mb-8">You scored {score} out of {questions.length}</p>
          
          <div className="text-4xl sm:text-6xl font-bold text-primary mb-8 sm:mb-12">
            {Math.round((score / questions.length) * 100)}%
          </div>

          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 sm:py-3 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setIsFinished(false);
                setCurrentQuestion(0);
                setSelectedAnswers([]);
              }}
              className="w-full py-2.5 sm:py-3 border border-border text-text-main text-xs sm:text-sm font-bold rounded-xl transition-all hover:bg-surface"
            >
              Retake Quiz
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-main">No quiz questions available for this material</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const questionText = question?.text || (question as any)?.question;

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <header className="mb-6 sm:mb-12 flex items-center justify-between">
        <div>
          <span className="text-[10px] sm:text-sm font-bold text-text-muted uppercase tracking-wider">Question {currentQuestion + 1} of {questions.length}</span>
          <div className="w-32 sm:w-48 h-1.5 sm:h-2 bg-white/10 rounded-full mt-1.5 sm:mt-2 overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-primary font-bold text-xs sm:text-base">
          <Clock size={16} className="sm:hidden" />
          <Clock size={20} className="hidden sm:block" />
          <span>Session Start</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-5 sm:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={120} />
          </div>

          <h2 className="text-lg sm:text-2xl font-bold mb-6 sm:mb-12 leading-relaxed relative z-10">
            {questionText}
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={cn(
                  "w-full p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                  selectedAnswers[currentQuestion] === idx
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-gray-100 hover:border-primary/30 hover:bg-gray-50"
                )}
              >
                <span className={cn(
                  "text-xs sm:text-base font-medium",
                  selectedAnswers[currentQuestion] === idx ? "text-primary" : "text-gray-600"
                )}>
                  {option}
                </span>
                <div className={cn(
                  "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  selectedAnswers[currentQuestion] === idx
                    ? "border-primary bg-primary"
                    : "border-gray-200 group-hover:border-primary/30"
                )}>
                  {selectedAnswers[currentQuestion] === idx && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <footer className="mt-6 sm:mt-12 flex items-center justify-between">
        <button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs sm:text-base"
        >
          <ChevronLeft size={16} className="sm:hidden" />
          <ChevronLeft size={20} className="hidden sm:block" /> Previous
        </button>
        <button
          onClick={nextQuestion}
          disabled={selectedAnswers[currentQuestion] === undefined}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-primary text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'} 
          <ChevronRight size={16} className="sm:hidden" />
          <ChevronRight size={20} className="hidden sm:block" />
        </button>
      </footer>
      
      <StudyTimer title="Quiz Session" />
    </div>
  );
}
