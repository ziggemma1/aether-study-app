import { Request, Response } from 'express';
import { 
  analyzeStudyMaterial as analyzeStudyMaterialSvc, 
  generateFlashcards as generateFlashcardsSvc, 
  generateQuiz as generateQuizSvc, 
  chatWithTutor as chatWithTutorSvc, 
  generateStudyPlan as generateStudyPlanSvc,
  generateDetailedNotes as generateDetailedNotesSvc,
  generateSpeech as generateSpeechSvc,
  generateAcademicMegaNotes as generateAcademicMegaNotesSvc
} from '../services/aiService.js';
import { YoutubeTranscript } from 'youtube-transcript';

export const getYoutubeTranscript = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    console.log(`Fetching YouTube transcript for: ${url}`);
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    
    // Combine texts
    const content = transcript.map(t => t.text).join(' ');
    res.json({ content });
  } catch (error: any) {
    console.error('YouTube transcript error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch YouTube transcript. Ensure the video has closed captions enabled.',
      error: error.message 
    });
  }
};

export const analyzeMaterial = async (req: Request, res: Response) => {
  try {
    const { content, title, language } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    console.log(`Server-side analysis starting for: ${title}`);
    const analysis = await analyzeStudyMaterialSvc(content, title, language);
    res.json(analysis);
  } catch (error: any) {
    console.error('Server-side analysis error:', error);
    res.status(500).json({ 
      message: 'Analysis failed on server', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

import { Material as MaterialModel } from '../models/Material.js';

const generateMockChapters = (title: string, content?: string) => {
  return {
    structuredNote: {
      title: title || "Study Material",
      learningObjectives: ["Understand main concept", "Identify key terms"],
      keyTerms: [{ term: "Topic", definition: "Main subject of study", memoryTip: "Focus on the basics" }],
      sections: [{ 
        heading: "Overview", 
        subsections: [{ subheading: "Introduction", content: (content || "Sample content").substring(0, 1000), keywords: ["study", "notes"] }] 
      }],
      summary: ["Material processed with basic logic due to AI unavailability."],
      activeRecallQuestions: ["What is the main idea of this material?"],
      mnemonic: "Read And Remember",
      relatedTopics: ["Context", "Background"]
    },
    detailedNotes: (content || "Sample content").substring(0, 2000)
  };
};

const mapStructuredNoteToNoteSections = (note: any): any[] => {
  if (!note) return [];

  // Check for new keyConcepts first
  if (note.keyConcepts && note.keyConcepts.length > 0) {
    return note.keyConcepts.map((concept: any, idx: number) => {
      const isCornell = idx % 2 === 0;
      const style = isCornell ? 'Cornell' : 'Feynman';
      
      let contentMarkdown = "";
      if (isCornell) {
        contentMarkdown = `### 📑 CORNELL STUDY MODULE: ${concept.name}
 
#### 🎯 Central Focus
* **Concept to Master:** ${concept.name}
* **Target recall:** Master definitions, key mechanics, and practical applications.
 
#### 🔍 CUE COLUMN (Active Recall Prompts)
* *Prompt 1:* Define ${concept.name} in your own words.
* *Prompt 2:* What are the key elements and conditions required for ${concept.name}?
* *Prompt 3:* How does the example of "${concept.example}" illustrate this concept?
 
#### 📝 HIGH-DENSITY LECTURE NOTES (Textbook Style)
##### Definition
${concept.definition}
 
##### Key Points
${(concept.keyPoints || []).map((kp: string) => `- ${kp}`).join('\n')}
 
${concept.deepDive ? `##### Deep Dive\n${concept.deepDive}` : ''}
 
#### 🛠️ PRACTICAL SCENARIO IN ACTION
* **Context:** Understanding the real-world application of ${concept.name}.
* **Application:** ${concept.example}
* **Observed Outcome:** Demonstrates direct concept utility.
 
#### 📑 SYNTHESISED SUMMARY
* **Memory Tip:** ${concept.memoryTip}
* Review and answer each cue column query to evaluate exam readiness.`;
      } else {
        contentMarkdown = `### 🧠 FEYNMAN MASTERCLASS: ${concept.name}
 
#### 🎯 Conceptual Anchor
* **Concept:** ${concept.name} (Simplified)
* **Pedagogical aim:** Deconstructing high-complexity abstractions into elegant simplicity.
 
#### 👶 ELI5 (Explain Like I'm Five)
${concept.definition} (Simplified analogy: ${concept.example})
 
#### ⚙️ MECHANICS DECONSTRUCTION (Deep, Rigorous Explanation)
##### Details
${(concept.keyPoints || []).map((kp: string) => `- ${kp}`).join('\n')}
 
${concept.deepDive ? `##### Advanced Context\n${concept.deepDive}` : ''}
 
#### 💡 DEEP ANALOGY & GAP IDENTIFICATION (Pinpoint Gaps)
* **The Analogy:** ${concept.example}
* **Memory Cue:** ${concept.memoryTip}
 
#### 🛠️ COMPREHENSIVE SCENARIO IN ACTION
* **Scenario:** Application in real-world scenarios.
* **Explanation:** How this manifests in actual systems or nature.`;
      }

      return {
        heading: concept.name,
        content: contentMarkdown,
        noteStyle: style,
        conceptAnalyzed: `Deconstructing ${concept.name}`
      };
    });
  }

  // Fallback for legacy structured notes (sections-based)
  if (note.sections && note.sections.length > 0) {
    return note.sections.map((sec: any, idx: number) => {
      const isCornell = idx % 2 === 0;
      const style = isCornell ? 'Cornell' : 'Feynman';
      
      let contentMarkdown = "";
      if (isCornell) {
        contentMarkdown = `### 📑 CORNELL STUDY MODULE: ${sec.heading}

#### 🎯 Central Focus
* **Concept to Master:** ${sec.heading}
* **Target recall:** Master basic rules, definitions, and direct application vectors.

#### 🔍 CUE COLUMN (Active Recall Prompts)
${(sec.subsections || []).map((sub: any, sIdx: number) => `* *Prompt ${sIdx + 1}:* What is the primary significance of ${sub.subheading}?`).join('\n')}

#### 📝 HIGH-DENSITY LECTURE NOTES (Textbook Style)
${(sec.subsections || []).map((sub: any) => `##### ${sub.subheading}
${sub.content}
${sub.memoryTip ? `\n* Memory Tip: ${sub.memoryTip}` : ''}`).join('\n\n')}

#### 🛠️ PRACTICAL SCENARIO IN ACTION
* **Context:** Implementing the core concepts of ${sec.heading} in a realistic setup.
* **Application:** Solving common procedural tasks by applying technical rules and relationships.
* **Observed Outcome:** Successful mastery of ${sec.heading}, showing direct structural efficiency.

#### 📑 SYNTHESISED SUMMARY
* Establish a systematic understanding of ${sec.heading}.
* Review and answer each cue column query to evaluate exam readiness.`;
      } else {
        contentMarkdown = `### 🧠 FEYNMAN MASTERCLASS: ${sec.heading}

#### 🎯 Conceptual Anchor
* **Concept:** ${sec.heading} (Simplified)
* **Pedagogical aim:** Deconstructing high-complexity abstractions into elegant simplicity.

#### 👶 ELI5 (Explain Like I'm Five)
Let's make this simple! Imagine this concept is like a smart organizer. Instead of dumping everything in a drawer, you label each compartment so that you or anyone else can find what is needed instantly.

#### ⚙️ MECHANICS DECONSTRUCTION (Deep, Rigorous Explanation)
${(sec.subsections || []).map((sub: any) => `##### ${sub.subheading}
${sub.content}
${sub.quickCheck ? `\n* Quick Check drill: ${sub.quickCheck}` : ''}`).join('\n\n')}

#### 💡 DEEP ANALOGY & GAP IDENTIFICATION (Pinpoint Gaps)
* **The Analogy:** Categorizing items into labelled containers for systematic and frictionless scaling.
* **Typical Student Blindspot (Misconception):** Relying on general reading familiarity of ${sec.heading} rather than practicing active definitions.
* **The Correction:** Be able to explain how the sections connect together in under three sentences without referring to notes.

#### 🛠️ COMPREHENSIVE SCENARIO IN ACTION
* **Scenario:** A team must coordinate and integrate resources based on the logic of ${sec.heading}.
* **Mechanic Breakdown:** Breaking down each subsection target, translating complex rules into straightforward actions.`;
      }

      return {
        heading: sec.heading,
        content: contentMarkdown,
        noteStyle: style,
        conceptAnalyzed: `Deconstructing ${sec.heading}`
      };
    });
  }

  return [];
};

export const generateChapters = async (req: Request, res: Response) => {
  try {
    const { content, title, materialId, forceDemo = false } = req.body;
    
    // Check if we should use mock fallback (no keys and not production, or explicit demo)
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENROUTER_API_KEY;
    const useMock = forceDemo || (!apiKey && process.env.NODE_ENV !== 'production');

    if (useMock) {
      console.log('📝 Using demo/mock chapters (forceDemo or no API key)');
      const mockResult = generateMockChapters(title, content);
      const initialNoteSections = mapStructuredNoteToNoteSections(mockResult.structuredNote);
      
      if (materialId) {
        await MaterialModel.findByIdAndUpdate(materialId, {
          detailedNotes: mockResult.detailedNotes,
          structuredNote: mockResult.structuredNote,
          noteSections: initialNoteSections,
          generationStatus: 'completed'
        });
      }
      return res.json({ ...mockResult, noteSections: initialNoteSections });
    }

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    console.log(`Backend generation starting for: ${title} (Material ID: ${materialId || 'none'})`);
    
    try {
      // Always call generation service
      const notesResult = await generateDetailedNotesSvc(content, title);
      
      if (!notesResult || (!notesResult.detailedNotes && !notesResult.structuredNote)) {
        throw new Error("Generation returned empty results");
      }

      const initialNoteSections = mapStructuredNoteToNoteSections(notesResult.structuredNote);

      if (materialId) {
        console.log(`[AI-Sync] Updating material ${materialId} after generation...`);
        const updated = await MaterialModel.findByIdAndUpdate(materialId, {
          detailedNotes: notesResult.detailedNotes,
          structuredNote: notesResult.structuredNote,
          noteSections: initialNoteSections,
          generationStatus: 'completed'
        }, { new: true });
        
        if (!updated) {
          throw new Error(`Failed to find material ${materialId} to update`);
        }
        return res.json(updated);
      }

      res.json({ ...notesResult, noteSections: initialNoteSections });
    } catch (svcError: any) {
      console.error('AI Service failed, falling back to mock:', svcError.message);
      const mockFallback = generateMockChapters(title, content);
      const initialNoteSections = mapStructuredNoteToNoteSections(mockFallback.structuredNote);
      if (materialId) {
        await MaterialModel.findByIdAndUpdate(materialId, {
          detailedNotes: mockFallback.detailedNotes,
          structuredNote: mockFallback.structuredNote,
          noteSections: initialNoteSections,
          generationStatus: 'completed'
        });
      }
      return res.json({ ...mockFallback, noteSections: initialNoteSections, warning: 'AI service failed, used fallback' });
    }
  } catch (error: any) {
    console.error('Backend generation error:', error);
    res.status(500).json({ 
      message: 'Generation failed on server', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const generateDeepDive = async (req: Request, res: Response) => {
  try {
    const { content, title, materialId } = req.body;
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    console.log(`[Deep-Dive-Ctrl] Starting intense academic generation for: ${title} (Material ID: ${materialId || 'none'})`);
    
    const megaNotes = await generateAcademicMegaNotesSvc(content, title);
    
    if (materialId) {
      console.log(`[Deep-Dive-Ctrl] Updating material ${materialId} noteSections with 8+ custom pages...`);
      const updated = await MaterialModel.findByIdAndUpdate(materialId, {
        noteSections: megaNotes,
        generationStatus: 'completed'
      }, { new: true });
      return res.json(updated);
    }
    
    res.json({ noteSections: megaNotes });
  } catch (error: any) {
    console.error('[Deep-Dive-Ctrl] Error during intensive academic deep dive generation:', error);
    res.status(500).json({ 
      message: 'High-impact academic deep dive failed on server', 
      error: error.message
    });
  }
};

export const generateFlashcards = async (req: Request, res: Response) => {
  try {
    const { content, language, count } = req.body;
    const result = await generateFlashcardsSvc(content, language, count);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Flashcard generation failed', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const generateQuiz = async (req: Request, res: Response) => {
  try {
    const { content, language, count, difficulty, complexity } = req.body;
    const result = await generateQuizSvc(content, language, count, difficulty, complexity);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Quiz generation failed', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const chatWithTutor = async (req: Request, res: Response) => {
  try {
    const { materialTitle, materialContent, chatHistory, userMessage, language } = req.body;
    const result = await chatWithTutorSvc(materialTitle, materialContent, chatHistory, userMessage, language);
    res.json({ content: result });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Tutor chat failed', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const generatePlan = async (req: Request, res: Response) => {
  try {
    const { materials, startDate, duration, goal, complexity, commitment, language } = req.body;
    const result = await generateStudyPlanSvc(materials, startDate, duration, goal, complexity, commitment, language);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Plan generation failed', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};

export const generateSpeech = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    const audio = await generateSpeechSvc(text);
    if (!audio) {
      return res.status(500).json({ message: 'Speech generation failed' });
    }
    res.json({ audio });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Speech generation failed', 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};
