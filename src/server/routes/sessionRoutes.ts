import express from 'express';
import { 
  getSessions, 
  createSession, 
  updateSession, 
  deleteSession 
} from '../controllers/sessionController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(auth);

router.get('/', getSessions);
router.post('/', createSession);
router.patch('/:id', updateSession);
router.delete('/:id', deleteSession);

export default router;
