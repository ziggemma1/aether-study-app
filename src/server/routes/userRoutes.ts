import express from 'express';
import { 
  getAllProfiles,
  updateProfile,
  changePassword,
  toggleFollow,
  sendFriendRequest,
  getFriendRequests,
  getSentFriendRequests,
  respondToFriendRequest,
  toggleLeaderboardOptIn,
  purchaseShopItem,
  equipShopItem,
  penalizePoints,
  completeOnboarding
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profiles', getAllProfiles);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/follow/:id', toggleFollow);
router.post('/friend-request', sendFriendRequest);
router.get('/friend-requests', getFriendRequests);
router.get('/sent-friend-requests', getSentFriendRequests);
router.post('/friend-request/respond', respondToFriendRequest);
router.post('/leaderboard/toggle', toggleLeaderboardOptIn);
router.post('/shop/purchase', purchaseShopItem);
router.post('/shop/equip', equipShopItem);
router.post('/penalize', penalizePoints);
router.post('/onboarding/complete', completeOnboarding);

export default router;

