import express from 'express';
import { 
  getMaterials, 
  createMaterial, 
  deleteMaterial, 
  deleteMaterials, 
  updateMaterial, 
  getPublicMaterials, 
  cloneMaterial, 
  togglePublicStatus 
} from '../controllers/materialController.js';
import { analyzeMaterial, generateChapters, getYoutubeTranscript } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/public', getPublicMaterials);
router.post('/clone/:id', cloneMaterial);
router.post('/toggle-public/:id', togglePublicStatus);

router.post('/youtube-transcript', getYoutubeTranscript);

router.get('/', getMaterials);
router.post('/', createMaterial);
router.post('/analyze', analyzeMaterial);
router.post('/generate-chapters', generateChapters);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);
router.post('/bulk-delete', deleteMaterials);

export default router;
