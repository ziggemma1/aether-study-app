import { GoogleGenAI, Type } from "@google/genai";
import { generateDetailedNotes } from "./openRouterService";
import { NoteSection } from "../types";

// The platform provides GEMINI_API_KEY in the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export const analyzeStudyMaterial = async (content: string, title: string = "Material"): Promise<StudyMaterialAnalysis> => {
  try {
    // Step 1: Get basic analysis and key topics from Gemini
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Material Title: ${title}\n\nMaterial Content:\n${content}`,
      config: {
        systemInstruction: `You are an expert academic analyzer. Analyze the provided study material and return a JSON object containing:
        1. summary: A comprehensive summary.
        2. keyTopics: An array of important topics.
        3. realLifeApplications: An array of practical examples.
        4. detailedNotes: A well-explained note in Markdown.
        5. suggestedQuizQuestions: An array of 5 multiple-choice questions with 'question', 'options' (array of 4), 'correctAnswer' (0-3), and 'explanation'.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
            realLifeApplications: { type: Type.ARRAY, items: { type: Type.STRING } },
            detailedNotes: { type: Type.STRING },
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
          required: ["summary", "keyTopics", "realLifeApplications", "detailedNotes", "suggestedQuizQuestions"]
        }
      }
    }));

    let text = response.text;

    if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    }

    if (!text) {
      const finishReason = response.candidates?.[0]?.finishReason;
      throw new Error(`Gemini returned an empty response. Finish reason: ${finishReason || 'unknown'}`);
    }

    const result: StudyMaterialAnalysis = JSON.parse(text);

    // Step 2: Use the generated key topics to create structured detailed notes via OpenRouter
    console.log('Generating structured notes based on key topics:', result.keyTopics);
    const openRouterResult = await generateDetailedNotes(content, title, result.keyTopics);
    
    if (openRouterResult && openRouterResult.noteSections.length > 0) {
      console.log('Using high-quality multi-model notes and sections');
      result.detailedNotes = openRouterResult.detailedNotes;
      
      // Generate images for each section in parallel
      const sectionsWithImages = await Promise.all(
        openRouterResult.noteSections.map(async (section) => {
          try {
            const imageUrl = await generateVisualAid(section.imagePrompt);
            return { ...section, imageUrl };
          } catch (err) {
            console.error(`Failed to generate image for section: ${section.heading}`, err);
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
