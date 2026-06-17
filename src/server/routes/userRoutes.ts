import express from 'express';
import { 
  getAllProfiles, 
  updateProfile, 
  toggleFollow, 
  sendFriendRequest, 
  getFriendRequests, 
  respondToFriendRequest,
  toggleLeaderboardOptIn,
  penalizePoints,
  upgradeToPro
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profiles', getAllProfiles);
router.put('/profile', updateProfile);
router.post('/upgrade-to-pro', upgradeToPro);
router.post('/follow/:id', toggleFollow);
router.post('/friend-request', sendFriendRequest);
router.get('/friend-requests', getFriendRequests);
router.post('/friend-request/respond', respondToFriendRequest);
router.post('/leaderboard/toggle', toggleLeaderboardOptIn);
router.post('/penalize', penalizePoints);

export default router;

