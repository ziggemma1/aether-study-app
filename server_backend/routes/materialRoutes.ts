import express from 'express';
import Material from '../models/Material.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const materials = await Material.find();
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

router.post('/', async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/public', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Not found' });
    material.public = !material.public;
    await material.save();
    res.json(material);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/clone', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Not found' });
    const clone = await Material.create({
      title: material.title + ' (Clone)',
      type: material.type,
      summary: material.summary,
      keyTopics: material.keyTopics,
      content: material.content,
      public: false
    });
    res.status(201).json(clone);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
