import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem {
  itemId: mongoose.Types.ObjectId;
  purchasedAt: Date;
  expiresAt?: Date;
  used: boolean;
  metadata?: any;
}

export interface IUserInventory extends Document {
  userId: mongoose.Types.ObjectId;
  items: IInventoryItem[];
  points: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserInventorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    itemId: { type: Schema.Types.ObjectId, ref: 'ShopItem' },
    purchasedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    used: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed }
  }],
  points: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IUserInventory>('UserInventory', UserInventorySchema);
