import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_QUIZ_QUESTIONS } from '../mockData';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

export default function QuizInterface() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<number[]>([]);
  const [isFinished, setIsFinished] = React.useState(false);
  const [score, setScore] = React.useState(0);

  const questions = MOCK_QUIZ_QUESTIONS;

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
      <div className="p-4 md:p-8 lg:p-12 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12"
        >
          <div className="w-24 h-24 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-8">
            <Trophy size={48} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
          <p className="text-gray-600 mb-8">You scored {score} out of {questions.length}</p>
          
          <div className="text-6xl font-bold text-primary mb-12">
            {Math.round((score / questions.length) * 100)}%
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full btn-primary"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setIsFinished(false);
                setCurrentQuestion(0);
                setSelectedAnswers([]);
              }}
              className="w-full btn-outline"
            >
              Retake Quiz
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-3xl mx-auto">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question {currentQuestion + 1} of {questions.length}</span>
          <div className="w-48 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-primary font-bold">
          <Clock size={20} />
          <span>14:59</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-8 md:p-12"
        >
          <h2 className="text-2xl font-bold mb-12 leading-relaxed">
            {question.text}
          </h2>

          <div className="space-y-4">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={cn(
                  "w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group",
                  selectedAnswers[currentQuestion] === idx
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-gray-100 hover:border-primary/30 hover:bg-gray-50"
                )}
              >
                <span className={cn(
                  "font-medium",
                  selectedAnswers[currentQuestion] === idx ? "text-primary" : "text-gray-600"
                )}>
                  {option}
                </span>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                  selectedAnswers[currentQuestion] === idx
                    ? "border-primary bg-primary"
                    : "border-gray-200 group-hover:border-primary/30"
                )}>
                  {selectedAnswers[currentQuestion] === idx && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <footer className="mt-12 flex items-center justify-between">
        <button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 text-gray-500 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed font-bold"
        >
          <ChevronLeft size={20} /> Previous
        </button>
        <button
          onClick={nextQuestion}
          disabled={selectedAnswers[currentQuestion] === undefined}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'} <ChevronRight size={20} />
        </button>
      </footer>
    </div>
  );
}
