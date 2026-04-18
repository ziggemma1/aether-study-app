import { GoogleGenAI, Type } from "@google/genai";
import { generateDetailedNotes, analyzeStudyMaterialWithOpenRouter, generateTopicSection, generateStudyPlanWithOpenRouter } from "./openRouterService.js";
import { NoteSection, PlanSession } from "../types.js";

// Lazy initialization to prevent startup crashes and provide better error messages
let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ MISSING API KEY: GEMINI_API_KEY environment variable is not set.");
      console.error("👉 If you are on Vercel, add GEMINI_API_KEY to your Project Settings > Environment Variables.");
      throw new Error("GEMINI_API_KEY is not configured on the server. Please check your environment variables.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, backoff = 1000): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i < retries - 1) {
        console.warn(`Gemini API error. Retrying in ${backoff}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(backoff);
        backoff *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

export interface StudyMaterialAnalysis {
  summary: string;
  keyTopics: string[];
  realLifeApplications: string[];
  detailedNotes: string;
  noteSections?: (NoteSection & { imageUrl?: string })[];
  suggestedQuizQuestions: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export const generateVisualAid = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Create a clear, professional, and educational visual representation for the following concept: ${prompt}. 
            If it's mathematical, show formulas. If it's scientific, show a diagram. 
            The image should be clean and helpful for a student.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        },
      },
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return '';
  } catch (error) {
    console.error('Visual Aid Generation Error:', error);
    return '';
  }
};

export const generateGeminiTopicSection = async (content: string, title: string, topic: string, language: string = "English (US)"): Promise<NoteSection> => {
  const ai = getAiClient();
  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create an EXTREMELY detailed study chapter for the topic "${topic}" based on the following material: ${title}.
    
    Material Context: ${content.substring(0, 10000)}`,
    config: {
      systemInstruction: `You are an elite academic professor. Write a massive, deep-dive chapter for this specific topic. 
      STRICT REQUIREMENT: All generated text MUST be in ${langPrompt}.
      Use simple, easy to understand words (Explain like I'm 15). Refine the text and focus on readability.
      Target a volume about 400% larger than a basic summary for this topic.
      Include 3 detailed examples, sub-headings, and professional explanations of first principles.
      Return a JSON object with: { "heading", "content", "imagePrompt" }.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          content: { type: Type.STRING },
          imagePrompt: { type: Type.STRING }
        },
        required: ["heading", "content", "imagePrompt"]
      }
    }
  }));

  const text = response.text;
  if (!text) throw new Error("Gemini fallback section failed");
  return JSON.parse(text);
};

export const analyzeStudyMaterial = async (content: string, title: string = "Material", language: string = "English (US)"): Promise<StudyMaterialAnalysis> => {
  try {
    let initialResult: any;
    let usedFallback = false;
    const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

    try {
      const ai = getAiClient();
      // Step 1: Get basic analysis and key topics from Gemini
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Material Title: ${title}\n\nMaterial Content:\n${content.substring(0, 15000)}`,
        config: {
          systemInstruction: `You are an expert academic analyzer. Analyze the provided study material and return a JSON object.
          STRICT REQUIREMENT: All generated text MUST be in ${langPrompt}.
          Use simple, clear, and easy to understand language (Explain like I'm 15).
          
          Return:
          1. summary: A comprehensive summary.
          2. keyTopics: An array of important topics (aim for 5-8 topics).
          3. realLifeApplications: An array of practical examples.
          4. simpleDetailedNotes: Create standard, accurately detailed notes using Markdown. This should be about 400% longer than the summary.
          5. suggestedQuizQuestions: An array of 5 multiple-choice questions with 'question', 'options' (array of 4), 'correctAnswer' (0-3), and 'explanation'.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
              realLifeApplications: { type: Type.ARRAY, items: { type: Type.STRING } },
              simpleDetailedNotes: { type: Type.STRING },
              suggestedQuizQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.NUMBER },
                    explanation: { type: Type.STRING }
                  },
                  required: ["question", "options", "correctAnswer", "explanation"]
                }
              }
            },
            required: ["summary", "keyTopics", "realLifeApplications", "simpleDetailedNotes", "suggestedQuizQuestions"]
          }
        }
      }));

      const text = response.text;
      if (!text) throw new Error("Gemini initial analysis failed");
      initialResult = JSON.parse(text);
    } catch (error: any) {
      console.warn('Gemini initial analysis failed or credit exhausted. Falling back to OpenRouter...', error.message);
      try {
        initialResult = await analyzeStudyMaterialWithOpenRouter(content, title);
        usedFallback = true;
      } catch (fallbackError: any) {
        console.error('Both Gemini and OpenRouter analysis failed:', fallbackError.message);
        throw error; // Rethrow original error if fallback also fails
      }
    }

    const result: StudyMaterialAnalysis = {
      ...initialResult,
      detailedNotes: initialResult.simpleDetailedNotes,
      noteSections: []
    };

    // Step 2: Generate massive structured detailed notes (Iterative)
    console.log('Generating massive structured notes based on key topics:', result.keyTopics);
    let openRouterResult: any;
    
    try {
      openRouterResult = await generateDetailedNotes(content, title, result.keyTopics);
    } catch (err) {
      console.warn('Initial OpenRouter batch fail:', err);
      openRouterResult = null;
    }
    
    // Fallback to Gemini iterative if OpenRouter fails
    if (!openRouterResult || openRouterResult.noteSections.length === 0) {
      console.warn('OpenRouter failed. Falling back to Gemini iterative generation...');
      const noteSections: NoteSection[] = [];
      for (const topic of result.keyTopics) {
        try {
          const section = await generateGeminiTopicSection(content, title, topic, language);
          noteSections.push(section);
        } catch (err: any) {
          console.error(`Gemini fallback failed for topic ${topic}`, err.message);
          // If Gemini fails, we could try OpenRouter for JUST this topic as a last resort
          try {
            console.log(`Last resort: Trying OpenRouter for section ${topic}`);
            const section = await generateTopicSection(content, title, topic);
            noteSections.push(section);
          } catch (lastResortErr) {
             console.error(`Last resort failed for ${topic}`);
          }
        }
      }
      openRouterResult = {
        detailedNotes: noteSections.map(s => `# ${s.heading}\n\n${s.content}`).join('\n\n'),
        noteSections: noteSections
      };
    }

    if (openRouterResult && openRouterResult.noteSections && openRouterResult.noteSections.length > 0) {
      result.detailedNotes = openRouterResult.detailedNotes;
      
      // Step 3: Generate visual aids in parallel
      const sectionsWithImages = await Promise.all(
        openRouterResult.noteSections.map(async (section) => {
          try {
            const imageUrl = await generateVisualAid(section.imagePrompt);
            return { ...section, imageUrl };
          } catch (err) {
            return { ...section, imageUrl: '' };
          }
        })
      );
      
      result.noteSections = sectionsWithImages;
    }

    return result;
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    throw error;
  }
};

export const generateStudyPlan = async (
  materials: any[], 
  startDate: string, 
  duration: number, 
  goal: string, 
  complexity: string, 
  commitment: string,
  language: string = "English (US)"
): Promise<PlanSession[]> => {
  try {
    const ai = getAiClient();
    const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';
    const materialContext = materials.map(m => `Title: ${m.title}\nKey Topics: ${(m.keyTopics || []).join(', ')}`).join('\n\n');

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a personalized study plan in ${langPrompt}.
      
      STUDENT PARAMETERS:
      - Learning Goal: ${goal} (This should dictate the strategy: e.g., 'Exam Prep' focuses on practice, 'Deep Dive' on theory, 'Quick Review' on key facts)
      - Complexity Level: ${complexity} (Adjust the technical depth and terminology accordingly)
      - Daily Commitment: ${commitment} (The amount of material and number of tasks per day MUST realistically fit within this time)
      - Total Duration: ${duration} days
      - Start Date: ${startDate}
      
      MATERIAL CONTEXT:
      ${materialContext}`,
      config: {
        systemInstruction: `You are a world-class academic advisor. Create a structured study plan as a JSON array of daily sessions.
        STRICT REQUIREMENT: All generated text MUST be in ${langPrompt}.
        
        STRATEGY REQUIREMENTS:
        1. ADAPTIVE DEPTH: If complexity is 'Advanced', include academic deep-dives. If 'Beginner', focus on foundations.
        2. TIME-BOXING: If commitment is '30m', provide concise, high-impact tasks. If '4h+', provide comprehensive, multi-step active learning exercises.
        3. GOAL ORIENTATION: 
           - 'Exam Prep': Include practice questions, flashcard creation, and mock timed tests.
           - 'Deep Dive': Focus on first principles, edge cases, and cross-material synthesis.
           - 'Quick Review': Focus on lightning summaries, cheat sheets, and high-level concepts.
        
        Format accurately as a JSON array of objects.
        
        Session Schema:
        - day: number
        - date: string (e.g. "Mon, Apr 20")
        - topic: string
        - duration: string (match user's commitment)
        - completed: false
        - dailySummary: string (2-3 sentences reflecting the specific goal)
        - detailedNotes: string (Extensive Markdown including: Objectives, Task List, Reading Assignments, and a "Pro-Tip")`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.NUMBER },
              date: { type: Type.STRING },
              topic: { type: Type.STRING },
              duration: { type: Type.STRING },
              completed: { type: Type.BOOLEAN },
              dailySummary: { type: Type.STRING },
              detailedNotes: { type: Type.STRING }
            },
            required: ["day", "date", "topic", "duration", "completed", "dailySummary", "detailedNotes"]
          }
        }
      }
    }));

    const text = response.text;
    if (!text) throw new Error("Gemini study plan generation failed");
    return JSON.parse(text);
  } catch (error: any) {
    console.warn('Gemini study plan failed. Falling back to OpenRouter...', error.message);
    try {
      return await generateStudyPlanWithOpenRouter(materials, startDate, duration, goal, complexity, commitment);
    } catch (fallbackError: any) {
      console.error('Both AI services failed for study plan:', fallbackError.message);
      throw error;
    }
  }
};
