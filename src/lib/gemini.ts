import { GoogleGenAI, Type } from "@google/genai";
import { NoteSection } from "../types";

// Vite automatically injects GEMINI_API_KEY into the client build in this environment
// We use a fallback to empty string to prevent crashes, but it should be available.
const apiKey = (process.env.GEMINI_API_KEY as string) || "";
const ai = new GoogleGenAI({ apiKey });

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, backoff = 1000): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i < retries - 1 && (error.message?.includes('429') || error.message?.includes('500') || error.message?.includes('retry'))) {
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

export const generateVisualAidOnClient = async (prompt: string): Promise<string> => {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY missing on client. Visual aid generation skipped.");
    return '';
  }
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Create a professional educational diagram for: ${prompt}` }],
      },
      config: {
        imageConfig: { aspectRatio: "16:9" },
      },
    }));

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return '';
  } catch (error) {
    console.error('Visual Aid Generation Error (Client):', error);
    return '';
  }
};

export const analyzeStudyMaterialOnClient = async (content: string, title: string = "Material"): Promise<StudyMaterialAnalysis> => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the client. Please ensure you have added it to your environment.");
  }

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Material Title: ${title}\n\nMaterial Content:\n${content.substring(0, 15000)}`,
    config: {
      systemInstruction: `Analyze the material and return JSON:
      1. summary (comprehensive)
      2. keyTopics (5-8 strings)
      3. realLifeApplications (3-5 strings)
      4. suggestedQuizQuestions (5 MCQs)`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          realLifeApplications: { type: Type.ARRAY, items: { type: Type.STRING } },
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
        required: ["summary", "keyTopics", "realLifeApplications", "suggestedQuizQuestions"]
      }
    }
  }));

  const text = response.text;
  if (!text) throw new Error("Gemini analysis failed on client");
  const result = JSON.parse(text);
  
  return {
    ...result,
    detailedNotes: '', // Will be filled by backend/OpenRouter
    noteSections: []
  };
};
