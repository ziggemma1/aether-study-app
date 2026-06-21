export interface KeyTerm {
  term: string;
  definition: string;
  memoryTip?: string;
}

export interface Subsection {
  subheading?: string;
  content: string;
  keywords: string[];
  memoryTip?: string;
  quickCheck?: string;
}

export interface NoteSectionGroup {
  heading: string;
  subsections: Subsection[];
}

export interface ComparisonTable {
  headers: string[];
  rows: string[][];
  title?: string;
}

export interface KeyConcept {
  name: string;
  definition: string;
  keyPoints: string[];
  example: string;
  memoryTip: string;
  deepDive?: string;
}

export interface StructuredNote {
  title: string;
  learningObjectives: string[];
  keyTerms: KeyTerm[];
  sections?: NoteSectionGroup[]; // Optional for legacy support
  comparisonTable?: ComparisonTable;
  summary: string[];
  activeRecallQuestions: string[];
  mnemonic?: string;
  relatedTopics?: string[];
  
  // Proven Learning Framework fields
  prerequisites?: string[];
  executiveSummary?: string;
  keyConcepts?: KeyConcept[];
  visualPrompts?: string[];
  applicationQuestions?: string[];
  nextSteps?: string[];
  studySchedule?: Record<string, string>;
}

export function validateAndFillNote(note: Partial<StructuredNote>, originalContent?: string, title?: string): StructuredNote {
  const filled: StructuredNote = {
    title: note.title || title || "Study Material",
    learningObjectives: note.learningObjectives?.filter(v => v && v.trim() !== '') || [],
    keyTerms: note.keyTerms?.filter(v => v.term && v.definition) || [],
    sections: note.sections?.filter(s => s.heading && s.subsections?.length) || [],
    comparisonTable: note.comparisonTable?.rows?.length ? note.comparisonTable : undefined,
    summary: note.summary?.filter(v => v && v.trim() !== '') || [],
    activeRecallQuestions: note.activeRecallQuestions?.filter(v => v && v.trim() !== '') || [],
    mnemonic: note.mnemonic,
    relatedTopics: note.relatedTopics,
    
    // Proven Learning Framework fields
    prerequisites: note.prerequisites?.filter(v => v && v.trim() !== '') || [],
    executiveSummary: note.executiveSummary || "",
    keyConcepts: note.keyConcepts?.filter(k => k.name && k.definition) || [],
    visualPrompts: note.visualPrompts?.filter(v => v && v.trim() !== '') || [],
    applicationQuestions: note.applicationQuestions?.filter(v => v && v.trim() !== '') || [],
    nextSteps: note.nextSteps?.filter(v => v && v.trim() !== '') || [],
    studySchedule: note.studySchedule || {}
  };

  // 1. Learning Objectives Fallback
  if (filled.learningObjectives.length === 0) {
    filled.learningObjectives = generateFallbackObjectives(originalContent);
    console.warn('[Validator] Using fallback learning objectives');
  }

  // 2. Key Terms Fallback
  if (filled.keyTerms.length === 0) {
    filled.keyTerms = generateFallbackKeyTerms(originalContent);
    console.warn('[Validator] Using fallback key terms');
  }

  // 3. Backward Compatibility / Key Concepts Fallback
  if (filled.keyConcepts.length === 0) {
    if (filled.sections && filled.sections.length > 0) {
      // Map legacy sections to keyConcepts format
      filled.keyConcepts = filled.sections.flatMap(sec => 
        (sec.subsections || []).map(sub => ({
          name: sub.subheading || sec.heading || "Key Concept",
          definition: sub.content.substring(0, 200) + (sub.content.length > 200 ? "..." : ""),
          keyPoints: sub.keywords && sub.keywords.length > 0 ? sub.keywords : ["Core concept mechanics"],
          example: "Refer to structured outline section for real-life usage.",
          memoryTip: sub.memoryTip || "Review explanation details.",
          deepDive: sub.content
        }))
      );
      console.log('[Validator] Successfully mapped legacy sections to keyConcepts');
    } else {
      filled.keyConcepts = [{
        name: "Core Subjects",
        definition: "The core ideas and methodologies contained within the study guide.",
        keyPoints: ["Foundational definitions", "Practical context"],
        example: "Applying first-principles thinking to the material.",
        memoryTip: "Pay close attention to key definitions.",
        deepDive: originalContent ? originalContent.substring(0, 2000) : "No content available."
      }];
      console.warn('[Validator] Using fallback keyConcepts');
    }
  }

  // 4. Prerequisites Fallback
  if (filled.prerequisites.length === 0) {
    filled.prerequisites = [
      "Review basic foundational context and state-related topics.",
      "Activate prior knowledge regarding general systems and terminology."
    ];
  }

  // 5. Executive Summary Fallback
  if (!filled.executiveSummary) {
    if (originalContent) {
      const sentences = originalContent.split(/[.!?]/).filter(s => s.trim().length > 10);
      filled.executiveSummary = sentences.slice(0, 3).join('. ') + '.';
    } else {
      filled.executiveSummary = "This guide synthesizes key topics, objectives, definitions, and active recall drills to maximize academic retention.";
    }
  }

  // 6. Summary Fallback
  if (filled.summary.length === 0) {
    filled.summary = [originalContent ? originalContent.split(/[.!?]/)[0] + "." : "Key points from the material."];
  }

  // 7. Active Recall Fallback
  if (filled.activeRecallQuestions.length === 0) {
    filled.activeRecallQuestions = [
      "What is the main topic of this material?",
      "How would you summarize the key findings?",
      "What were the most important definitions discussed?"
    ];
  }

  // 8. Application Questions Fallback
  if (filled.applicationQuestions.length === 0) {
    filled.applicationQuestions = [
      "Design a real-world scenario where the core concept is utilized to solve a practical issue.",
      "Compare this topic's conclusions with alternative frameworks you have studied."
    ];
  }

  // 9. Visual Prompts Fallback
  if (filled.visualPrompts.length === 0) {
    filled.visualPrompts = [
      "Draw a comprehensive concept map connecting all primary terms.",
      "Sketch a process flowchart visualizing the sequence of events."
    ];
  }

  // 10. Next Steps Fallback
  if (filled.nextSteps.length === 0) {
    if (filled.relatedTopics && filled.relatedTopics.length > 0) {
      filled.nextSteps = filled.relatedTopics.map(topic => `Explore: ${topic}`);
    } else {
      filled.nextSteps = [
        "Synthesize connections between the main terms.",
        "Attempt all active recall questions without referring to your notes."
      ];
    }
  }

  // 11. Study Schedule Fallback
  if (Object.keys(filled.studySchedule).length === 0) {
    filled.studySchedule = {
      "1 Day later": "Consolidate short-term memory",
      "3 Days later": "Strengthen retention and resolve weak concepts",
      "7 Days later": "Move definitions and applications to long-term memory",
      "30 Days later": "Achieve full long-term mastery before evaluations"
    };
  }

  return filled;
}

function generateFallbackObjectives(content?: string): string[] {
  return [
    'Understand the core concepts presented in the material',
    'Identify key terminology and their practical use cases',
    'Apply the principles discussed to real-world scenarios',
    'Review the main arguments and supporting evidence'
  ];
}

function generateFallbackKeyTerms(content?: string): Array<{ term: string; definition: string }> {
  if (content) {
    const words = content.split(/\s+/);
    // Grab first few capitalized words as potential terms
    const potentialTerms = Array.from(new Set(words.filter(w => w.length > 5 && /^[A-Z]/.test(w)))).slice(0, 5);
    if (potentialTerms.length > 0) {
      return potentialTerms.map(term => ({
        term: term.replace(/[^a-zA-Z]/g, ''),
        definition: `An important concept mentioned in the study material.`
      }));
    }
  }
  return [{ term: 'Main Concept', definition: 'The primary subject of this study material.' }];
}
