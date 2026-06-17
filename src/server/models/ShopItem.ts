import mongoose, { Schema, Document } from 'mongoose';

export interface IShopItem extends Document {
  name: string;
  description: string;
  category: 'theme' | 'voice' | 'utility' | 'badge' | 'cosmetic';
  price: number;
  type: 'one-time' | 'permanent' | 'consumable';
  stock?: number;
  imageUrl?: string;
  icon?: string;
  isActive: boolean;
  metadata?: any;
  discount?: number;
  discountEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShopItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['theme', 'voice', 'utility', 'badge', 'cosmetic'], required: true },
  price: { type: Number, required: true },
  type: { type: String, enum: ['one-time', 'permanent', 'consumable'], required: true },
  stock: { type: Number },
  imageUrl: { type: String },
  icon: { type: String },
  isActive: { type: Boolean, default: true },
  metadata: { type: Schema.Types.Mixed },
  discount: { type: Number },
  discountEndsAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IShopItem>('ShopItem', ShopItemSchema);
