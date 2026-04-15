import { Request, Response } from 'express';
import { Material } from '../models/Material.js';

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const materials = await Material.find({ userId: (req as any).userId }).sort({ createdAt: -1 });
    res.json(materials);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createMaterial = async (req: Request, res: Response) => {
  try {
    const { title, type, summary, content, keyTopics, realLifeApplications, detailedNotes, noteSections, visualAidUrl, suggestedQuizQuestions } = req.body;
    const material = new Material({
      userId: (req as any).userId,
      title,
      type,
      summary,
      content,
      keyTopics,
      realLifeApplications,
      detailedNotes,
      noteSections,
      visualAidUrl,
      suggestedQuizQuestions
    });
    await material.save();
    res.status(201).json(material);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const material = await Material.findOneAndDelete({ 
      _id: req.params.id, 
      userId: (req as any).userId 
    });
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json({ message: 'Material deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMaterial = async (req: Request, res: Response) => {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, userId: (req as any).userId },
      { $set: req.body },
      { new: true }
    );
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json(material);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
