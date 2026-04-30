import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function summarizeMaterial(content: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following study material in a clear, structured way with key takeaways and main concepts. Use Markdown for formatting.\n\nContent: ${content}`,
    });
    return response.text;
  } catch (error) {
    console.error("Summarization error:", error);
    return "Failed to generate summary. Please try again.";
  }
}

export async function generateQuiz(content: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 multiple-choice questions based on the following content. Return the result as a JSON array of objects with fields: text, options (array of 4 strings), correctAnswer (index 0-3), and explanation. \n\nContent: ${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ["text", "options", "correctAnswer", "explanation"],
          },
        },
      },
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Quiz generation error:", error);
    return [];
  }
}
