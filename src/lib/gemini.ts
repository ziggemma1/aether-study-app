import { NoteSection } from "../types";
import { 
  analyzeStudyMaterial,
  generateFlashcardsOnClient,
  generateQuizQuestionsOnClient,
  chatWithTutorOnClient,
  generateGeminiTopicSection as generateTopicSectionOnClient,
  generateVisualAid
} from "../services/geminiService";

// This file is now a proxy to backend-safe services.
// It ensures that any component importing from here is redirected to the server.

export interface StudyMaterialAnalysis {
  summary: string;
  keyTopics: string[];
  realLifeApplications: string[];
  detailedNotes: string;
  noteSections?: (NoteSection & { imageUrl?: string })[];
  suggestedQuizQuestions: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export const generateVisualAidOnClient = generateVisualAid;
export const analyzeStudyMaterialOnClient = analyzeStudyMaterial;
export { generateFlashcardsOnClient, generateQuizQuestionsOnClient, chatWithTutorOnClient, generateTopicSectionOnClient };

export const simplifyContentELI5 = async (content: string, language: string = "English (US)"): Promise<string> => {
  // ELI5 is a simple chat task, we can use the tutor chat or add a specific endpoint.
  // For now, redirect to a generic tutor chat with a specific prompt.
  try {
    return await chatWithTutorOnClient(
      "SIMPLIFY", 
      content, 
      [], 
      "Explain this text like I'm 5 years old. Keep it simple and clear.",
      language
    );
  } catch (err) {
    console.error("ELI5 failed", err);
    return content;
  }
};
