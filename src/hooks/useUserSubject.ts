import { useMemo } from 'react';
import { RecentMaterial } from './useDashboardData';
import { SubjectType } from '../lib/colorPalettes';

export function useUserSubject(recentMaterials: RecentMaterial[]): SubjectType {
  return useMemo(() => {
    if (!Array.isArray(recentMaterials) || recentMaterials.length === 0) {
      return 'default';
    }

    // Match keywords to decide primary subject matter
    // simple heuristic scoring mapper
    const scores = {
      math: 0,
      science: 0,
      history: 0,
      literature: 0
    };

    const mathKeywords = [
      'math', 'calculus', 'algebra', 'geometry', 'matrix', 'discrete', 'number', 'equation', 'derivative', 'integral', 'fraction',
      'trigonometry', 'stat', 'probab', 'arithmetic', 'vector', 'proof', 'theorem', 'settheory', 'ashlock'
    ];
    const scienceKeywords = [
      'science', 'biology', 'chemistry', 'physics', 'anatomy', 'atom', 'molecule', 'cell', 'genetic', 'quantum', 'mechanic',
      'organism', 'evolution', 'astro', 'space', 'laboratory', 'experiment', 'neuro', 'nature'
    ];
    const historyKeywords = [
      'history', 'war', 'renaissance', 'empire', 'ancient', 'revolution', 'century', 'dynasty', 'president', 'government',
      'chronology', 'treaty', 'document', 'civilization', 'politic', 'medieval', 'colonial'
    ];
    const literatureKeywords = [
      'poetry', 'novel', 'shakespeare', 'literature', 'essay', 'grammar', 'read', 'write', 'book', 'drama', 'theatre',
      'dialogue', 'story', 'author', 'prose', 'metaphor', 'critique', 'english'
    ];

    recentMaterials.forEach(material => {
      const title = (material.title || '').toLowerCase();
      
      mathKeywords.forEach(kw => {
        if (title.includes(kw)) scores.math += 1;
      });
      scienceKeywords.forEach(kw => {
        if (title.includes(kw)) scores.science += 1;
      });
      historyKeywords.forEach(kw => {
        if (title.includes(kw)) scores.history += 1;
      });
      literatureKeywords.forEach(kw => {
        if (title.includes(kw)) scores.literature += 1;
      });
    });

    // Find key with max score
    let maxSubject: SubjectType = 'default';
    let maxVal = 0;
    
    (Object.keys(scores) as Array<keyof typeof scores>).forEach(sub => {
      if (scores[sub] > maxVal) {
        maxVal = scores[sub];
        maxSubject = sub as SubjectType;
      }
    });

    return maxSubject;
  }, [recentMaterials]);
}
