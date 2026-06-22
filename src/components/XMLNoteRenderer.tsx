import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, BookOpen, GraduationCap, CheckCircle2, AlertCircle, HelpCircle, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface Props {
  detailedNotes: string;
}

interface ConceptItem {
  term: string;
  definition: string;
  connectsTo: string;
}

interface WorkedExample {
  problem: string;
  approach: string;
  solution: string;
  result: string;
}

interface PracticeProblem {
  title: string;
  problem: string;
  hint: string;
}

export const XMLNoteRenderer: React.FC<Props> = ({ detailedNotes }) => {
  const [activeTab, setActiveTab] = React.useState<'eli5' | 'concepts' | 'deep' | 'examples' | 'summary'>('eli5');
  const [revealedHints, setRevealedHints] = React.useState<Record<number, boolean>>({});

  // 1. Parsing Helper
  const eli5Match = detailedNotes.match(/<eli5>([\s\S]*?)<\/eli5>/i);
  const conceptsMatch = detailedNotes.match(/<concepts>([\s\S]*?)<\/concepts>/i);
  const deepMatch = detailedNotes.match(/<deep>([\s\S]*?)<\/deep>/i);
  const examplesMatch = detailedNotes.match(/<examples>([\s\S]*?)<\/examples>/i);
  const summaryMatch = detailedNotes.match(/<summary>([\s\S]*?)<\/summary>/i);

  const rawEli5 = eli5Match ? eli5Match[1].trim() : "";
  const rawConcepts = conceptsMatch ? conceptsMatch[1].trim() : "";
  const rawDeep = deepMatch ? deepMatch[1].trim() : "";
  const rawExamples = examplesMatch ? examplesMatch[1].trim() : "";
  const rawSummary = summaryMatch ? summaryMatch[1].trim() : "";

  // Parse Sub-structures
  // Concepts
  const parseConceptsList = (text: string): ConceptItem[] => {
    if (!text) return [];
    const blocks = text.split(/\n\s*\n+/);
    const list: ConceptItem[] = [];
    blocks.forEach(block => {
      const termMatch = block.match(/TERM:\s*\[?([^\]\n]+)\]?/i) || block.match(/TERM:\s*(.+)/i);
      const defMatch = block.match(/DEFINITION:\s*\[?([^\]\n]+)\]?/i) || block.match(/DEFINITION:\s*(.+)/i);
      const connMatch = block.match(/CONNECTS TO:\s*\[?([^\]\n]+)\]?/i) || block.match(/CONNECTS TO:\s*(.+)/i);
      
      if (termMatch && defMatch) {
        list.push({
          term: termMatch[1].trim(),
          definition: defMatch[1].trim(),
          connectsTo: connMatch ? connMatch[1].trim() : ""
        });
      }
    });
    return list;
  };
  const conceptsList = parseConceptsList(rawConcepts);

  // Examples
  const parseExamples = (text: string) => {
    const probMatch = text.match(/PROBLEM:\s*([\s\S]+?)(?=APPROACH:|SOLUTION:|RESULT:|PRACTICE|$)/i);
    const appMatch = text.match(/APPROACH:\s*([\s\S]+?)(?=PROBLEM:|SOLUTION:|RESULT:|PRACTICE|$)/i);
    const solMatch = text.match(/SOLUTION:\s*([\s\S]+?)(?=PROBLEM:|APPROACH:|RESULT:|PRACTICE|$)/i);
    const resMatch = text.match(/RESULT:\s*([\s\S]+?)(?=PROBLEM:|APPROACH:|SOLUTION:|PRACTICE|$)/i);

    const worked: WorkedExample = {
      problem: probMatch ? probMatch[1].trim() : "",
      approach: appMatch ? appMatch[1].trim() : "",
      solution: solMatch ? solMatch[1].trim() : "",
      result: resMatch ? resMatch[1].trim() : ""
    };

    const practices: PracticeProblem[] = [];
    const p1Match = text.match(/PRACTICE\s*1(?:\s*\(stretch\))?:\s*([\s\S]+?)(?=HINT|PRACTICE\s*2|$)/i);
    const h1Match = text.match(/PRACTICE\s*1(?:\s*\(stretch\))?[\s\S]+?HINT(?:\s*1)?:\s*([\s\S]+?)(?=PRACTICE\s*2|$)/i) 
                    || text.match(/HINT(?:\s*1)?:\s*([\s\S]+?)(?=PRACTICE\s*2|$)/i);

    if (p1Match) {
      practices.push({
        title: "Practice 1",
        problem: p1Match[1].trim(),
        hint: h1Match ? h1Match[1].trim() : ""
      });
    }

    const p2Match = text.match(/PRACTICE\s*2(?:\s*\(stretch\))?:\s*([\s\S]+?)(?=HINT|$)/i);
    const h2Match = text.match(/PRACTICE\s*2(?:\s*\(stretch\))?[\s\S]+?HINT(?:\s*2)?:\s*([\s\S]+?)(?=$)/i)
                    || (p2Match ? text.substring(text.indexOf(p2Match[0])).match(/HINT(?:\s*2)?:\s*([\s\S]+?)(?=$)/i) : null);

    if (p2Match) {
      practices.push({
        title: "Practice 2 (Stretch)",
        problem: p2Match[1].trim(),
        hint: h2Match ? h2Match[1].trim() : ""
      });
    }

    return { worked, practices };
  };
  const examplesData = parseExamples(rawExamples);

  // Summary
  const parseSummary = (text: string) => {
    const watchOutMatch = text.match(/WATCH OUT:\s*([\s\S]+)$/i);
    const watchOut = watchOutMatch ? watchOutMatch[1].trim() : "";
    const mainContent = watchOutMatch ? text.substring(0, watchOutMatch.index).trim() : text;
    
    const takeaways = mainContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 5)
      .map(line => line.replace(/^[-*•\d.]+\s*/, ''));

    return { takeaways, watchOut };
  };
  const summaryData = parseSummary(rawSummary);

  const toggleHint = (index: number) => {
    setRevealedHints(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Tab Setup
  const tabs = [
    { id: 'eli5', label: 'ELI5', icon: Sparkles, color: 'text-blue-500 border-blue-500 bg-blue-500/10' },
    { id: 'concepts', label: 'Terms', icon: BookOpen, color: 'text-purple-500 border-purple-500 bg-purple-500/10' },
    { id: 'deep', label: 'Deep', icon: Brain, color: 'text-teal-500 border-teal-500 bg-teal-500/10' },
    { id: 'examples', label: 'Practice', icon: GraduationCap, color: 'text-amber-500 border-amber-500 bg-amber-500/10' },
    { id: 'summary', label: 'Review', icon: CheckCircle2, color: 'text-emerald-500 border-emerald-500 bg-emerald-500/10' }
  ] as const;

  return (
    <div className="w-full flex flex-col font-sans select-none overflow-x-hidden">
      {/* 2. Horizontal Scrollable Pill Tab Switcher (Touch Target min-h-[48px]) */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-3 px-1 custom-scrollbar snap-x snap-mandatory shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-grow flex items-center justify-center gap-1.5 px-4 py-3 rounded-full text-xs font-bold transition-all border shrink-0 snap-center min-h-[48px] min-w-[90px] shadow-sm select-none",
                isActive 
                  ? tab.color
                  : "bg-surface border-border text-text-muted hover:border-primary/20 hover:text-text-main"
              )}
            >
              <Icon size={14} className="shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Render Card Content (Animates in) */}
      <div className="w-full relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === 'eli5' && (
            <motion.div
              key="eli5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-5 sm:p-7 border-l-[6px] border-l-blue-500 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl space-y-4 border border-border/10 shadow-lg"
            >
              <div className="flex items-center gap-2 text-blue-500 font-extrabold text-[10px] uppercase tracking-wider">
                <Sparkles size={14} />
                <span>ELI5 • Accessible Analogy</span>
              </div>
              
              <div className="text-text-main text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none space-y-3">
                {rawEli5 ? (
                  <ReactMarkdown>{rawEli5}</ReactMarkdown>
                ) : (
                  <p className="italic text-text-muted">No analogy details available.</p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'concepts' && (
            <motion.div
              key="concepts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-5 sm:p-7 border-l-[6px] border-l-purple-500 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl space-y-4 border border-border/10 shadow-lg"
            >
              <div className="flex items-center gap-2 text-purple-500 font-extrabold text-[10px] uppercase tracking-wider">
                <BookOpen size={14} />
                <span>Vocabulary & Connected Core Ideas</span>
              </div>

              {conceptsList.length > 0 ? (
                <div className="grid grid-cols-1 gap-3.5 pt-1">
                  {conceptsList.map((item, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-surface/40 border border-purple-500/10 rounded-2xl space-y-2 hover:border-purple-500/20 transition-all"
                    >
                      <h4 className="text-purple-400 font-black text-sm">{item.term}</h4>
                      <p className="text-text-main text-xs leading-relaxed">{item.definition}</p>
                      {item.connectsTo && (
                        <div className="flex gap-1.5 items-start bg-purple-500/10 text-purple-300 rounded-xl p-2.5 text-[10px] font-medium leading-normal">
                          <Brain size={12} className="shrink-0 mt-0.5" />
                          <span><strong>Links with:</strong> {item.connectsTo}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-text-main text-xs leading-relaxed">
                  <ReactMarkdown>{rawConcepts || "No core vocabulary defined."}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'deep' && (
            <motion.div
              key="deep"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-5 sm:p-7 border-l-[6px] border-l-teal-500 bg-gradient-to-br from-teal-500/5 to-transparent rounded-3xl space-y-4 border border-border/10 shadow-lg"
            >
              <div className="flex items-center gap-2 text-teal-500 font-extrabold text-[10px] uppercase tracking-wider">
                <Brain size={14} />
                <span>Rigorous Concept Deconstruction</span>
              </div>

              <div className="text-text-main text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none space-y-3">
                {rawDeep ? (
                  <ReactMarkdown>{rawDeep}</ReactMarkdown>
                ) : (
                  <p className="italic text-text-muted">No deep deconstruction details available.</p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'examples' && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-5 sm:p-7 border-l-[6px] border-l-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent rounded-3xl space-y-5 border border-border/10 shadow-lg"
            >
              <div className="flex items-center gap-2 text-amber-500 font-extrabold text-[10px] uppercase tracking-wider">
                <GraduationCap size={14} />
                <span>Worked Example & Exercises</span>
              </div>

              {examplesData.worked.problem ? (
                <div className="space-y-4">
                  {/* Worked Example */}
                  <div className="p-4 bg-surface/50 border border-amber-500/10 rounded-2xl space-y-3">
                    <span className="font-extrabold text-amber-500 text-[10px] uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full">Worked Example</span>
                    <div className="space-y-2">
                      <p className="text-xs font-black text-text-main leading-relaxed">PROBLEM: {examplesData.worked.problem}</p>
                      {examplesData.worked.approach && (
                        <p className="text-[11px] text-text-muted italic"><strong>Approach:</strong> {examplesData.worked.approach}</p>
                      )}
                      {examplesData.worked.solution && (
                        <div className="text-[11px] text-text-main leading-relaxed bg-surface/30 p-3 rounded-xl border border-border/5 space-y-1">
                          <span className="font-bold text-amber-500 block text-[9px] uppercase tracking-wider mb-1">Step-by-Step Solution</span>
                          <ReactMarkdown>{examplesData.worked.solution}</ReactMarkdown>
                        </div>
                      )}
                      {examplesData.worked.result && (
                        <div className="p-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-bold">
                          🎯 Result: {examplesData.worked.result}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Practice Problems */}
                  {examplesData.practices.length > 0 && (
                    <div className="space-y-3">
                      <span className="font-bold text-text-muted text-[10px] uppercase tracking-wider block">Active Practice Problems</span>
                      {examplesData.practices.map((practice, index) => (
                        <div key={index} className="p-4 bg-surface/30 border border-border/5 rounded-2xl space-y-3">
                          <h4 className="text-xs font-bold text-text-main flex items-center justify-between">
                            <span>{practice.title}</span>
                            <span className="text-[9px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-bold">Challenge</span>
                          </h4>
                          <p className="text-xs text-text-muted leading-relaxed">{practice.problem}</p>
                          
                          {practice.hint && (
                            <div className="space-y-2 pt-1">
                              <button
                                onClick={() => toggleHint(index)}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all min-h-[44px]",
                                  revealedHints[index] 
                                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/25" 
                                    : "bg-surface border border-amber-500/20 text-amber-500 hover:bg-amber-500/5"
                                )}
                              >
                                {revealedHints[index] ? (
                                  <>
                                    <EyeOff size={12} />
                                    <span>Hide Hint</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye size={12} />
                                    <span>Reveal Hint</span>
                                  </>
                                )}
                              </button>
                              
                              <AnimatePresence>
                                {revealedHints[index] && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-[11px] text-amber-200/90 italic leading-relaxed"
                                  >
                                    💡 Hint: {practice.hint}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-text-main text-xs leading-relaxed">
                  <ReactMarkdown>{rawExamples || "No practice problems defined."}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-5 sm:p-7 border-l-[6px] border-l-emerald-500 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-3xl space-y-4 border border-border/10 shadow-lg"
            >
              <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-[10px] uppercase tracking-wider">
                <CheckCircle2 size={14} />
                <span>Retention & Key Takeaways</span>
              </div>

              {summaryData.takeaways.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {summaryData.takeaways.map((point, index) => (
                    <div 
                      key={index} 
                      className="bg-surface/30 border border-border/5 rounded-2xl flex items-start gap-3.5 p-3.5"
                    >
                      <span className="w-5 h-5 shrink-0 flex items-center justify-center bg-emerald-500 rounded-lg text-white font-black text-[10px]">
                        {index + 1}
                      </span>
                      <p className="text-xs text-text-main leading-relaxed m-0 font-medium">{point}</p>
                    </div>
                  ))}

                  {/* Warning Callout Box for WATCH OUT */}
                  {summaryData.watchOut && (
                    <div className="mt-4 p-4 border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl space-y-2 shadow-inner">
                      <div className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase tracking-wider">
                        <AlertCircle size={14} />
                        <span>⚠️ Watch Out (Common Student Error)</span>
                      </div>
                      <p className="text-[11px] text-text-main leading-relaxed italic m-0">
                        {summaryData.watchOut}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-text-main text-xs leading-relaxed">
                  <ReactMarkdown>{rawSummary || "No key takeaways defined."}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
