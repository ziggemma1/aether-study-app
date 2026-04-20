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
      // Log more details for debugging
      const errorMsg = error.message || String(error);
      console.error(`Gemini Attempt ${i + 1} failed:`, errorMsg);

      if (i < retries - 1 && (errorMsg.includes('429') || errorMsg.includes('500') || errorMsg.includes('retry') || errorMsg.includes('limit'))) {
        console.warn(`Retrying in ${backoff}ms...`);
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
  
  // Try multiple image generations models if one fails
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  
  for (const model of models) {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model,
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
    } catch (error) {
      console.warn(`Model ${model} failed for visual aid, trying next...`);
    }
  }
  return '';
};

export const analyzeStudyMaterialOnClient = async (content: string, title: string = "Material", language: string = "English (US)"): Promise<StudyMaterialAnalysis> => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the client. Please ensure you have added it to your environment.");
  }

  // Determine actual language prompt
  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  // Try primary rapid flash model
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Analyzing material with model: ${model} in ${language}`);
      // Reduce content size slightly to avoid proxy buffer issues
      const contentLimit = 12000; 
      const response = await withRetry(() => ai.models.generateContent({
        model,
        contents: `Material Title: ${title}\n\nMaterial Content:\n${content.substring(0, contentLimit)}`,
        config: {
          systemInstruction: `Analyze the material and return JSON. 
          STRICT REQUIREMENT: All generated text MUST be in ${langPrompt}.
          Use simple, clear, and easy to understand language (Explain like I'm 15).
          
          Return:
          1. summary (comprehensive)
          2. keyTopics (5-8 strings)
          3. realLifeApplications (3-5 strings)
          4. simpleDetailedNotes: Create a standard accurately detailed note using Markdown. This should be about 400% longer than the summary. Use headings, lists, and examples.
          5. suggestedQuizQuestions (5 MCQs)`,
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
      if (!text) throw new Error("Gemini analysis failed on client: No text returned");
      const result = JSON.parse(text);
      
      return {
        ...result,
        detailedNotes: result.simpleDetailedNotes, 
        noteSections: []
      };
    } catch (error) {
      console.warn(`Model ${model} failed for analysis:`, error);
      lastError = error;
    }
  }
  throw lastError || new Error("All Gemini models failed for analysis");
};

export const generateTopicSectionOnClient = async (content: string, title: string, topic: string, language: string = "English (US)"): Promise<NoteSection> => {
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  
  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';
  
  const models = ['gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Generating topic section with model: ${model} in ${language}`);
      // Reduce content size slightly to avoid proxy buffer issues
      const contentLimit = 8000;
      const response = await withRetry(() => ai.models.generateContent({
        model,
        contents: `Create an EXTREMELY detailed study chapter for the topic "${topic}" based on the following material: ${title}.
        
        Material Context: ${content.substring(0, contentLimit)}`,
        config: {
          systemInstruction: `You are an elite academic professor. Write a massive, deep-dive chapter for this specific topic. 
          STRICT REQUIREMENT: All content MUST be written in ${langPrompt}.
          Use simple, easy to understand words. Refine the text and focus on readability.
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
      if (!text) throw new Error("Gemini fallback section failed: No text returned");
      return JSON.parse(text);
    } catch (error) {
      console.warn(`Model ${model} failed for topic generation:`, error);
      lastError = error;
    }
  }
  throw lastError || new Error("All Gemini models failed for topic generation");
};
