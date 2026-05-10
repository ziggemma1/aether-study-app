export interface StructuredNote {
  title: string;
  learningObjectives: string[];
  keyTerms: Array<{ term: string; definition: string; memoryTip?: string }>;
  sections: Array<{
    heading: string;
    subsections: Array<{
      subheading: string;
      content: string;
      keywords: string[];
      memoryTip?: string;
      quickCheck?: string;
    }>;
  }>;
  comparisonTable?: {
    headers: string[];
    rows: string[][];
    title?: string;
  };
  summary: string[];
  activeRecallQuestions: string[];
  mnemonic?: string;
  relatedTopics?: string[];
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
    relatedTopics: note.relatedTopics
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

  // 3. Sections Fallback (CRITICAL)
  if (filled.sections.length === 0) {
    filled.sections = [{
      heading: "Overview",
      subsections: [{
        subheading: "Summary of Material",
        content: originalContent ? originalContent.substring(0, 1500) + "..." : "No detailed content available.",
        keywords: ["overview", "summary"]
      }]
    }];
    console.warn('[Validator] Using fallback sections');
  }

  // 4. Summary Fallback
  if (filled.summary.length === 0) {
    filled.summary = [originalContent ? originalContent.split(/[.!?]/)[0] + "." : "Key points from the material."];
  }

  // 5. Active Recall Fallback
  if (filled.activeRecallQuestions.length === 0) {
    filled.activeRecallQuestions = [
      "What is the main topic of this material?",
      "How would you summarize the key findings?",
      "What were the most important definitions discussed?"
    ];
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
