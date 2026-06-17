import mongoose from 'mongoose';
import { User } from '../models/User';
import UserInventory from '../models/UserInventory';

export async function applyShopItem(userId: string, item: any) {
  const userOid = new mongoose.Types.ObjectId(userId);
  
  switch (item.category) {
    case 'theme':
      await User.updateOne(
        { _id: userOid },
        { $set: { selectedTheme: item.metadata?.themeId || item.name } }
      );
      break;
    case 'voice':
      await User.updateOne(
        { _id: userOid },
        { $set: { selectedVoice: item.metadata?.voiceId || item.name } }
      );
      break;
    case 'utility':
      if (item.metadata?.type === 'streak-freeze') {
        await User.updateOne(
          { _id: userOid },
          { $inc: { freezeTokens: 1 } }
        );
      }
      break;
    case 'badge':
      await User.updateOne(
        { _id: userOid },
        { $push: { achievements: { name: item.name, earnedAt: new Date() } } }
      );
      break;
  }
}

export async function useUtility(userId: string, itemId: string) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const itemOid = new mongoose.Types.ObjectId(itemId);
  
  const inventory = await UserInventory.findOne({ userId: userOid });
  const item = inventory?.items.find(i => i.itemId.equals(itemOid));
  
  if (!item || item.used) {
    throw new Error('Item not available or already used');
  }

  // Mark as used
  await UserInventory.updateOne(
    { 
      userId: userOid,
      'items.itemId': itemOid
    },
    { 
      $set: { 'items.$.used': true, 'items.$.usedAt': new Date() }
    }
  );

  // Apply utility effect if any specific logic needed
  // For Streak Freeze, usually we just consume a token when daily check fails
}
