import express from 'express';
import { getMaterials, createMaterial, deleteMaterial, updateMaterial } from '../controllers/materialController.js';
import { analyzeMaterial, generateChapters } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMaterials);
router.post('/', createMaterial);
router.post('/analyze', analyzeMaterial);
router.post('/generate-chapters', generateChapters);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;
