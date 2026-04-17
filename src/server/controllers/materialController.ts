import { Request, Response } from 'express';
import { Material } from '../models/Material.js';

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    console.log(`Fetching materials for user ID: ${userId}`);
    const materials = await Material.find({ userId }).sort({ createdAt: -1 });
    console.log(`Found ${materials.length} materials for user ${userId}`);
    res.json(materials);
  } catch (error: any) {
    console.error(`Error fetching materials for user ${(req as any).userId}:`, error);
    res.status(500).json({ message: error.message });
  }
};

export const createMaterial = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, type, summary, content, keyTopics, realLifeApplications, detailedNotes, noteSections, visualAidUrl, suggestedQuizQuestions } = req.body;
    
    console.log(`Creating material for user ID: ${userId}, Title: ${title}`);
    
    const material = new Material({
      userId,
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
    console.log(`Material saved successfully with ID: ${material._id}`);
    res.status(201).json(material);
  } catch (error: any) {
    console.error(`Error creating material for user ${(req as any).userId}:`, error);
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

export const deleteMaterials = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Invalid IDs provided' });
    }

    const userId = (req as any).userId;
    const result = await Material.deleteMany({
      _id: { $in: ids },
      userId
    });

    res.json({ message: `${result.deletedCount} materials deleted`, deletedCount: result.deletedCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
