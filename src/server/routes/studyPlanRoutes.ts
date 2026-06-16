import express from 'express';
import { 
  generateStudyPlan, 
  getStudyPlans, 
  getStudyPlan, 
  updateStudyPlan, 
  deleteStudyPlan 
} from '../controllers/studyPlanController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateStudyPlan);
router.get('/', getStudyPlans);
router.get('/:id', getStudyPlan);
router.put('/:id', updateStudyPlan);
router.delete('/:id', deleteStudyPlan);

export default router;
