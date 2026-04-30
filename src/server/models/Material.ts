import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  interval: { type: Number, default: 0 },
  repetitions: { type: Number, default: 0 },
  easeFactor: { type: Number, default: 2.5 },
  nextReview: { type: Date, default: Date.now },
});

const noteSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
});

const materialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['Document', 'Link', 'Video', 'Note'], default: 'Note' },
  summary: { type: String, default: '' },
  content: { type: String, default: '' },
  keyTopics: { type: [String], default: [] },
  realLifeApplications: { type: [String], default: [] },
  detailedNotes: { type: String, default: '' },
  noteSections: [noteSectionSchema],
  visualAidUrl: { type: String, default: '' },
  suggestedQuizQuestions: [{
    question: String,
    options: [String],
    correctAnswer: String,
    explanation: String
  }],
  flashcards: [flashcardSchema],
  isPublic: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  authorName: { type: String, default: '' },
}, { timestamps: true });

export const Material = mongoose.model('Material', materialSchema);
