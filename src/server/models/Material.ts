import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'youtube', 'article', 'audio', 'unified', 'image', 'video', 'note'], required: true },
  summary: { type: String },
  content: { type: String },
  keyTopics: [{ type: String }],
  realLifeApplications: [{ type: String }],
  suggestedQuizQuestions: [{
    question: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: Number },
    explanation: { type: String }
  }],
  flashcards: [{
    question: { type: String },
    answer: { type: String },
    interval: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    repetitions: { type: Number, default: 0 },
    nextReview: { type: Date, default: Date.now },
    masteryLevel: { type: Number, default: 0 } // 0-100
  }],
  detailedNotes: { type: String },
  noteSections: [{
    heading: { type: String },
    content: { type: String },
    imagePrompt: { type: String },
    imageUrl: { type: String }
  }],
  visualAidUrl: { type: String },
  structuredNote: {
    title: String,
    learningObjectives: [String],
    keyTerms: [{
      term: String,
      definition: String,
      memoryTip: String
    }],
    sections: [{
      heading: String,
      subsections: [{
        subheading: String,
        content: String,
        keywords: [String],
        memoryTip: String,
        quickCheck: String
      }]
    }],
    comparisonTable: {
      headers: [String],
      rows: [[String]],
      title: String
    },
    summary: [String],
    activeRecallQuestions: [String],
    mnemonic: String,
    relatedTopics: [String]
  },
  progress: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: false },
  generationStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  likes: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  authorName: { type: String },
  category: { type: String },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

materialSchema.index({ userId: 1, createdAt: -1 });

export const Material = mongoose.model('Material', materialSchema);
