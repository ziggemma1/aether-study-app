import { Request, Response } from 'express';
import { 
  analyzeStudyMaterial as analyzeStudyMaterialSvc, 
  generateFlashcards as generateFlashcardsSvc, 
  generateQuiz as generateQuizSvc, 
  chatWithTutor as chatWithTutorSvc, 
  generateStudyPlan as generateStudyPlanSvc,
  generateDetailedNotes as generateDetailedNotesSvc
} from '../services/aiService.js';
import { YoutubeTranscript } from 'youtube-transcript';

export const getYoutubeTranscript = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    console.log(`Fetching YouTube transcript for: ${url}`);
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    
    // Combine texts
    const content = transcript.map(t => t.text).join(' ');
    res.json({ content });
  } catch (error: any) {
    console.error('YouTube transcript error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch YouTube transcript. Ensure the video has closed captions enabled.',
      error: error.message 
    });
  }
};

export const analyzeMaterial = async (req: Request, res: Response) => {
  try {
    const { content, title, language } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    console.log(`Server-side analysis starting for: ${title}`);
    const analysis = await analyzeStudyMaterialSvc(content, title, language);
    res.json(analysis);
  } catch (error: any) {
    console.error('Server-side analysis error:', error);
    res.status(500).json({ 
      message: 'Analysis failed on server', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

import { Material as MaterialModel } from '../models/Material.js';

export const generateChapters = async (req: Request, res: Response) => {
  try {
    const { content, title, materialId } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    console.log(`Backend generation starting for: ${title} (Material ID: ${materialId || 'none'})`);
    
    // Always call generation service
    const notesResult = await generateDetailedNotesSvc(content, title);
    
    if (!notesResult || (!notesResult.detailedNotes && !notesResult.structuredNote)) {
      throw new Error("Generation returned empty results");
    }

    if (materialId) {
      console.log(`[AI-Sync] Updating material ${materialId} after generation...`);
      const updated = await MaterialModel.findByIdAndUpdate(materialId, {
        detailedNotes: notesResult.detailedNotes,
        structuredNote: notesResult.structuredNote,
        generationStatus: 'completed'
      }, { new: true });
      
      if (!updated) {
        throw new Error(`Failed to find material ${materialId} to update`);
      }
      return res.json(updated);
    }

    res.json(notesResult);
  } catch (error: any) {
    console.error('Backend generation error:', error);
    res.status(500).json({ 
      message: 'Generation failed on server', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const generateFlashcards = async (req: Request, res: Response) => {
  try {
    const { content, language, count } = req.body;
    const result = await generateFlashcardsSvc(content, language, count);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Flashcard generation failed', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const generateQuiz = async (req: Request, res: Response) => {
  try {
    const { content, language, count, difficulty, complexity } = req.body;
    const result = await generateQuizSvc(content, language, count, difficulty, complexity);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Quiz generation failed', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const chatWithTutor = async (req: Request, res: Response) => {
  try {
    const { materialTitle, materialContent, chatHistory, userMessage, language } = req.body;
    const result = await chatWithTutorSvc(materialTitle, materialContent, chatHistory, userMessage, language);
    res.json({ content: result });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Tutor chat failed', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const generatePlan = async (req: Request, res: Response) => {
  try {
    const { materials, startDate, duration, goal, complexity, commitment, language } = req.body;
    const result = await generateStudyPlanSvc(materials, startDate, duration, goal, complexity, commitment, language);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Plan generation failed', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};
