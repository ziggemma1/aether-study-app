import React from 'react';
import { StructuredStudyNote } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  Info, 
  HelpCircle, 
  CheckCircle2, 
  List, 
  Table as TableIcon, 
  Target, 
  BrainCircuit, 
  BookOpen,
  Calendar,
  Sparkles,
  Palette,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Props {
  note: StructuredStudyNote;
}

export const StructuredNoteRenderer: React.FC<Props> = ({ note }) => {
  const [revealedAnswers, setRevealedAnswers] = React.useState<number[]>([]);

  const toggleAnswer = (index: number) => {
    if (revealedAnswers.includes(index)) {
      setRevealedAnswers(revealedAnswers.filter(i => i !== index));
    } else {
      setRevealedAnswers([...revealedAnswers, index]);
    }
  };

  // Helper to highlight key terms dynamically
  const prepareMarkdown = (text: string, keywords: string[] = []) => {
    if (!keywords || keywords.length === 0) return text;
    
    let prepared = text;
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    
    sortedKeywords.forEach(keyword => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
      
      prepared = prepared.replace(regex, (match, p1, offset) => {
        const before = prepared.substring(Math.max(0, offset - 2), offset);
        const after = prepared.substring(offset + match.length, offset + match.length + 2);
        if (before === '**' && after === '**') return match;
        return `**${match}**`;
      });
    });
    return prepared;
  };

  return (
    <div className="note-container font-sans rounded-3xl overflow-hidden shadow-[var(--shadow-card-hover)] border border-border/10 bg-surface/30">
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 text-center bg-gradient-to-br from-surface to-surface-alt border-b border-border/10"
      >
        <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full inline-block mb-3">
          🎓 Cognitive Study Pack
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-text-main leading-tight tracking-tight m-0">
          {note.title}
        </h1>
      </motion.div>

      <div className="p-4 sm:p-6 space-y-10">
        
        {/* 1. Prerequisites (Knowledge Activation) */}
        {note.prerequisites && note.prerequisites.length > 0 && (
          <section className="study-card border-l-4 border-l-secondary bg-secondary/5 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 text-secondary font-extrabold text-sm uppercase tracking-wider">
              <BookOpen size={18} />
              <span>📚 Before You Begin</span>
            </div>
            <ul className="space-y-2">
              {note.prerequisites.map((prereq, i) => (
                <li key={i} className="text-xs text-text-muted leading-relaxed flex items-start gap-2">
                  <span className="text-secondary shrink-0">•</span>
                  <span>{prereq}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 2. Executive Summary */}
        {note.executiveSummary && (
          <section className="study-card border-l-4 border-l-primary bg-primary/5 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 text-primary font-extrabold text-sm uppercase tracking-wider">
              <List size={18} />
              <span>📋 Executive Summary</span>
            </div>
            <p className="text-xs text-text-main leading-relaxed italic m-0">
              "{note.executiveSummary}"
            </p>
          </section>
        )}

        {/* 3. Learning Objectives */}
        <section className="study-card border-l-4 border-l-accent/80 bg-accent/5 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4 text-accent font-extrabold text-sm uppercase tracking-wider">
            <Target size={18} />
            <span>🎯 Learning Objectives</span>
          </div>
          {note.learningObjectives && note.learningObjectives.length > 0 ? (
            <ul className="space-y-3">
              {note.learningObjectives.map((obj, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-text-main">
                  <CheckCircle2 size={16} className="text-accent mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{obj}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-muted italic">No specific learning objectives.</p>
          )}
        </section>

        {/* 4. Vault of Knowledge / Key Terms */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-extrabold text-sm uppercase tracking-wider border-b border-border/10 pb-2">
            <Info size={18} />
            <span>🔑 Key Terminology</span>
          </div>
          {note.keyTerms && note.keyTerms.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {note.keyTerms.map((term, i) => (
                <div key={i} className="p-4 bg-surface border border-border/10 rounded-2xl">
                  <h3 className="text-primary font-black text-sm mb-1">{term.term}</h3>
                  <p className="text-xs text-text-main leading-relaxed m-0">{term.definition}</p>
                  {term.memoryTip && (
                    <div className="mt-2.5 flex gap-2 items-start bg-secondary/10 text-secondary rounded-xl p-2.5 text-[11px] italic">
                      <Lightbulb size={14} className="shrink-0 mt-0.5" />
                      <span>{term.memoryTip}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">No key terms defined.</p>
          )}
        </section>

        {/* 5. Core Concepts (New Structure) */}
        {note.keyConcepts && note.keyConcepts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm uppercase tracking-wider border-b border-border/10 pb-2">
              <Sparkles size={18} />
              <span>📖 Core Concepts</span>
            </div>
            <div className="space-y-4">
              {note.keyConcepts.map((concept, i) => (
                <div key={i} className="p-4 sm:p-5 bg-surface-alt border border-border/15 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-primary/10 rounded-full text-primary font-black text-[11px]">
                      {i + 1}
                    </span>
                    <h3 className="text-sm font-extrabold text-text-main m-0">{concept.name}</h3>
                  </div>

                  {/* Definition */}
                  <div className="text-xs text-text-main leading-relaxed bg-surface/50 p-3 rounded-xl border border-border/5">
                    <span className="font-bold text-primary block mb-1 text-[11px] uppercase tracking-wider">Definition</span>
                    {concept.definition}
                  </div>

                  {/* Key Points */}
                  {concept.keyPoints && concept.keyPoints.length > 0 && (
                    <div className="space-y-1">
                      <span className="font-bold text-text-muted block text-[11px] uppercase tracking-wider">Key Details</span>
                      <ul className="space-y-1 pl-1">
                        {concept.keyPoints.map((kp, j) => (
                          <li key={j} className="text-xs text-text-main leading-relaxed flex items-start gap-2">
                            <span className="text-primary mt-0.5 shrink-0">•</span>
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Example & Memory Tip Grid */}
                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {concept.example && (
                      <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl">
                        <span className="font-bold text-accent block text-[11px] uppercase tracking-wider mb-1">💡 Real-World Example</span>
                        <p className="text-xs text-text-main leading-relaxed m-0 italic">
                          "{concept.example}"
                        </p>
                      </div>
                    )}

                    {concept.memoryTip && (
                      <div className="p-3 bg-brand-orange/5 border border-brand-orange/10 rounded-xl">
                        <span className="font-bold text-brand-orange block text-[11px] uppercase tracking-wider mb-1">🔑 Memory Cue</span>
                        <p className="text-xs text-text-main leading-relaxed m-0">
                          {concept.memoryTip}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Detailed Insights / Deep-Dive */}
                  {concept.deepDive && (
                    <div className="p-3.5 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                      <span className="font-extrabold text-primary flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <Sparkles size={12} /> Detailed Insights & Deep-Dive
                      </span>
                      <div className="text-xs text-text-muted leading-relaxed markdown-body">
                        <ReactMarkdown>{concept.deepDive}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Legacy Sections Fallback (Only shown if keyConcepts missing) */}
        {(!note.keyConcepts || note.keyConcepts.length === 0) && note.sections && note.sections.length > 0 && (
          <section className="space-y-6">
            {note.sections.map((section, i) => (
              <div key={i} className="space-y-4">
                <header className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center bg-primary/10 rounded-full text-primary font-black text-xs">{i+1}</span>
                  <h2 className="text-sm font-extrabold text-text-main m-0">{section.heading}</h2>
                </header>
                
                <div className="space-y-4 pl-3 border-l border-border/10">
                  {section.subsections.map((sub, j) => (
                    <div key={j} className="p-3.5 bg-surface border border-border/5 rounded-xl space-y-2">
                      {sub.subheading && <h3 className="text-xs font-bold text-primary m-0">{sub.subheading}</h3>}
                      <div className="text-xs text-text-main leading-relaxed">
                        <ReactMarkdown>
                          {prepareMarkdown(sub.content, sub.keywords || [])}
                        </ReactMarkdown>
                      </div>
                      
                      {(sub.memoryTip || sub.quickCheck) && (
                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/5">
                          {sub.memoryTip && (
                            <p className="text-[11px] text-accent leading-relaxed italic m-0">
                              💡 {sub.memoryTip}
                            </p>
                          )}
                          {sub.quickCheck && (
                            <p className="text-[11px] text-text-muted leading-relaxed m-0 bg-surface-alt p-2 rounded-lg">
                              ❓ Quick Check: {sub.quickCheck}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 6. Comparison Table */}
        {note.comparisonTable && note.comparisonTable.rows.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm uppercase tracking-wider border-b border-border/10 pb-2">
              <TableIcon size={18} />
              <span>📊 Comparison Table</span>
            </div>
            <div className="overflow-x-auto border border-border/10 rounded-2xl bg-surface/50 shadow-md">
              <table className="w-full text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="bg-primary/10 border-b border-border/10">
                    {note.comparisonTable.headers.map((header, i) => (
                      <th key={i} className="p-3 text-[11px] font-black uppercase tracking-wider text-text-main">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {note.comparisonTable.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/5 hover:bg-surface-alt transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="p-3 text-xs text-text-muted font-medium">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 7. Visual Prompts (Dual Coding) */}
        {note.visualPrompts && note.visualPrompts.length > 0 && (
          <section className="study-card border-l-4 border-l-violet-500 bg-primary/5 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 text-primary font-extrabold text-sm uppercase tracking-wider">
              <Palette size={18} />
              <span>🎨 Sketch This (Visual Coding)</span>
            </div>
            <p className="text-[11px] text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-full inline-block mb-3 leading-normal">
              💡 Tip: Combining words and sketches improves retention by 65%.
            </p>
            <ul className="space-y-2">
              {note.visualPrompts.map((prompt, i) => (
                <li key={i} className="text-xs text-text-main leading-relaxed flex items-start gap-2">
                  <span className="text-primary shrink-0">✔</span>
                  <span>{prompt}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 8. Key Takeaways */}
        {note.summary && note.summary.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm uppercase tracking-wider border-b border-border/10 pb-2">
              <List size={18} />
              <span>💡 Key Takeaways</span>
            </div>
            <div className="space-y-2">
              {note.summary.map((point, i) => (
                <div key={i} className="study-card bg-surface/50 border border-border/5 rounded-xl flex items-start gap-3 p-3">
                  <span className="w-5 h-5 shrink-0 flex items-center justify-center bg-primary rounded-lg text-white font-black text-[11px]">
                    {i + 1}
                  </span>
                  <p className="text-xs text-text-muted font-semibold leading-relaxed m-0">{point}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9. Mnemonic / Memory Peg */}
        {note.mnemonic && (
          <section className="bg-surface border border-border/15 p-6 text-center rounded-2xl shadow-inner relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 text-accent font-extrabold text-[11px] uppercase tracking-wider mb-2">
              <BrainCircuit size={16} />
              <span>🧠 Memory Peg</span>
            </div>
            <p className="text-base font-black italic text-text-main leading-tight tracking-tight m-0">
              "{note.mnemonic}"
            </p>
          </section>
        )}

        {/* 10. Active Recall (Touch target min 44px) */}
        <section className="study-card border-t-4 border-t-accent/50 bg-accent/5 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-accent font-extrabold text-sm uppercase tracking-wider">
            <BrainCircuit size={18} />
            <span>🧠 Active Recall Questions</span>
          </div>
          <div className="space-y-4">
            {note.activeRecallQuestions.map((q, i) => (
              <div key={i} className="border-b border-border/5 pb-3 last:border-b-0 space-y-2">
                <p className="text-xs font-bold text-text-main leading-relaxed m-0">{q}</p>
                <button 
                  onClick={() => toggleAnswer(i)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all min-h-[44px]",
                    revealedAnswers.includes(i) 
                      ? "bg-accent text-white shadow-md shadow-accent/25" 
                      : "bg-surface border border-accent/20 text-accent hover:bg-accent/5"
                  )}
                >
                  {revealedAnswers.includes(i) ? 'Hide Reflection' : 'Show Reflection Strategy'}
                </button>
                {revealedAnswers.includes(i) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-accent/10 border border-accent/20 rounded-xl p-3 mt-1.5 text-xs text-text-muted font-medium italic leading-relaxed"
                  >
                    <div className="flex items-center gap-1.5 text-accent font-bold text-[11px] uppercase tracking-wider mb-1">
                      <span>Meta-Cognition Cue</span>
                    </div>
                    Explain this from first principles. Use a simple metaphor, or refer back to the "Core Concepts" tab.
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 11. Application Questions (Critical Thinking) */}
        {note.applicationQuestions && note.applicationQuestions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm uppercase tracking-wider border-b border-border/10 pb-2">
              <HelpCircle size={18} />
              <span>🔍 Apply Your Knowledge</span>
            </div>
            <div className="space-y-2.5">
              {note.applicationQuestions.map((q, i) => (
                <div key={i} className="p-3 bg-surface border border-border/5 rounded-xl text-xs text-text-main leading-relaxed flex items-start gap-2.5">
                  <span className="font-black text-primary text-[11px] bg-primary/10 w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                    ?
                  </span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 12. Next Steps (Interleaving) */}
        {note.nextSteps && note.nextSteps.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm uppercase tracking-wider border-b border-border/10 pb-2">
              <ArrowRight size={18} />
              <span>🚀 Next Steps (Interleaved Study)</span>
            </div>
            <p className="text-[11px] text-text-muted font-medium italic m-0">
              💡 Why: Switching between related topics strengthens conceptual connections.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {note.nextSteps.map((step, i) => (
                <span 
                  key={i} 
                  className="px-3.5 py-2 bg-surface border border-border/10 rounded-xl text-[11px] font-bold text-text-muted hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ArrowRight size={12} className="text-primary shrink-0" />
                  {step}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 13. Study Schedule (Spaced Repetition) */}
        {note.studySchedule && Object.keys(note.studySchedule).length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm uppercase tracking-wider border-b border-border/10 pb-2">
              <Calendar size={18} />
              <span>📅 Spaced Repetition Schedule</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(note.studySchedule).map(([time, action], i) => (
                <div key={i} className="p-3 bg-surface border border-border/5 rounded-xl space-y-1 text-center">
                  <span className="font-black text-primary block text-[11px] uppercase tracking-wider">{time}</span>
                  <p className="text-[11px] text-text-muted leading-relaxed m-0 font-medium">
                    {action}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
