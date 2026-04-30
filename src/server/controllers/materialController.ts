import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Material } from '../models/Material.js';

export const getMaterials = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    console.log(`Fetching materials for user ID: ${userId}`);
    const materials = await Material.find({ userId });
    
    // Sort in application memory to bypass MongoDB's strict 32MB sorting limit constraint
    materials.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

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
    const { 
      title, 
      type, 
      summary, 
      content, 
      keyTopics, 
      realLifeApplications, 
      detailedNotes, 
      noteSections, 
      visualAidUrl, 
      suggestedQuizQuestions,
      flashcards,
      isPublic
    } = req.body;
    
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
      suggestedQuizQuestions,
      flashcards: flashcards || [],
      isPublic: isPublic || false
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
    const { 
      title, 
      summary, 
      content, 
      keyTopics, 
      realLifeApplications, 
      detailedNotes, 
      noteSections, 
      visualAidUrl, 
      isPublic,
      flashcards 
    } = req.body;

    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title;
    if (summary !== undefined) updateFields.summary = summary;
    if (content !== undefined) updateFields.content = content;
    if (keyTopics !== undefined) updateFields.keyTopics = keyTopics;
    if (realLifeApplications !== undefined) updateFields.realLifeApplications = realLifeApplications;
    if (detailedNotes !== undefined) updateFields.detailedNotes = detailedNotes;
    if (noteSections !== undefined) updateFields.noteSections = noteSections;
    if (visualAidUrl !== undefined) updateFields.visualAidUrl = visualAidUrl;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;
    if (flashcards !== undefined) updateFields.flashcards = flashcards;

    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, userId: (req as any).userId },
      { $set: updateFields },
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

export const getPublicMaterials = async (req: Request, res: Response) => {
  try {
    const materials = await Material.find({ isPublic: true })
      .populate('userId', 'name avatar')
      .sort({ likes: -1, createdAt: -1 });
    res.json(materials);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const cloneMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const originalMaterial = await Material.findById(id);
    if (!originalMaterial) {
      return res.status(404).json({ message: "Original material not found" });
    }

    // Create a copy for the user
    const clonedMaterial = new Material({
      ...originalMaterial.toObject(),
      _id: new mongoose.Types.ObjectId(),
      userId,
      isPublic: false, // cloned material is private by default for the cloner
      likes: 0,
      downloads: 0,
      createdAt: new Date()
    });

    await clonedMaterial.save();

    // Increment original material's download count
    originalMaterial.downloads += 1;
    await originalMaterial.save();

    res.status(201).json(clonedMaterial);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const togglePublicStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const material = await Material.findOne({ _id: id, userId });
    if (!material) {
      return res.status(404).json({ message: "Material not found or unauthorized" });
    }

    material.isPublic = !material.isPublic;
    if (material.isPublic && !material.authorName) {
      const user = await req.app.get('cache')?.User?.findById?.(userId) 
        || await mongoose.model('User').findById(userId);
      material.authorName = user?.name || "Unknown Author";
    }

    await material.save();
    res.json(material);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const reviewFlashcard = async (req: Request, res: Response) => {
  try {
    const { id, cardId } = req.params;
    const { quality } = req.body; // 0-5 scale
    const userId = (req as any).userId;

    const material = await Material.findOne({ _id: id, userId });
    if (!material) {
      return res.status(404).json({ message: "Material not found or unauthorized" });
    }

    const card = (material as any).flashcards.id(cardId);
    if (!card) {
      return res.status(404).json({ message: "Flashcard not found" });
    }

    // SM-2 SRS Algorithm
    let { interval, repetitions, easeFactor } = card;

    if (quality >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    card.interval = interval;
    card.repetitions = repetitions;
    card.easeFactor = easeFactor;
    card.nextReview = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

    await material.save();
    res.json({ message: "Review recorded", card });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
