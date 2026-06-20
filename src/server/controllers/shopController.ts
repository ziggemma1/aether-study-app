import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ShopItem from '../models/ShopItem';
import UserInventory from '../models/UserInventory';
import Transaction from '../models/Transaction';
import { spendPoints, awardPoints, POINT_RULES } from '../utils/pointsSystem';
import { applyShopItem } from '../utils/shopUtils';

export const getShopItems = async (req: Request, res: Response) => {
  try {
    const items = await ShopItem.find({ isActive: true }).sort({ price: 1 });
    const userId = (req as any).userId;
    
    const inventory = await UserInventory.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    const ownedItemIds = inventory?.items?.map(i => i.itemId.toString()) || [];

    const itemsWithOwnership = items.map(item => ({
      ...item.toObject(),
      isOwned: ownedItemIds.includes(item._id.toString())
    }));

    res.json({ success: true, items: itemsWithOwnership });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const purchaseItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body;
    const userId = (req as any).userId;

    const item = await ShopItem.findById(itemId);
    if (!item || !item.isActive) {
      return res.status(404).json({ message: 'Item not available' });
    }

    const inventory = await UserInventory.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    const alreadyOwned = inventory?.items?.some(i => i.itemId.toString() === itemId);
    
    if (alreadyOwned && item.type !== 'consumable') {
      return res.status(400).json({ message: 'You already own this item' });
    }

    let price = item.price;
    if (item.discount && item.discountEndsAt && new Date() < item.discountEndsAt) {
      price = Math.round(price * (1 - item.discount / 100));
    }

    const result = await spendPoints(
      userId,
      price,
      itemId,
      `Purchased: ${item.name}`
    );

    await UserInventory.updateOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        $push: {
          items: {
            itemId: item._id,
            purchasedAt: new Date(),
            expiresAt: item.type === 'consumable' 
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
              : null,
            used: item.type === 'consumable' ? false : true
          }
        }
      },
      { upsert: true }
    );

    await applyShopItem(userId, item);

    res.json({
      success: true,
      remainingPoints: result.remainingPoints,
      item: {
        id: item._id,
        name: item.name,
        category: item.category
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserPoints = async (req: Request, res: Response) => {
  try {
    const inventory = await UserInventory.findOne({ 
      userId: new mongoose.Types.ObjectId((req as any).userId) 
    });

    res.json({
      success: true,
      points: inventory?.points || 0,
      totalEarned: inventory?.totalEarned || 0,
      totalSpent: inventory?.totalSpent || 0
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId((req as any).userId)
    })
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({ success: true, history: transactions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getShopStats = async (req: Request, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId((req as any).userId);
    const inventory = await UserInventory.findOne({ userId });

    const earnedPoints = await Transaction.aggregate([
      { $match: { userId, type: 'earn' } },
      { $group: { _id: '$referenceType', total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      stats: {
        currentPoints: inventory?.points || 0,
        totalEarned: inventory?.totalEarned || 0,
        totalSpent: inventory?.totalSpent || 0,
        breakdown: earnedPoints
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const awardPointsAction = async (req: Request, res: Response) => {
  try {
    const { action, referenceId } = req.body;
    const userId = (req as any).userId;

    if (!POINT_RULES[action as keyof typeof POINT_RULES]) {
      return res.status(400).json({ message: 'Invalid action for points' });
    }

    const result = await awardPoints(userId, action as keyof typeof POINT_RULES, referenceId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
