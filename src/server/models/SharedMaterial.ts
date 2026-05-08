import mongoose from 'mongoose';

const sharedMaterialSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  shareToken: { type: String, required: true, unique: true },
  originalUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  viewCount: { type: Number, default: 0 }
});

sharedMaterialSchema.index({ shareToken: 1 });
sharedMaterialSchema.index({ materialId: 1 });

export const SharedMaterial = mongoose.model('SharedMaterial', sharedMaterialSchema);
