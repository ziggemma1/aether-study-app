import express from 'express';
import Material from '../models/Material.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, async (req: any, res) => {
  try {
    const materials = await Material.find({ userId: req.user._id });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/public', async (req, res) => {
  try {
    const materials = await Material.find({ public: true });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, async (req: any, res) => {
  try {
    const material = await Material.create({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', requireAuth, async (req: any, res) => {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!material) return res.status(404).json({ message: 'Not found or unauthorized' });
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const material = await Material.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!material) return res.status(404).json({ message: 'Not found or unauthorized' });
    res.json({ message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/public', requireAuth, async (req: any, res) => {
  try {
    const material = await Material.findOne({ _id: req.params.id, userId: req.user._id });
    if (!material) return res.status(404).json({ message: 'Not found or unauthorized' });
    material.public = !material.public;
    await material.save();
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/clone', requireAuth, async (req: any, res) => {
  try {
    const material = await Material.findOne({ _id: req.params.id });
    if (!material) return res.status(404).json({ message: 'Not found' });
    
    // Check if the original is public or belongs to user
    if (!material.public && material.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const clone = await Material.create({
      title: material.title + ' (Clone)',
      type: material.type,
      summary: material.summary,
      keyTopics: material.keyTopics,
      content: material.content,
      public: false,
      userId: req.user._id
    });
    res.status(201).json(clone);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
