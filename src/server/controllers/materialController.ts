import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Material } from '../models/Material.js';
import { SharedMaterial } from '../models/SharedMaterial.js';
import crypto from 'crypto';
import { checkAchievements } from '../services/achievement-service.js';

export const shareMaterial = async (req: Request, res: Response) => {
  try {
    const { materialId } = req.body;
    const userId = (req as any).userId;

    const material = await Material.findOne({ _id: materialId, userId });
    if (!material) {
      return res.status(404).json({ message: "Material not found or unauthorized" });
    }

    // Check if it's already shared
    let shared = await SharedMaterial.findOne({ materialId });
    if (!shared) {
      const shareToken = crypto.randomBytes(12).toString('hex');
      shared = new SharedMaterial({
        materialId,
        shareToken,
        originalUserId: userId,
      });
      await shared.save();
    }

    res.json({
      shareToken: shared.shareToken,
      shareUrl: `${req.protocol}://${req.get('host')}/share/${shared.shareToken}`
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSharedMaterial = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const shared = await SharedMaterial.findOne({ shareToken: token })
      .populate({
        path: 'materialId',
        populate: { path: 'userId', select: 'name avatar' }
      });

    if (!shared || !shared.materialId) {
      return res.status(404).json({ message: "Shared material not found or expired" });
    }

    // Increment view count
    shared.viewCount = (shared.viewCount || 0) + 1;
    await shared.save();

    res.json(shared.materialId);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const saveFromShare = async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.body;
    const userId = (req as any).userId;

    console.log(`[SaveFromShare] User ${userId} attempting to save from token ${shareToken}`);

    const shared = await SharedMaterial.findOne({ shareToken }).populate('materialId');
    if (!shared || !shared.materialId) {
      console.warn(`[SaveFromShare] Shared material not found for token: ${shareToken}`);
      return res.status(404).json({ message: "Shared material not found" });
    }

    const originalMaterial = shared.materialId as any;
    
    // Create a clean copy of the data, removing MongoDB internal fields
    const materialData = originalMaterial.toObject();
    delete materialData._id;
    delete materialData.__v;
    delete materialData.id;

    const savedCopy = new Material({
      ...materialData,
      userId, // Assign to current user
      title: `${originalMaterial.title} (Shared)`,
      isPublic: false,
      likes: 0,
      downloads: 0,
      progress: 0,
      createdAt: new Date()
    });

    // Reset spaced repetition stats for flashcards if they exist
    if (savedCopy.flashcards && savedCopy.flashcards.length > 0) {
      (savedCopy as any).flashcards = (savedCopy.flashcards as any[]).map((f: any) => ({
        ...f,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: new Date(),
        masteryLevel: 0
      }));
    }

    await savedCopy.save();
    console.log(`[SaveFromShare] Successfully saved copy ${savedCopy._id} for user ${userId}`);
    res.status(201).json(savedCopy);
  } catch (error: any) {
    console.error(`[SaveFromShare] Error:`, error);
    res.status(500).json({ message: error.message });
  }
};

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
    const { 
      title, type, summary, content, keyTopics, 
      realLifeApplications, detailedNotes, noteSections, 
      structuredNote, visualAidUrl, suggestedQuizQuestions, 
      isPublic, flashcards 
    } = req.body;
    
    console.log(`Creating material for user ID: ${userId}, Title: ${title}`);
    
    let authorName = req.body.authorName;
    if (isPublic && !authorName) {
      try {
        const user = await mongoose.model('User').findById(userId);
        authorName = user?.name || "Unknown Author";
      } catch (err) {
        console.warn('User model not found or lookup failed:', err);
        authorName = "Aether Scholar";
      }
    }

    // Defensive check for quiz questions to prevent Mongoose "Cast to embedded failed" errors
    const normalizedQuizQuestions = Array.isArray(suggestedQuizQuestions) 
      ? suggestedQuizQuestions.filter(q => q && typeof q === 'object' && !Array.isArray(q)) 
      : [];

    const material = new Material({
      userId,
      title,
      type,
      summary,
      content,
      keyTopics: Array.isArray(keyTopics) ? keyTopics : [],
      realLifeApplications: Array.isArray(realLifeApplications) ? realLifeApplications : [],
      detailedNotes,
      noteSections: Array.isArray(noteSections) ? noteSections : [],
      structuredNote,
      visualAidUrl,
      suggestedQuizQuestions: normalizedQuizQuestions,
      flashcards: Array.isArray(flashcards) ? flashcards : [],
      isPublic: isPublic || false,
      authorName: authorName || "Aether Scholar",
      likes: Math.floor(Math.random() * 15) + 2,
      downloads: Math.floor(Math.random() * 20) + 5,
      rating: parseFloat((4 + Math.random()).toFixed(1))
    });

    await material.save();
    console.log(`Material saved successfully with ID: ${material._id}`);
    
    try {
      await checkAchievements(userId);
    } catch (achError) {
      console.error('Error triggering achievements on material creation:', achError);
    }

    res.status(201).json(material);
  } catch (error: any) {
    console.error(`Error creating material for user ${(req as any).userId}:`, error);
    // Return detailed error if validation fails
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        details: Object.values(error.errors).map((e: any) => e.message) 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

export const getMaterial = async (req: Request, res: Response) => {
  try {
    const material = await Material.findOne({ 
      _id: req.params.id, 
      userId: (req as any).userId 
    });
    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }
    res.json(material);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    
    console.log(`[DELETE_MATERIAL] User ${userId} attempting to delete material ${id}`);
    
    // Ensure we only delete if it belongs to the user
    const material = await Material.findOneAndDelete({ 
      _id: id, 
      userId 
    });
    
    if (!material) {
      console.warn(`[DELETE_MATERIAL] Material ${id} not found or unauthorized for user ${userId}`);
      return res.status(404).json({ message: 'Material not found' });
    }
    
    console.log(`[DELETE_MATERIAL] Successfully deleted material ${id}`);
    res.json({ message: 'Material deleted successfully' });
  } catch (error: any) {
    console.error(`[DELETE_MATERIAL] Error:`, error);
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
    console.log(`[BULK_DELETE] User ${userId} attempting to delete ${ids.length} materials:`, ids);

    // Filter by userId and the provided IDs
    const result = await Material.deleteMany({
      _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) },
      userId
    });

    console.log(`[BULK_DELETE] Result: ${result.deletedCount} items deleted for user ${userId}`);
    res.json({ 
      message: `${result.deletedCount} materials deleted`, 
      deletedCount: result.deletedCount 
    });
  } catch (error: any) {
    console.error(`[BULK_DELETE] Error:`, error);
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

    // Reward for reviewing (e.g., 5 Aether points per card)
    await mongoose.model('User').findByIdAndUpdate(userId, {
      $inc: { aetherPoints: 5 }
    });

    await material.save();
    res.json({ message: "Review recorded", card });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecentMaterials = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const dbMaterials = await Material.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    const formatted = dbMaterials.map((m: any) => ({
      id: m._id || m.id,
      title: m.title,
      type: m.type || 'pdf',
      uploadDate: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      thumbnail: m.thumbnail || null,
      progress: m.progress || 0
    }));

    res.json({ materials: formatted });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLibraryMaterials = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const dbMaterials = await Material.find({ userId }).sort({ createdAt: -1 });

    const formatted = dbMaterials.map((m: any) => ({
      id: m._id ? m._id.toString() : m.id,
      title: m.title || 'Untitled',
      type: m.type || 'pdf',
      date: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: m.summary || '',
      tags: m.keyTopics || [],
      mastery: m.progress || 0,
      hasQuiz: !!(m.suggestedQuizQuestions && m.suggestedQuizQuestions.length > 0),
      hasFlashcards: !!(m.flashcards && m.flashcards.length > 0),
      hasNotes: !!(m.detailedNotes || (m.noteSections && m.noteSections.length > 0) || m.structuredNote)
    }));

    res.json({ materials: formatted });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

