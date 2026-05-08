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
import { 
  analyzeMaterial, 
  generateChapters, 
  getYoutubeTranscript,
  generateFlashcards as generateFlashcardsController,
  generateQuiz as generateQuizController,
  chatWithTutor as chatWithTutorController,
  generatePlan as generatePlanController
} from '../controllers/analysisController.js';
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
router.post('/generate-flashcards', generateFlashcardsController);
router.post('/generate-quiz', generateQuizController);
router.post('/chat', chatWithTutorController);
router.post('/generate-plan', generatePlanController);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);
router.post('/bulk-delete', deleteMaterials);

export default router;
