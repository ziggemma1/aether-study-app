import React from 'react';
import { StructuredStudyNote } from '../types';
import { motion } from 'framer-motion';
import { Lightbulb, Info, HelpCircle, CheckCircle2, List, Table as TableIcon, Target, BrainCircuit, Type } from 'lucide-react';
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

  const prepareMarkdown = (text: string, keywords: string[]) => {
    if (!keywords || keywords.length === 0) return text;
    
    let prepared = text;
    // Sort keywords by length descending to avoid partial matching issues
    const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
    
    sortedKeywords.forEach(keyword => {
      // Escape special regex characters
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Only match keywords not already wrapped in bold
      const regex = new RegExp(`(?<!\\*\\*)\\b(${escaped})\\b(?!\\*\\*)`, 'gi');
      prepared = prepared.replace(regex, '**$1**');
    });
    return prepared;
  };

  return (
    <div className="note-container font-sans rounded-3xl overflow-hidden shadow-2xl border border-white/5">
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 text-center bg-gradient-to-br from-surface to-background border-b border-white/10"
      >
        <h1 className="note-h1 m-0 leading-tight">
          {note.title}
        </h1>
        <p className="text-text-muted text-xs mt-4 uppercase tracking-[0.3em] font-bold opacity-60">Complete Academic synthesis</p>
      </motion.div>

      <div className="p-4 sm:p-8 space-y-12">
        {/* Learning Objectives */}
        <section className="study-card border-l-4 border-l-primary/50 bg-primary/5">
          <div className="flex items-center gap-2 mb-6 text-primary font-bold">
            <Target size={20} />
            <h2 className="text-lg uppercase tracking-wider m-0">Learning Objectives</h2>
          </div>
          <ul className="space-y-4">
            {note.learningObjectives.map((obj, i) => (
              <li key={i} className="flex gap-4 text-sm note-body">
                <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                <span className="leading-relaxed">{obj}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Key Terms */}
        <section>
          <div className="flex items-center gap-2 mb-8">
            <Info size={20} className="text-[#00D2FF]" />
            <h2 className="note-h2 m-0 p-0 border-0">Vault of Knowledge</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {note.keyTerms.map((term, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="study-card hover:border-primary/50 transition-all cursor-default group"
              >
                <h3 className="text-primary font-black text-xl mb-3 group-hover:text-[#00D2FF] transition-colors">{term.term}</h3>
                <div className="markdown-body text-sm leading-relaxed">
                  <ReactMarkdown>{term.definition}</ReactMarkdown>
                </div>
                {term.memoryTip && (
                  <div className="memory-tip mt-5 flex gap-3 items-start bg-[#00D2FF]/10 rounded-xl p-4">
                    <Lightbulb size={20} className="text-[#00D2FF] mt-0.5 shrink-0" />
                    <span className="text-xs font-medium italic opacity-90">{term.memoryTip}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Main Content Sections */}
        {note.sections.map((section, i) => (
          <section key={i} className="space-y-10">
            <header className="flex items-center gap-4">
              <span className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full text-primary font-black text-xs">{i+1}</span>
              <h2 className="note-h2 m-0 p-0 border-0">{section.heading}</h2>
            </header>
            
            <div className="space-y-12 pl-4 sm:pl-10 border-l border-white/5">
              {section.subsections.map((sub, j) => (
                <div key={j} className="relative">
                  {sub.subheading && <h3 className="note-h3 text-[#00D2FF] font-black tracking-tight mb-6">{sub.subheading}</h3>}
                  <div className="markdown-body text-base leading-loose p-0 sm:pr-8">
                    <ReactMarkdown>
                      {prepareMarkdown(sub.content, sub.keywords || [])}
                    </ReactMarkdown>
                  </div>
                  
                  {(sub.memoryTip || sub.quickCheck) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                      {sub.memoryTip && (
                        <div className="memory-tip m-0 bg-accent/5 border-l-accent shadow-sm">
                          <div className="flex items-center gap-2 text-accent font-black text-[10px] uppercase mb-2 tracking-[0.2em]">
                            <BrainCircuit size={14} />
                            <span>Neural Association</span>
                          </div>
                          <p className="text-xs italic opacity-90">{sub.memoryTip}</p>
                        </div>
                      )}

                      {sub.quickCheck && (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-sm">
                          <div className="flex items-center gap-2 text-text-muted text-[10px] font-black uppercase mb-3 tracking-[0.2em]">
                            <HelpCircle size={14} />
                            <span>Quick Assessment</span>
                          </div>
                          <p className="text-xs font-medium mb-0">{sub.quickCheck}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Comparison Table */}
        {note.comparisonTable && note.comparisonTable.rows.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-8">
              <TableIcon size={20} className="text-primary" />
              <h2 className="note-h2 m-0 p-0 border-0">{note.comparisonTable.title || 'Comparative Synthesis'}</h2>
            </div>
            <div className="note-table-wrapper border border-white/10 shadow-2xl rounded-2xl">
              <table className="note-table w-full">
                <thead>
                  <tr className="bg-primary/20 backdrop-blur-md">
                    {note.comparisonTable.headers.map((header, i) => (
                      <th key={i} className="p-4 text-left font-black uppercase tracking-widest text-[10px] py-6 border-b border-white/10">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {note.comparisonTable.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="p-4 py-5 text-sm font-medium border-b border-white/5">{cell}</td>
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
          <motion.section 
            whileHover={{ scale: 1.01 }}
            className="gradient-card bg-surface/30 p-10 text-center border border-white/10 shadow-xl"
          >
            <div className="flex items-center justify-center gap-3 text-primary font-black mb-6 uppercase tracking-[0.2em] text-xs">
              <Type size={20} />
              <h2 className="m-0">Cognitive Anchor</h2>
            </div>
            <p className="text-xl sm:text-2xl font-black italic text-text-main leading-tight tracking-tight">
              "{note.mnemonic}"
            </p>
          </motion.section>
        )}

        {/* Summary */}
        <section>
          <div className="flex items-center gap-2 mb-8">
            <List size={20} className="text-primary" />
            <h2 className="note-h2 m-0 p-0 border-0">High-Impact Takeaways</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {note.summary.map((point, i) => (
              <div key={i} className="study-card bg-surface/50 border-white/10 flex items-start gap-4 p-5">
                <span className="w-6 h-6 shrink-0 flex items-center justify-center bg-primary rounded-lg text-white font-black text-[10px]">{i+1}</span>
                <p className="text-sm font-medium leading-relaxed m-0">{point}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Active Recall */}
        <section className="study-card border-t-4 border-t-accent/50 bg-accent/5 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-10 text-accent font-black uppercase tracking-[0.3em] text-sm">
            <BrainCircuit size={24} />
            <h2 className="m-0">Active Recall Pro</h2>
          </div>
          <div className="space-y-8">
            {note.activeRecallQuestions.map((q, i) => (
              <div key={i} className="relative group">
                <p className="text-lg font-bold leading-snug mb-4 group-hover:text-accent transition-colors">{q}</p>
                <button 
                  onClick={() => toggleAnswer(i)}
                  className={cn(
                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                    revealedAnswers.includes(i) 
                      ? "bg-accent text-white shadow-lg shadow-accent/20" 
                      : "bg-surface border border-accent/30 text-accent hover:bg-accent/10"
                  )}
                >
                  {revealedAnswers.includes(i) ? 'Hide Reflection' : 'Show Reflection Strategy'}
                </button>
                {revealedAnswers.includes(i) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="reveal-answer bg-accent/20 border-accent/40 mt-4 p-6"
                  >
                    <div className="flex items-center gap-2 text-[#00E5A0] font-black text-xs uppercase mb-3 tracking-[0.2em]">
                      <Info size={16} />
                      <span>Meta-Cognition Boost</span>
                    </div>
                    <p className="text-sm leading-relaxed font-medium italic">
                      Explain this concept using a real-world analogy. If you can't, re-read the "Vault of Knowledge" section above.
                    </p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Related Topics */}
        {note.relatedTopics && note.relatedTopics.length > 0 && (
          <section className="pt-12 text-center">
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent m-0 mb-8"></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 opacity-40">Expansion Pathways</h4>
            <div className="flex flex-wrap justify-center gap-3">
              {note.relatedTopics.map((topic, i) => (
                <span key={i} className="px-5 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-black hover:bg-primary/20 hover:border-primary/40 transition-all cursor-pointer">
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
