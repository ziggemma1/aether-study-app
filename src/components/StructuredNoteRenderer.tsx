import React from 'react';
import { StructuredStudyNote, KeyTerm, Subsection, NoteSectionGroup } from '../types';
import { motion } from 'framer-motion';
import { Lightbulb, Info, HelpCircle, CheckCircle2, List, Table as TableIcon, Target, BrainCircuit, Type } from 'lucide-react';

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

  const highlightKeywords = (text: string, keywords: string[]) => {
    if (!keywords || keywords.length === 0) return text;
    
    let parts = [text];
    keywords.forEach(keyword => {
      const newParts: string[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        
        const regex = new RegExp(`(${keyword})`, 'gi');
        const split = part.split(regex);
        newParts.push(...split);
      });
      parts = newParts;
    });

    return parts.map((part, i) => {
      const isKeyword = keywords.some(k => k.toLowerCase() === part.toLowerCase());
      return isKeyword ? (
        <span key={i} className="keyword">{part}</span>
      ) : (
        part
      );
    });
  };

  return (
    <div className="note-container font-sans">
      {/* Title */}
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="note-h1"
      >
        {note.title}
      </motion.h1>

      {/* Learning Objectives */}
      <section className="study-card border-l-4 border-l-primary/50">
        <div className="flex items-center gap-2 mb-3 text-primary font-bold">
          <Target size={20} />
          <h2 className="text-lg uppercase tracking-wider">Learning Objectives</h2>
        </div>
        <ul className="space-y-2">
          {note.learningObjectives.map((obj, i) => (
            <li key={i} className="flex gap-3 text-sm note-body">
              <CheckCircle2 size={16} className="text-primary mt-1 shrink-0" />
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Key Terms */}
      <section className="my-8">
        <h2 className="note-h2">Key Terminology</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {note.keyTerms.map((term, i) => (
            <div key={i} className="study-card hover:border-primary/30 transition-all">
              <h3 className="text-primary font-bold text-lg mb-1">{term.term}</h3>
              <p className="note-body text-sm">{term.definition}</p>
              {term.memoryTip && (
                <div className="memory-tip mt-3 flex gap-2 items-start">
                  <Lightbulb size={16} className="text-[#00D2FF] mt-0.5 shrink-0" />
                  <span className="text-xs">{term.memoryTip}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Main Content Sections */}
      {note.sections.map((section, i) => (
        <section key={i} className="my-10">
          <h2 className="note-h2">{section.heading}</h2>
          <div className="space-y-8">
            {section.subsections.map((sub, j) => (
              <div key={j} className="relative">
                {sub.subheading && <h3 className="note-h3">{sub.subheading}</h3>}
                <div className="note-body pl-2 md:pl-4">
                  {highlightKeywords(sub.content, sub.keywords)}
                </div>
                
                {sub.memoryTip && (
                  <div className="memory-tip ml-4 md:ml-8">
                    <div className="flex items-center gap-2 text-[#00D2FF] font-bold text-xs uppercase mb-1">
                      <BrainCircuit size={14} />
                      <span>Memory Hack</span>
                    </div>
                    {sub.memoryTip}
                  </div>
                )}

                {sub.quickCheck && (
                  <div className="mt-4 ml-4 md:ml-8 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 text-text-muted text-xs font-bold mb-2">
                      <HelpCircle size={14} />
                      <span>Quick Check</span>
                    </div>
                    <p className="text-sm italic mb-2">{sub.quickCheck}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Comparison Table */}
      {note.comparisonTable && (
        <section className="my-10">
          <h2 className="note-h2">{note.comparisonTable.title || 'Comparison Overview'}</h2>
          <div className="note-table-wrapper gradient-card">
            <table className="note-table">
              <thead>
                <tr>
                  {note.comparisonTable.headers.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {note.comparisonTable.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Mnemonic */}
      {note.mnemonic && (
        <section className="my-8 gradient-card text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-bold mb-2">
            <Type size={20} />
            <h2 className="text-lg">Mnemonic / memory Device</h2>
          </div>
          <p className="note-body text-lg italic border-t border-white/5 pt-4">
            "{note.mnemonic}"
          </p>
        </section>
      )}

      {/* Summary */}
      <section className="my-10">
        <h2 className="note-h2">Key Takeaways</h2>
        <div className="summary-grid">
          {note.summary.map((point, i) => (
            <div key={i} className="summary-card">
              <p className="text-sm">{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Recall */}
      <section className="my-10 study-card border-t-4 border-t-accent/50">
        <div className="flex items-center gap-2 mb-6 text-accent font-bold">
          <BrainCircuit size={20} />
          <h2 className="text-lg uppercase tracking-wider">Active Recall Questions</h2>
        </div>
        <div className="space-y-6">
          {note.activeRecallQuestions.map((q, i) => (
            <div key={i} className="relative pl-4 border-l border-white/10">
              <p className="note-body font-medium">{q}</p>
              <button 
                onClick={() => toggleAnswer(i)}
                className="reveal-btn mt-2"
              >
                {revealedAnswers.includes(i) ? 'Hide Reflection' : 'Show Reflection Tip'}
              </button>
              {revealedAnswers.includes(i) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="reveal-answer text-sm mt-3"
                >
                  <div className="flex items-center gap-2 text-[#00E5A0] font-bold text-xs uppercase mb-2">
                    <Info size={14} />
                    <span>Reflection Tip</span>
                  </div>
                  Try to explain this concept in 2 sentences to someone who has never heard it before. Focus on the "why" and "how".
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Related Topics */}
      {note.relatedTopics && note.relatedTopics.length > 0 && (
        <section className="mt-12 text-center opacity-60">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4">Jump into Related Concepts</h4>
          <div className="flex flex-wrap justify-center gap-2">
            {note.relatedTopics.map((topic, i) => (
              <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold">
                {topic}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
