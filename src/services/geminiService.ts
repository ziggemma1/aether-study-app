import { GoogleGenAI, Type } from "@google/genai";
import { generateDetailedNotes, analyzeStudyMaterialWithOpenRouter, generateTopicSection } from "./openRouterService.js";
import { NoteSection } from "../types.js";

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

export const generateGeminiTopicSection = async (content: string, title: string, topic: string): Promise<NoteSection> => {
  const ai = getAiClient();
  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create an EXTREMELY detailed study chapter for the topic "${topic}" based on the following material: ${title}.
    
    Material Context: ${content.substring(0, 10000)}`,
    config: {
      systemInstruction: `You are an elite academic professor. Write a massive, deep-dive chapter for this specific topic. 
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

export const analyzeStudyMaterial = async (content: string, title: string = "Material"): Promise<StudyMaterialAnalysis> => {
  try {
    let initialResult: any;
    let usedFallback = false;

    try {
      const ai = getAiClient();
      // Step 1: Get basic analysis and key topics from Gemini
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Material Title: ${title}\n\nMaterial Content:\n${content.substring(0, 15000)}`,
        config: {
          systemInstruction: `You are an expert academic analyzer. Analyze the provided study material and return a JSON object.
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
          const section = await generateGeminiTopicSection(content, title, topic);
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
