import { Request, Response } from 'express';
import { analyzeStudyMaterial } from '../../services/geminiService.js';
import { generateDetailedNotes } from '../../services/openRouterService.js';
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

export const generateChapters = async (req: Request, res: Response) => {
  try {
    const { content, title, keyTopics } = req.body;
    if (!content || !keyTopics) {
      return res.status(400).json({ message: 'Content and keyTopics are required' });
    }

    console.log(`Backend chapter generation starting for ${keyTopics.length} topics...`);
    const notesResult = await generateDetailedNotes(content, title, keyTopics);
    res.json(notesResult);
  } catch (error: any) {
    console.error('Backend chapter generation error:', error);
    res.status(500).json({ 
      message: 'Chapter generation failed on server', 
      error: error.message 
    });
  }
};
