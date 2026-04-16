import { Request, Response } from 'express';
import { analyzeStudyMaterial } from '../../services/geminiService.js';

export const analyzeMaterial = async (req: Request, res: Response) => {
  try {
    const { content, title } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    console.log(`Server-side analysis starting for: ${title}`);
    const analysis = await analyzeStudyMaterial(content, title);
    res.json(analysis);
  } catch (error: any) {
    console.error('Server-side analysis error:', error);
    res.status(500).json({ 
      message: 'Analysis failed on server', 
      error: error.message 
    });
  }
};
