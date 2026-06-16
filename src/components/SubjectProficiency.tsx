import React from 'react';
import { BookOpen } from 'lucide-react';

interface Subject {
  name: string;
  proficiency: number;
  quizCount: number;
}

interface SubjectProficiencyProps {
  subjects: Subject[];
}

export default function SubjectProficiency({ subjects }: SubjectProficiencyProps) {
  // If no subjects found or all proficiencies are 0 (e.g. no quizzes executed)
  const hasQuizData = subjects.length > 0 && subjects.some(s => s.quizCount > 0);

  if (!hasQuizData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#141A24] rounded-2xl border border-white/5 min-h-[220px] text-center">
        <div className="w-12 h-12 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-center mb-4">
          <BookOpen className="text-[#6C5CE7]" size={22} />
        </div>
        <p className="text-sm font-semibold text-gray-300">Complete your first quiz to see proficiency</p>
        <p className="text-xs text-gray-500 mt-1 max-w-[280px]">
          Take a quiz based on your materials to analyze detailed performance by study subject.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {subjects.map((sub) => {
        // Calculate the percentage
        const score = sub.proficiency;

        return (
          <div key={sub.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-[#F0F3F8] block">
                  {sub.name}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {sub.quizCount} quiz{sub.quizCount !== 1 ? 'zes' : ''} completed
                </span>
              </div>
              <span className="text-sm font-bold text-[#00D2FF]">
                {score}%
              </span>
            </div>
            
            <div className="relative h-2.5 w-full bg-[#0B0E14] rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00D2FF] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${score}%` }}
              />
            </div>
            
            <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider">
              <span>Novice</span>
              <span>Exp</span>
              <span>Proficient</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
