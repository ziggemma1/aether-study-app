import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  summary: { type: String },
  keyTopics: [{ type: String }],
  progress: { type: Number, default: 0 },
  content: { type: String },
  public: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('Material', materialSchema);
