import mongoose from 'mongoose';
import UserInventory from '../models/UserInventory';
import Transaction from '../models/Transaction';
import { User } from '../models/User';

export const POINT_RULES = {
  STUDY_SESSION_COMPLETE: 5,
  QUIZ_80_PLUS: 10,
  QUIZ_100: 15,
  STREAK_7: 25,
  STREAK_30: 50,
  STREAK_100: 100,
  SHARE_NOTE: 3,
  REFERRAL: 50,
  DAILY_ALL_TASKS: 15,
  FIRST_LOGIN_DAY: 2,
  MATERIAL_UPLOAD: 3,
  FLASHCARD_COMPLETE: 3
};

export async function awardPoints(
  userId: string, 
  action: keyof typeof POINT_RULES, 
  referenceId?: string
) {
  const points = POINT_RULES[action];
  
  // Using a simplified approach without transactions if the environment doesn't support replica sets
  // But let's try to keep it robust
  try {
    // 1. Update user inventory points
    const inventory = await UserInventory.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { 
        $inc: { points: points, totalEarned: points },
        $set: { updatedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    // 2. Sync with main User model aetherPoints (backwards compatibility)
    await User.findByIdAndUpdate(userId, {
      $inc: { aetherPoints: points }
    });

    // 3. Log transaction
    await Transaction.create({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'earn',
      amount: points,
      description: `Earned ${points} points for ${action.replace('_', ' ')}`,
      referenceId: referenceId,
      referenceType: action.toLowerCase()
    });

    return { success: true, pointsAwarded: points, newTotal: inventory.points };
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
}

export async function spendPoints(
  userId: string, 
  amount: number, 
  itemId: string,
  description: string
) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const inventory = await UserInventory.findOne({ userId: userOid });
  const currentPoints = inventory?.points || 0;

  if (currentPoints < amount) {
    throw new Error('Insufficient points');
  }

  const updatedInventory = await UserInventory.findOneAndUpdate(
    { userId: userOid },
    { 
      $inc: { points: -amount, totalSpent: amount },
      $set: { updatedAt: new Date() }
    },
    { new: true }
  );

  // Sync with User model
  await User.findByIdAndUpdate(userId, {
    $inc: { aetherPoints: -amount }
  });

  await Transaction.create({
    userId: userOid,
    type: 'spend',
    amount: -amount,
    description: description,
    referenceId: itemId,
    referenceType: 'purchase'
  });

  return { success: true, remainingPoints: updatedInventory?.points || 0 };
}
