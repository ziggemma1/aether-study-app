import express from 'express';
import { 
  getMaterials, 
  createMaterial, 
  deleteMaterial, 
  updateMaterial,
  deleteMaterials,
  getPublicMaterials,
  cloneMaterial,
  togglePublicStatus,
  reviewFlashcard
} from '../controllers/materialController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(auth);

router.get('/', getMaterials);
router.post('/', createMaterial);
router.delete('/:id', deleteMaterial);
router.patch('/:id', updateMaterial);
router.post('/batch-delete', deleteMaterials);
router.get('/public', getPublicMaterials);
router.post('/:id/clone', cloneMaterial);
router.patch('/:id/public', togglePublicStatus);
router.post('/:id/flashcards/:cardId/review', reviewFlashcard);

export default router;
