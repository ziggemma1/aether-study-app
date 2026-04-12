import express from 'express';
import { getMaterials, createMaterial, deleteMaterial } from '../controllers/materialController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getMaterials);
router.post('/', createMaterial);
router.delete('/:id', deleteMaterial);

export default router;
