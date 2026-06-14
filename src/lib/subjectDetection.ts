export type SubjectName = 'Math' | 'Science' | 'History' | 'Literature' | 'General';

/**
 * Categorizes a string query (title, topic, or description) into one of our predefined subject buckets.
 */
export function detectSubject(text?: string): SubjectName {
  if (!text) return 'General';
  const query = text.toLowerCase();

  const keywords: Record<Exclude<SubjectName, 'General'>, string[]> = {
    Math: [
      'math', 'calculus', 'algebra', 'geometry', 'matrix', 'discrete', 'number', 'equation', 
      'derivative', 'integral', 'fraction', 'trigonometry', 'stat', 'probab', 'arithmetic', 
      'vector', 'proof', 'theorem', 'settheory', 'ashlock', 'numerical', 'logic'
    ],
    Science: [
      'science', 'biology', 'chemistry', 'physics', 'anatomy', 'atom', 'molecule', 'cell', 
      'genetic', 'quantum', 'mechanic', 'organism', 'evolution', 'astro', 'space', 'laboratory', 
      'experiment', 'neuro', 'nature', 'astronomy', 'botany', 'ecology', 'geology', 'dna'
    ],
    History: [
      'history', 'war', 'renaissance', 'empire', 'ancient', 'revolution', 'century', 'dynasty', 
      'president', 'government', 'chronology', 'treaty', 'document', 'civilization', 'politic', 
      'medieval', 'colonial', 'archaeology', 'greece', 'rome', 'soviet', 'cold war'
    ],
    Literature: [
      'poetry', 'novel', 'shakespeare', 'literature', 'essay', 'grammar', 'read', 'write', 
      'book', 'drama', 'theatre', 'dialogue', 'story', 'author', 'prose', 'metaphor', 'critique', 
      'english', 'linguistic', 'narrative', 'fiction'
    ]
  };

  const scores: Record<SubjectName, number> = {
    Math: 0,
    Science: 0,
    History: 0,
    Literature: 0,
    General: 0
  };

  (Object.keys(keywords) as Array<Exclude<SubjectName, 'General'>>).forEach(subj => {
    keywords[subj].forEach(kw => {
      if (query.includes(kw)) {
        scores[subj] += 1;
      }
    });
  });

  let maxSubject: SubjectName = 'General';
  let maxScore = 0;

  (Object.keys(scores) as SubjectName[]).forEach(subj => {
    if (scores[subj] > maxScore) {
      maxScore = scores[subj];
      maxSubject = subj;
    }
  });

  return maxSubject;
}
