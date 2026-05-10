import { GoogleGenAI, Type } from "@google/genai";
import axios from 'axios';
import { NoteSection, PlanSession } from "../../types.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

console.log(`[AI-Service] Keys Status: Gemini=${GEMINI_API_KEY ? 'Present' : 'Missing'}, OpenRouter=${OPENROUTER_API_KEY ? 'Present' : 'Missing'}`);

let aiClient: GoogleGenAI | null = null;
const getAiClient = () => {
  if (!aiClient && GEMINI_API_KEY) {
    try {
      console.log(`[AI-Service] Initializing GoogleGenAI client...`);
      aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    } catch (err: any) {
      console.error(`[AI-Service] Initialization failed:`, err.message);
    }
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
  console.log(`[AI-Service] analyzeStudyMaterial called for: ${title}`);
  const ai = getAiClient();
  if (!ai) {
    console.warn(`[AI-Service] No Gemini client available. Trying OpenRouter...`);
    return analyzeWithOpenRouter(content, title);
  }

  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: `Material Title: ${title}\n\nContent:\n${content.substring(0, 15000)}` }]}],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            keyTopics: { type: "array", items: { type: "string" } },
            realLifeApplications: { type: "array", items: { type: "string" } },
            simpleDetailedNotes: { type: "string" },
            suggestedQuizQuestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correctAnswer: { type: "number" },
                  explanation: { type: "string" }
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
    if (!text) {
      console.error(`[AI-Service] Empty text response from Gemini`);
      throw new Error("No response from AI");
    }
    const result = JSON.parse(text);
    return { ...result, detailedNotes: result.simpleDetailedNotes };
  } catch (error: any) {
    console.error(`[AI-Service] Gemini analysis failed:`, error.message);
    if (OPENROUTER_API_KEY) {
      console.log(`[AI-Service] Falling back to OpenRouter...`);
      return analyzeWithOpenRouter(content, title);
    }
    throw error;
  }
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
  console.log(`[AI-Service] generateDetailedNotes called for: ${title}`);
  
  const ai = getAiClient();
  const systemInstruction = `You are an expert educator. Convert the following content into a structured JSON study note following this exact schema. Focus on clarity, key terminology, and active learning.

Rules:
- Extract 3-5 learning objectives
- Identify 5-8 key terms with definitions
- Break content into logical sections with 2-3 subsections max
- Highlight 2-4 keywords per subsection
- Add a memory tip for complex concepts
- Create one comparison table if comparing 2+ items
- Write 3-5 active recall questions
- Add a mnemonic if applicable
- Keep language clear and student-friendly.`;

  const promptText = `Content to convert:
Material Title: ${title}
Content:
${content.substring(0, 15000)}`;

  if (ai) {
    try {
      console.log(`[AI-Service] Attempting generateDetailedNotes with Gemini...`);
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: promptText }]}],
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              learningObjectives: { type: "array", items: { type: "string" } },
              keyTerms: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    term: { type: "string" },
                    definition: { type: "string" },
                    memoryTip: { type: "string" }
                  },
                  required: ["term", "definition"]
                }
              },
              sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string" },
                    subsections: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          subheading: { type: "string" },
                          content: { type: "string" },
                          keywords: { type: "array", items: { type: "string" } },
                          memoryTip: { type: "string" },
                          quickCheck: { type: "string" }
                        },
                        required: ["content", "keywords"]
                      }
                    }
                  },
                  required: ["heading", "subsections"]
                }
              },
              comparisonTable: {
                type: "object",
                properties: {
                  headers: { type: "array", items: { type: "string" } },
                  rows: { type: "array", items: { type: "array", items: { type: "string" } } },
                  title: { type: "string" }
                },
                required: ["headers", "rows"]
              },
              summary: { type: "array", items: { type: "string" } },
              activeRecallQuestions: { type: "array", items: { type: "string" } },
              mnemonic: { type: "string" },
              relatedTopics: { type: "array", items: { type: "string" } }
            },
            required: ["title", "learningObjectives", "keyTerms", "sections", "summary", "activeRecallQuestions"]
          },
          systemInstruction
        }
      }));

      const text = response.text || "";
      if (text) {
        try {
          const result = JSON.parse(text);
          console.log(`[AI-Service] Gemini successfully generated structured note. Title: ${result.title}`);
          return { structuredNote: result, detailedNotes: "Structured content generated" };
        } catch (jsonErr) {
          console.warn("[AI-Service] Gemini returned non-JSON for structured notes");
        }
      }
    } catch (err: any) {
      console.error(`[AI-Service] Gemini detailed notes failed:`, err.message);
    }
  }

  console.log(`[AI-Service] Falling back to OpenRouter for structured notes...`);
  try {
    const response = await callOpenRouter([
      { 
        role: 'system', 
        content: systemInstruction 
      },
      { role: 'user', content: promptText }
    ], true);
    
    try {
      const result = JSON.parse(response.content.replace(/```json|```/g, ''));
      return { structuredNote: result, detailedNotes: "Structured content generated" };
    } catch (parseErr) {
      console.warn("[AI-Service] OpenRouter returned non-JSON for structured notes");
      throw new Error("Failed to parse structured notes from OpenRouter");
    }
  } catch (err: any) {
    console.error(`[AI-Service] generateDetailedNotes failed everywhere:`, err.message);
    throw err;
  }
};
