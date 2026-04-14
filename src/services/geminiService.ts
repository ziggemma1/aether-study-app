import { GoogleGenAI } from "@google/genai";

// The platform provides GEMINI_API_KEY in the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface StudyMaterialAnalysis {
  summary: string;
  keyTopics: string[];
  realLifeApplications: string[];
  suggestedQuizQuestions: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export const analyzeStudyMaterial = async (content: string): Promise<StudyMaterialAnalysis> => {
  try {
    const model = (ai as any).getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `Analyze the following study material and provide a detailed summary, key topics, real-life applications, and 5 multiple-choice quiz questions.
      
      Material Content:
      ${content}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return JSON.parse(text);
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    throw error;
  }
};
