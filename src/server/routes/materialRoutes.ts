import express from 'express';
import { 
  getMaterials, 
  createMaterial, 
  deleteMaterial, 
  deleteMaterials, 
  updateMaterial, 
  getPublicMaterials, 
  cloneMaterial, 
  togglePublicStatus,
  reviewFlashcard,
  shareMaterial,
  getSharedMaterial,
  saveFromShare
} from '../controllers/materialController.js';
import { analyzeMaterial, generateChapters, getYoutubeTranscript } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/shared/:token', getSharedMaterial);

// Protected routes
router.use(protect);

router.get('/public', getPublicMaterials);
router.post('/share', shareMaterial);
router.post('/save-from-share', saveFromShare);
router.post('/clone/:id', cloneMaterial);
router.post('/:id/toggle-public', togglePublicStatus);
router.post('/:id/flashcards/:cardId/review', reviewFlashcard);

router.post('/youtube-transcript', getYoutubeTranscript);

router.get('/', getMaterials);
router.post('/', createMaterial);
router.post('/analyze', analyzeMaterial);
router.post('/generate-chapters', generateChapters);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);
router.post('/bulk-delete', deleteMaterials);

export default router;
