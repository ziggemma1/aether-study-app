import { GoogleGenAI, Type } from "@google/genai";
import axios from 'axios';
import { NoteSection, PlanSession } from "../../types.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

let aiClient: GoogleGenAI | null = null;
const getAiClient = () => {
  if (!aiClient && GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
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
        await sleep(backoff);
        backoff *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

// OpenRouter Logic
const FREE_MODELS = [
  'google/gemini-1.5-flash',
  'qwen/qwen-2.5-7b-instruct',
  'microsoft/phi-3-mini-128k-instruct',
  'meta-llama/llama-3.2-3b-instruct'
];

export const callOpenRouter = async (messages: any[], useJson = false): Promise<any> => {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY missing');
  
  let lastError: any = null;
  for (const model of FREE_MODELS) {
    try {
      const payload: any = { 
        model, 
        messages, 
        temperature: useJson ? 0.1 : 0.3 
      };
      if (useJson) payload.response_format = { type: 'json_object' };

      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', payload, {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      if (response.data.choices?.[0]?.message?.content) {
        return response.data.choices[0].message;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI] Model ${model} failed: ${err.message}`);
    }
  }
  throw lastError || new Error('All models failed');
};

// Shared Logic exported for controllers
export const analyzeStudyMaterial = async (content: string, title: string, language: string = "English (US)") => {
  const ai = getAiClient();
  if (!ai) return analyzeWithOpenRouter(content, title);

  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ role: 'user', parts: [{ text: `Material Title: ${title}\n\nContent:\n${content.substring(0, 15000)}` }]}],
    config: {
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
      },
      systemInstruction: `Analyze the material. All generated text MUST be in ${langPrompt}. Return JSON.`
    }
  }));

  const text = response.text || "";
  if (!text) throw new Error("No response from AI");
  const result = JSON.parse(text);
  return { ...result, detailedNotes: result.simpleDetailedNotes };
};

const analyzeWithOpenRouter = async (content: string, title: string) => {
  const response = await callOpenRouter([
    {
      role: 'system',
      content: `Analyze the material and return JSON with summary, keyTopics, realLifeApplications, simpleDetailedNotes, and suggestedQuizQuestions.`
    },
    { role: 'user', content: `Title: ${title}\nContent: ${content.substring(0, 15000)}` }
  ], true);
  const result = JSON.parse(response.content.replace(/```json|```/g, ''));
  return { ...result, detailedNotes: result.simpleDetailedNotes };
};

export const generateFlashcards = async (content: string, language: string, count: number) => {
  const response = await callOpenRouter([
    { role: 'system', content: `Create ${count} flashcards in ${language}. Return JSON array with question/answer.` },
    { role: 'user', content: content.substring(0, 10000) }
  ], true);
  return JSON.parse(response.content.replace(/```json|```/g, ''));
};

export const generateQuiz = async (content: string, language: string, count: number, difficulty: string, complexity: string) => {
  const response = await callOpenRouter([
    { role: 'system', content: `Create ${count} ${difficulty} ${complexity} MCQs in ${language}. Return JSON array.` },
    { role: 'user', content: content.substring(0, 10000) }
  ], true);
  return JSON.parse(response.content.replace(/```json|```/g, ''));
};

export const chatWithTutor = async (materialTitle: string, materialContent: string, chatHistory: any[], userMessage: string, language: string) => {
  const messages = [
    { role: 'system', content: `You are a tutor for ${materialTitle}. Material: ${materialContent.substring(0, 5000)}. Language: ${language}` },
    ...chatHistory.map((h: any) => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts?.[0]?.text || h.content })),
    { role: 'user', content: userMessage }
  ];
  const response = await callOpenRouter(messages);
  return response.content;
};

export const generateStudyPlan = async (materials: any[], startDate: string, duration: number, goal: string, complexity: string, commitment: string, language: string) => {
  const materialContext = materials.map(m => `Title: ${m.title}`).join(', ');
  const response = await callOpenRouter([
    { role: 'system', content: `Create a study plan for ${duration} days starting ${startDate} for ${materialContext}. Goal: ${goal}. Language: ${language}. Return JSON array of sessions.` },
    { role: 'user', content: `Generate JSON study plan.` }
  ], true);
  return JSON.parse(response.content.replace(/```json|```/g, ''));
};

export const generateDetailedNotes = async (content: string, title: string) => {
  const response = await callOpenRouter([
    { role: 'system', content: `Create structured detailed study notes for ${title}. Markdown format.` },
    { role: 'user', content: content.substring(0, 15000) }
  ]);
  return { detailedNotes: response.content };
};
