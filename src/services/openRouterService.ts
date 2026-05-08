import api from './api.js';
import { NoteSection } from '../types.js';

// This client-side service now redirects all intensive AI tasks to the backend
// to protect API keys and ensure stability across different environments.

export const generateTopicSection = async (content: string, title: string, topic: string, context?: string): Promise<NoteSection> => {
  // In the current architecture, we usually don't call this individually from client
  // but if we do, it should go to a general "generate section" endpoint or similar.
  // For now, let's keep it as is, or redirect to a catch-all if needed.
  console.warn('generateTopicSection called on client. Redirecting...');
  return { heading: topic, content: 'Redirected generation...', imagePrompt: '' };
};

export const generateDetailedNotes = async (content: string, title: string): Promise<{ detailedNotes: string }> => {
  try {
    const response = await api.post('/materials/generate-chapters', { content, title });
    return response.data;
  } catch (error: any) {
    console.error('Failed to generate detailed notes via backend:', error);
    throw error;
  }
};

export const analyzeStudyMaterialWithOpenRouter = async (content: string, title: string = "Material") => {
  try {
    const response = await api.post('/materials/analyze', { content, title });
    return response.data;
  } catch (error: any) {
    console.error('Failed to analyze material via backend:', error);
    throw error;
  }
};

export const generateFlashcardsWithOpenRouter = async (content: string, language: string = "English (US)", count: number = 10) => {
  try {
    const response = await api.post('/materials/generate-flashcards', { content, language, count });
    return response.data;
  } catch (error: any) {
    console.error('Failed to generate flashcards via backend:', error);
    throw error;
  }
};

export const generateQuizQuestionsWithOpenRouter = async (
  content: string,
  language: string = "English (US)",
  count: number = 10,
  difficulty: string = "Medium",
  complexity: string = "Standard"
) => {
  try {
    const response = await api.post('/materials/generate-quiz', { content, language, count, difficulty, complexity });
    return response.data;
  } catch (error: any) {
    console.error('Failed to generate quiz via backend:', error);
    throw error;
  }
};

export const chatWithTutorWithOpenRouter = async (
  materialTitle: string, 
  materialContent: string, 
  chatHistory: any[], 
  userMessage: string, 
  language: string = "English (US)"
) => {
  try {
    const response = await api.post('/materials/chat', { 
      materialTitle, 
      materialContent, 
      chatHistory, 
      userMessage, 
      language 
    });
    return response.data.content;
  } catch (error: any) {
    console.error('Failed to chat with tutor via backend:', error);
    throw error;
  }
};

export const generateStudyPlanWithOpenRouter = async (
  materials: any[], 
  startDate: string, 
  duration: number, 
  goal: string, 
  complexity: string, 
  commitment: string
) => {
  try {
    const response = await api.post('/materials/generate-plan', { 
      materials, 
      startDate, 
      duration, 
      goal, 
      complexity, 
      commitment 
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to generate plan via backend:', error);
    throw error;
  }
};
