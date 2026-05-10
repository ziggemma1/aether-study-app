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
    if (!text) {
      console.error(`[AI-Service] Empty text response from Gemini`);
      throw new Error("No response from AI");
    }
    const result = JSON.parse(text);
    // Normalize quiz questions if they came back in an object wrapper
    const normalizedQuiz = result.suggestedQuizQuestions?.questions || result.suggestedQuizQuestions || [];
    
    return { 
      ...result, 
      detailedNotes: result.simpleDetailedNotes,
      suggestedQuizQuestions: normalizedQuiz
    };
  } catch (error: any) {
    console.error(`[AI-Service] Gemini analysis failed:`, error.message);
    if (OPENROUTER_API_KEY) {
      try {
        console.log(`[AI-Service] Falling back to OpenRouter...`);
        return await analyzeWithOpenRouter(content, title);
      } catch (orError: any) {
        console.error(`[AI-Service] OpenRouter analysis fallback failed:`, orError.message);
      }
    }
    
    // Final static fallback to prevent 500
    console.warn(`[AI-Service] Using static fallback for analysis...`);
    return {
      summary: content.substring(0, 300) + "...",
      keyTopics: ["Main Material"],
      realLifeApplications: ["Academic Study"],
      simpleDetailedNotes: content.substring(0, 1000),
      detailedNotes: content.substring(0, 1000),
      suggestedQuizQuestions: []
    };
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
  // Normalize quiz questions if they came back in an object wrapper
  const normalizedQuiz = result.suggestedQuizQuestions?.questions || result.suggestedQuizQuestions || [];
  
  return { 
    ...result, 
    detailedNotes: result.simpleDetailedNotes,
    suggestedQuizQuestions: normalizedQuiz
  };
};

export const generateFlashcards = async (content: string, language: string, count: number) => {
  const ai = getAiClient();
  const prompt = `Create ${count} flashcards in ${language} from the following content. Return a JSON array of objects with "question" and "answer" properties.`;
  
  if (ai) {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Content: ${content.substring(0, 10000)}\n\n${prompt}` }]}],
        config: {
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
      return JSON.parse(response.text || "[]");
    } catch (err: any) {
      console.warn(`[AI-Service] Gemini flashcards failed:`, err.message);
    }
  }

  if (OPENROUTER_API_KEY) {
    try {
      const response = await callOpenRouter([
        { role: 'system', content: prompt + " Return JSON array with question/answer." },
        { role: 'user', content: content.substring(0, 10000) }
      ], true);
      return JSON.parse(response.content.replace(/```json|```/g, ''));
    } catch (err: any) {
      console.warn(`[AI-Service] OpenRouter flashcards failed:`, err.message);
    }
  }

  // Final static fallback
  return [
    { question: "Summary of main topic?", answer: "The provided content covers key aspects of the study material." }
  ];
};

export const generateQuiz = async (content: string, language: string, count: number, difficulty: string, complexity: string) => {
  const ai = getAiClient();
  const prompt = `Create ${count} ${difficulty} level MCQs with ${complexity} complexity in ${language} based on the content. Return a JSON array of objects with "question", "options" (array of 4 strings), "correctAnswer" (index 0-3), and "explanation".`;

  if (ai) {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: `Content: ${content.substring(0, 10000)}\n\n${prompt}` }]}],
        config: {
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
      return JSON.parse(response.text || "[]");
    } catch (err: any) {
      console.warn(`[AI-Service] Gemini quiz failed:`, err.message);
    }
  }

  if (OPENROUTER_API_KEY) {
    try {
      const response = await callOpenRouter([
        { role: 'system', content: prompt + " Return JSON array." },
        { role: 'user', content: content.substring(0, 10000) }
      ], true);
      return JSON.parse(response.content.replace(/```json|```/g, ''));
    } catch (err: any) {
      console.warn(`[AI-Service] OpenRouter quiz failed:`, err.message);
    }
  }

  // Final static fallback
  return [
    { 
      question: "What is the main topic of this material?", 
      options: ["The content provided", "Unrelated topic", "General knowledge", "None of the above"], 
      correctAnswer: 0, 
      explanation: "Based on the content provided." 
    }
  ];
};

export const chatWithTutor = async (materialTitle: string, materialContent: string, chatHistory: any[], userMessage: string, language: string) => {
  const ai = getAiClient();
  const systemPrompt = `You are a friendly and academic tutor for the study material: "${materialTitle}". 
  Context: ${materialContent.substring(0, 5000)}.
  All your responses MUST be in ${language}. 
  Be encouraging, explain concepts clearly, and ask occasional follow-up questions to test understanding.`;

  if (ai) {
    try {
      console.log(`[AI-Service] Attempting chatWithTutor with Gemini...`);
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          ...chatHistory.map((h: any) => ({ 
            role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user', 
            parts: [{ text: h.parts?.[0]?.text || h.content || "" }] 
          })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      }));
      return response.text || "I'm sorry, I couldn't generate a response.";
    } catch (err: any) {
      console.warn(`[AI-Service] Gemini tutor failed:`, err.message);
    }
  }

  if (OPENROUTER_API_KEY) {
    try {
      console.log(`[AI-Service] Falling back to OpenRouter for tutor...`);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map((h: any) => ({ role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user', content: h.parts?.[0]?.text || h.content })),
        { role: 'user', content: userMessage }
      ];
      const response = await callOpenRouter(messages);
      return response.content;
    } catch (err: any) {
      console.error(`[AI-Service] OpenRouter tutor fallback failed:`, err.message);
    }
  }

  return "I'm having trouble connecting to my AI brain. Please try again later!";
};

export const generateStudyPlan = async (materials: any[], startDate: string, duration: number, goal: string, complexity: string, commitment: string, language: string) => {
  const ai = getAiClient();
  const materialContext = materials.map(m => `Title: ${m.title}`).join(', ');
  const systemPrompt = `Create a study plan for ${duration} days starting ${startDate} for the following materials: ${materialContext}. 
  Goal: ${goal}. 
  Complexity: ${complexity}.
  Commitment Level: ${commitment}.
  Language: ${language}.
  Return valid JSON array of session objects.`;

  if (ai) {
    try {
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: "Generate the study plan JSON." }]}],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                topic: { type: Type.STRING },
                activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                duration: { type: Type.STRING },
                materialId: { type: Type.STRING }
              },
              required: ["day", "topic", "activities", "duration"]
            }
          }
        }
      }));
      return JSON.parse(response.text || "[]");
    } catch (err: any) {
      console.warn(`[AI-Service] Gemini study plan failed:`, err.message);
    }
  }

  if (OPENROUTER_API_KEY) {
    try {
      console.log(`[AI-Service] Falling back to OpenRouter for study plan...`);
      const response = await callOpenRouter([
        { role: 'system', content: systemPrompt + " Return JSON array of sessions." },
        { role: 'user', content: `Generate JSON study plan.` }
      ], true);
      return JSON.parse(response.content.replace(/```json|```/g, ''));
    } catch (err: any) {
      console.error(`[AI-Service] OpenRouter study plan fallback failed:`, err.message);
    }
  }

  return [{ day: 1, topic: "Quick Review", activities: ["Read through materials"], duration: "30 mins" }];
};

export const generateDetailedNotes = async (content: string, title: string) => {
  console.log(`[AI-Service] generateDetailedNotes called for: ${title}`);
  
  const ai = getAiClient();
  const systemInstruction = `You are an expert pedagogical note transformation system.
      Your goal is to transform study material into a structured, beautiful, and logically deep JSON note.
      RULES:
      - Title: Catchy and academic.
      - Learning Objectives: 3-5 specific "Students will be able to..." goals.
      - Key Terms: Critical bolded terms with simple definitions and a creative memory tip.
      - Sections: logical chapters with 2-3 subsections each.
      - Content: Rich pedagogical explanations. Use lists and bold text for clarity. DO NOT use markdown headings (#) inside the content strings.
      - Comparisons: Must include a comparisonTable if the topic allows for contrasting concepts.
      - Summary: Quick-read bullet points.
      - Mnemonic: A catchy phrase to remember the core concept.
      - Active Recall: Challenging questions that force deep reflection.
      - Keywords: List actual keywords from the content here to enable highlighting.
      Return valid JSON only.`;

  const promptText = `Content to convert:
Material Title: ${title}
Content:
${content.substring(0, 15000)}`;

  if (ai) {
    try {
      console.log(`[AI-Service] Attempting generateDetailedNotes with Gemini...`);
      // Use responseSchema for better standard compliance with lowercase types
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: [{ role: 'user', parts: [{ text: promptText }]}],
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyTerms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING },
                    memoryTip: { type: Type.STRING }
                  },
                  required: ["term", "definition"]
                }
              },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    subsections: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          subheading: { type: Type.STRING },
                          content: { type: Type.STRING },
                          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                          memoryTip: { type: Type.STRING },
                          quickCheck: { type: Type.STRING }
                        },
                        required: ["content", "keywords"]
                      }
                    }
                  },
                  required: ["heading", "subsections"]
                }
              },
              comparisonTable: {
                type: Type.OBJECT,
                properties: {
                  headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } },
                  title: { type: Type.STRING }
                },
                required: ["headers", "rows"]
              },
              summary: { type: Type.ARRAY, items: { type: Type.STRING } },
              activeRecallQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              mnemonic: { type: Type.STRING },
              relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
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

  if (OPENROUTER_API_KEY) {
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
      }
    } catch (err: any) {
      console.error(`[AI-Service] generateDetailedNotes OpenRouter fallback failed:`, err.message);
    }
  }

  // Final static fallback
  console.warn(`[AI-Service] Using static fallback for detailed notes...`);
  return {
    structuredNote: {
      title: title || "Study Material",
      learningObjectives: ["Understand main concept", "Identify key terms"],
      keyTerms: [{ term: "Topic", definition: "Main subject of study", memoryTip: "Focus on the basics" }],
      sections: [{ 
        heading: "Overview", 
        subsections: [{ subheading: "Introduction", content: content.substring(0, 1000), keywords: ["study", "notes"] }] 
      }],
      summary: ["Material processed with basic logic due to AI unavailability."],
      activeRecallQuestions: ["What is the main idea of this material?"],
      mnemonic: "Read And Remember",
      relatedTopics: ["Context", "Background"]
    },
    detailedNotes: content.substring(0, 2000)
  };
};
