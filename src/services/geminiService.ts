import api from './api.js';
import { StudyMaterialAnalysis } from '../lib/gemini.js';
import { PlanSession } from '../types.js';

// This service now serves as a bridge to the backend AI endpoints
// to ensure API keys are never exposed to the client.

export const analyzeStudyMaterial = async (content: string, title: string = "Material", language: string = "English (US)"): Promise<StudyMaterialAnalysis> => {
  try {
    const response = await api.post('/materials/analyze', { content, title, language });
    return response.data;
  } catch (error: any) {
    console.error('Analysis failed via backend:', error);
    throw error;
  }
};

export const generateStudyPlan = async (
  materials: any[], 
  startDate: string, 
  duration: number, 
  goal: string, 
  complexity: string, 
  commitment: string,
  language: string = "English (US)"
): Promise<PlanSession[]> => {
  try {
    const response = await api.post('/materials/generate-plan', { 
      materials, 
      startDate, 
      duration, 
      goal, 
      complexity, 
      commitment,
      language 
    });
    return response.data;
  } catch (error: any) {
    console.error('Study plan generation failed via backend:', error);
    throw error;
  }
};

export const generateVisualAid = async (prompt: string): Promise<string> => {
  // Visual aids (images) can be intensive. 
  // If no backend endpoint exists for this yet, we might return placeholder or add one.
  // For now, let's return a stable placeholder or implement a simple backend proxy.
  console.warn('Visual aid requested via client. Returning placeholder or skipping.');
  return '';
};

// Re-export other methods as redirections
export { 
  generateFlashcardsWithOpenRouter as generateFlashcardsOnClient,
  generateQuizQuestionsWithOpenRouter as generateQuizQuestionsOnClient,
  chatWithTutorWithOpenRouter as chatWithTutorOnClient,
  generateTopicSection as generateGeminiTopicSection
} from './openRouterService.js';
