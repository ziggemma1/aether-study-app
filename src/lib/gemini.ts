import { GoogleGenAI, Type } from "@google/genai";
import { NoteSection } from "../types";
import { 
  analyzeStudyMaterialWithOpenRouter, 
  generateFlashcardsWithOpenRouter, 
  generateQuizQuestionsWithOpenRouter, 
  chatWithTutorWithOpenRouter,
  generateTopicSection
} from "../services/openRouterService";

// Get API Key safely from either process.env (Vite define) or import.meta.env
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return (import.meta.env?.VITE_GEMINI_API_KEY as string) || "";
};

const apiKey = getApiKey();
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
  const models = ['gemini-3-flash-preview', 'gemini-flash-latest'];
  
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
  const models = ['gemini-3-flash-preview', 'gemini-flash-latest'];
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
          5. suggestedQuizQuestions (15-20 challenging MCQs)
          6. recommendedFlashcards (15 key term flashcards)`,
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
              },
              recommendedFlashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ["question", "answer"]
                }
              }
            },
            required: ["summary", "keyTopics", "realLifeApplications", "simpleDetailedNotes", "suggestedQuizQuestions", "recommendedFlashcards"]
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

  // Fallback to OpenRouter
  try {
    console.log("Gemini failed, falling back to OpenRouter for analysis...");
    const result = await analyzeStudyMaterialWithOpenRouter(content, title);
    return {
      ...result,
      detailedNotes: result.simpleDetailedNotes,
      noteSections: []
    };
  } catch (orcError) {
    console.error("OpenRouter fallback also failed for analysis:", orcError);
  }

  throw lastError || new Error("All AI models (Gemini & OpenRouter) failed for analysis");
};

export const simplifyContentELI5 = async (content: string, language: string = "English (US)"): Promise<string> => {
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';
  
  const models = ['gemini-3-flash-preview', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model,
        contents: `Please explain the following text as if I am 5 years old. Make it extremely simple, use analogies, and keep it brief.\n\nText to explain:\n${content}`,
        config: {
          systemInstruction: `Explain like I'm 5 (ELI5). STRICT REQUIREMENT: Output MUST be in ${langPrompt}. Respond with only the simplified markdown text.`
        }
      }));
      
      if (response.text) return response.text;
    } catch (error) {
      console.warn(`Model ${model} failed for ELI5 processing:`, error);
      lastError = error;
    }
  }
  throw lastError || new Error("All Gemini models failed for ELI5 processing");
};

export const chatWithTutorOnClient = async (materialTitle: string, materialContent: string, chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[], userMessage: string, language: string = "English (US)"): Promise<string> => {
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  const models = ['gemini-3-flash-preview', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of models) {
    try {
      const chatModel = ai.models; // we can use generateContent with history
      const systemInstruction = `You are a helpful Interactive AI Tutor. You know exactly what the user is studying. Material Title: ${materialTitle}. Here is the material content to refer to: ${materialContent.substring(0, 10000)}. STRICT REQUIREMENT: Output MUST be in ${langPrompt}. Be conversational, concise, and educational.`;

      const contents = [
        ...chatHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ] as any[];

      const response = await withRetry(() => chatModel.generateContent({
        model,
        contents,
        config: { systemInstruction }
      }));
      
      const text = response.text;
      if (!text) throw new Error("Tutor chat failed");
      return text;
    } catch (error) {
      console.warn(`Model ${model} failed for tutor chat:`, error);
      lastError = error;
    }
  }

  // Fallback to OpenRouter
  try {
    console.log("Gemini failed, falling back to OpenRouter for tutor chat...");
    return await chatWithTutorWithOpenRouter(materialTitle, materialContent, chatHistory, userMessage, language);
  } catch (orcError) {
    console.error("OpenRouter fallback also failed for tutor chat:", orcError);
  }

  throw lastError || new Error("All AI models (Gemini & OpenRouter) failed for tutor chat");
};

export const generateFlashcardsOnClient = async (
  content: string, 
  language: string = "English (US)",
  count: number = 10
): Promise<{ question: string; answer: string }[]> => {
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  const models = ['gemini-3-flash-preview', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model,
        contents: `Extract exactly ${count} important key terms and concepts from this material and create flashcards.\n\nMaterial:\n${content.substring(0, 10000)}`,
        config: {
          systemInstruction: `You are an expert tutor. Create exactly ${count} flashcards. Output exactly a JSON array of objects with "question" and "answer" properties. STRICT REQUIREMENT: Output MUST be in ${langPrompt}.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          }
        }
      }));
      
      let text = response.text;
      if (!text) throw new Error("Gemini flashcards failed: No text returned");
      
      // Clean up markdown block if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(text);
    } catch (error) {
      console.warn(`Model ${model} failed for flashcards:`, error);
      lastError = error;
    }
  }

  // Fallback to OpenRouter
  try {
    console.log("Gemini failed, falling back to OpenRouter for flashcards...");
    return await generateFlashcardsWithOpenRouter(content, language, count);
  } catch (orcError) {
    console.error("OpenRouter fallback also failed for flashcards:", orcError);
  }

  throw lastError || new Error("All AI models (Gemini & OpenRouter) failed for flashcards processing");
};

export const generateQuizQuestionsOnClient = async (
  content: string,
  language: string = "English (US)",
  count: number = 10,
  difficulty: "Easy" | "Medium" | "Hard" = "Medium",
  complexity: "Basic" | "Standard" | "Comprehensive" = "Standard"
): Promise<{ question: string; options: string[]; correctAnswer: number; explanation: string }[]> => {
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  const models = ['gemini-3-flash-preview', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model,
        contents: `Generate exactly ${count} ${difficulty} difficulty level quiz questions with ${complexity} complexity based on this material.\n\nMaterial:\n${content.substring(0, 10000)}`,
        config: {
          systemInstruction: `You are an expert examiner. Create exactly ${count} multiple choice questions. 
          Difficulty: ${difficulty}. 
          Complexity: ${complexity}.
          STRICT REQUIREMENT: All content MUST be in ${langPrompt}.
          Return exactly a JSON array of objects with: question, options (array of 4), correctAnswer (0-3 index), and explanation.`,
          responseMimeType: "application/json",
          responseSchema: {
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
        }
      }));
      
      let text = response.text;
      if (!text) throw new Error("Gemini quiz generation failed: No text returned");
      
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      console.warn(`Model ${model} failed for quiz generation:`, error);
      lastError = error;
    }
  }

  // Fallback to OpenRouter
  try {
    console.log("Gemini failed, falling back to OpenRouter for quiz generation...");
    return await generateQuizQuestionsWithOpenRouter(content, language, count, difficulty, complexity);
  } catch (orcError) {
    console.error("OpenRouter fallback also failed for quiz generation:", orcError);
  }

  throw lastError || new Error("All AI models (Gemini & OpenRouter) failed for quiz generation");
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

  // Fallback to OpenRouter
  try {
    console.log("Gemini failed, falling back to OpenRouter for topic generation...");
    return await generateTopicSection(content, title, topic);
  } catch (orcError) {
    console.error("OpenRouter fallback also failed for topic generation:", orcError);
  }

  throw lastError || new Error("All AI models (Gemini & OpenRouter) failed for topic generation");
};
