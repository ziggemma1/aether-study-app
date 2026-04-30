import express from 'express';
import { 
  getAllProfiles, 
  sendFriendRequest, 
  getFriendRequests, 
  respondToFriendRequest,
  toggleFollow,
  updateProfile,
  toggleLeaderboardOptIn,
  purchaseShopItem,
  penalizePoints
} from '../controllers/userController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(auth);

router.get('/profiles', getAllProfiles);
router.post('/friend-request', sendFriendRequest);
router.get('/friend-requests', getFriendRequests);
router.post('/friend-request/respond', respondToFriendRequest);
router.post('/follow/:id', toggleFollow);
router.patch('/profile', updateProfile);
router.post('/leaderboard/toggle', toggleLeaderboardOptIn);
router.post('/shop/purchase', purchaseShopItem);
router.post('/penalize', penalizePoints);

export default router;
