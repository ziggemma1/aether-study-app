import express from 'express';
import { protect } from '../middleware/authMiddleware';
import * as shopController from '../controllers/shopController';

const router = express.Router();

router.use(protect);

router.get('/items', shopController.getShopItems);
router.post('/purchase', shopController.purchaseItem);
router.get('/points', shopController.getUserPoints);
router.get('/history', shopController.getTransactionHistory);
router.get('/stats', shopController.getShopStats);
router.post('/award-points', shopController.awardPointsAction);

export default router;
