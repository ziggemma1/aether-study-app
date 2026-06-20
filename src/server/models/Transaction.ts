import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'earn' | 'spend' | 'refund' | 'bonus';
  amount: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['earn', 'spend', 'refund', 'bonus'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  referenceId: { type: String },
  referenceType: { type: String }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
