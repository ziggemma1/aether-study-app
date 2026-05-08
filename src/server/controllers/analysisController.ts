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
      error: error.message 
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
    
    // We return a response immediately if it's a background call
    if (materialId) {
      res.json({ message: 'Background generation started' });
      
      // Run generation in "background"
      (async () => {
        try {
          const notesResult = await generateDetailedNotesSvc(content, title);
          await MaterialModel.findByIdAndUpdate(materialId, {
            detailedNotes: notesResult.detailedNotes,
            generationStatus: 'completed'
          });
          console.log(`Background generation completed for ${materialId}`);
        } catch (err: any) {
          console.error(`Background generation failed for ${materialId}:`, err.message);
          await MaterialModel.findByIdAndUpdate(materialId, { generationStatus: 'failed' });
        }
      })();
      return;
    }

    // Direct synchronous call (standard way)
    const notesResult = await generateDetailedNotesSvc(content, title);
    res.json(notesResult);
  } catch (error: any) {
    console.error('Backend generation error:', error);
    res.status(500).json({ 
      message: 'Generation failed on server', 
      error: error.message 
    });
  }
};

export const generateFlashcards = async (req: Request, res: Response) => {
  try {
    const { content, language, count } = req.body;
    const result = await generateFlashcardsSvc(content, language, count);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Flashcard generation failed', error: error.message });
  }
};

export const generateQuiz = async (req: Request, res: Response) => {
  try {
    const { content, language, count, difficulty, complexity } = req.body;
    const result = await generateQuizSvc(content, language, count, difficulty, complexity);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Quiz generation failed', error: error.message });
  }
};

export const chatWithTutor = async (req: Request, res: Response) => {
  try {
    const { materialTitle, materialContent, chatHistory, userMessage, language } = req.body;
    const result = await chatWithTutorSvc(materialTitle, materialContent, chatHistory, userMessage, language);
    res.json({ content: result });
  } catch (error: any) {
    res.status(500).json({ message: 'Tutor chat failed', error: error.message });
  }
};

export const generatePlan = async (req: Request, res: Response) => {
  try {
    const { materials, startDate, duration, goal, complexity, commitment, language } = req.body;
    const result = await generateStudyPlanSvc(materials, startDate, duration, goal, complexity, commitment, language);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Plan generation failed', error: error.message });
  }
};
