import express from 'express';
import { 
  getMaterials, 
  getMaterial,
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
  saveFromShare,
  getRecentMaterials,
  getLibraryMaterials
} from '../controllers/materialController.js';
import { 
  analyzeMaterial, 
  generateChapters, 
  generateDeepDive,
  getYoutubeTranscript,
  generateFlashcards as generateFlashcardsController,
  generateQuiz as generateQuizController,
  chatWithTutor as chatWithTutorController,
  generatePlan as generatePlanController,
  generateSpeech as generateSpeechController,
  previewVoice as previewVoiceController
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

router.get('/recent', getRecentMaterials);
router.get('/library', getLibraryMaterials);
router.get('/', getMaterials);
router.get('/analyze', (req, res) => {
  res.status(405).json({ 
    message: 'Method Not Allowed. Material analysis requires a POST request with content.',
    hint: 'If you were trying to fetch a material with ID "analyze", ensure the ID is valid.'
  });
});
router.get('/:id', getMaterial);
router.post('/', createMaterial);
router.post('/analyze', analyzeMaterial);
router.post('/generate-chapters', generateChapters);
router.post('/generate-deep-dive', generateDeepDive);
router.post('/generate-flashcards', generateFlashcardsController);
router.post('/generate-quiz', generateQuizController);
router.post('/chat', chatWithTutorController);
router.post('/speech', generateSpeechController);
router.post('/voice-preview', previewVoiceController);
router.post('/generate-plan', generatePlanController);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);
router.post('/bulk-delete', deleteMaterials);

export default router;
