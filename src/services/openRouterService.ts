import axios from 'axios';
import { NoteSection } from '../types.js';

const getOpenRouterKey = () => {
  const key = typeof process !== 'undefined' ? process.env.OPENROUTER_API_KEY : import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key || key === 'undefined' || key.length < 10) {
    console.warn('⚠️ OPENROUTER_API_KEY is missing or invalid. Detailed notes generation via OpenRouter will be skipped.');
    return null;
  }
  return key;
};

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://aether-study.app';
const SITE_NAME = 'Aether Study';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// List of models to try in order of preference
// Including both free and reliable low-cost models
const MODELS = {
  reasoning: [
    'google/gemini-flash-1.5-8b',
    'meta-llama/llama-3.1-8b-instruct',
    'mistralai/mistral-7b-instruct',
    'google/gemma-2-9b-it',
    'meta-llama/llama-3-8b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free'
  ],
  synthesis: [
    'google/gemini-flash-1.5-8b',
    'meta-llama/llama-3.1-8b-instruct',
    'mistralai/mistral-7b-instruct',
    'google/gemma-2-9b-it',
    'qwen/qwen-2.5-72b-instruct',
    'meta-llama/llama-3-8b-instruct:free',
    'microsoft/phi-3-medium-128k-instruct:free',
    'openchat/openchat-7b:free'
  ]
};

const fetchWithRetry = async (url: string, data: any, headers: any, retries = 3, backoff = 1000): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(url, data, { headers });
      return response;
    } catch (error: any) {
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error?.message || error.message;
      
      if ((status === 503 || status === 429 || status === 502 || status === 401 || status === 402) && i < retries - 1) {
        console.warn(`OpenRouter API error ${status} (${errorMsg}). Retrying in ${backoff}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(backoff);
        backoff *= 2; 
        continue;
      }
      throw error;
    }
  }
};

export const callOpenRouterWithFallback = async (messages: any[], modelList: string[], headers: any, useJson = false): Promise<any> => {
  for (const model of modelList) {
    try {
      console.log(`Trying OpenRouter model: ${model}`);
      const payload: any = { model, messages };
      if (useJson) payload.response_format = { type: 'json_object' };
      
      const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', payload, headers);
      if (response.data.choices?.[0]?.message?.content) {
        return response.data.choices[0].message;
      }
      throw new Error('Empty response from model');
    } catch (err: any) {
      const errorData = err.response?.data?.error || err.response?.data || err.message;
      console.warn(`Model ${model} failed:`, JSON.stringify(errorData));
      // Try next model
    }
  }
  throw new Error('All OpenRouter models failed to provide a valid response.');
};

export const generateTopicSection = async (content: string, title: string, topic: string, context?: string): Promise<NoteSection> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing. Deep analysis requires this key.');
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': SITE_URL,
    'X-OpenRouter-Title': SITE_NAME,
    'Content-Type': 'application/json',
  };

  const response = await callOpenRouterWithFallback(
    [
      {
        role: 'system',
        content: `You are an elite academic professor and textbook author. Your goal is to write a comprehensive, deep-dive chapter for a textbook about a specific topic.
        
        TOPIC TO EXPLAIN: "${topic}"
        
        GOAL: Write a massive deep-dive about 400% larger than a standard summary. 
        
        STYLE GUIDELINES:
        1. SIMPLE WORDS: Use very simple, clear, and easy to understand language (Explain like I'm 15).
        2. VISUAL REFINEMENT: Structure your Markdown beautifully. Use clear headings, bullet points, and white space.
        3. FIRST PRINCIPLES: Start from the very base assumptions and build up.
        4. NO SUMMARIES: Do not summarize. Elaborate on every detail, nuance, and edge case in simple terms.
        5. EXAMPLES: Include at least THREE very detailed, step-by-step real-world examples.
        6. STRUCTURE: Use multiple sub-headings (###), bolding ( ** ), and bullet points.
        7. ACADEMIC FLOW: Use blockquotes for major laws, definitions, or equations.
        
        Format the output as a JSON object with:
        - "heading": The topic name ("${topic}").
        - "content": The massive, EXQUISITELY detailed explanation in Markdown.
        - "imagePrompt": A descriptive prompt for a professional textbook diagram illustrating this specific topic.`
      },
      {
        role: 'user',
        content: `Material Title: ${title}\n\nOverarching Context: ${context || 'N/A'}\n\nCore Reference Material: ${content.substring(0, 10000)}`
      }
    ],
    MODELS.synthesis,
    headers,
    true
  );

  const rawJson = response.content || '{}';
  const cleanJson = rawJson.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleanJson);
};

export const generateDetailedNotes = async (content: string, title: string, keyTopics?: string[]): Promise<{ detailedNotes: string, noteSections: NoteSection[] }> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return { detailedNotes: '', noteSections: [] };
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': SITE_URL,
    'X-OpenRouter-Title': SITE_NAME,
    'Content-Type': 'application/json',
  };

  try {
    // Step 1: Deep Reasoning Context
    console.log('Step 1: Gathering deep reasoning context...');
    const reasoningMessage = await callOpenRouterWithFallback(
      [
        {
          role: 'user',
          content: `You are a highly advanced analytical researcher. Analyze the following material titled "${title}" and create a 2000-word deep-dive reasoning map. 
          Identify every subtle concept, the mathematical or logical foundations, and how these topics interconnect.
          
          Material: ${content.substring(0, 15000)}`
        }
      ],
      MODELS.reasoning,
      headers
    );

    const context = reasoningMessage.content;
    const topicsToProcess = keyTopics || [];
    const noteSections: NoteSection[] = [];

    // Step 2: Iterative Section Generation
    console.log(`Step 2: Generating ${topicsToProcess.length} massive chapters iteratively...`);
    
    // We do this one by one to ensure max tokens per section
    for (const topic of topicsToProcess) {
      try {
        console.log(`Generating massive chapter for: ${topic}`);
        const section = await generateTopicSection(content, title, topic, context);
        noteSections.push(section);
      } catch (err: any) {
        console.error(`Failed to generate section ${topic}:`, err.message);
      }
    }

    if (noteSections.length === 0) {
      throw new Error('All OpenRouter models failed to provide a valid response. Check your OPENROUTER_API_KEY or model availability.');
    }

    const detailedNotes = noteSections.map(s => `# ${s.heading}\n\n${s.content}`).join('\n\n---\n\n');
    
    return { detailedNotes, noteSections };
  } catch (error: any) {
    console.error('OpenRouter Pipeline Error:', error.message);
    return { detailedNotes: 'Generation failed.', noteSections: [] };
  }
};

export const analyzeStudyMaterialWithOpenRouter = async (content: string, title: string = "Material"): Promise<{
  summary: string;
  keyTopics: string[];
  realLifeApplications: string[];
  simpleDetailedNotes: string;
  suggestedQuizQuestions: any[];
}> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter key missing for fallback.');

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': SITE_URL,
    'X-OpenRouter-Title': SITE_NAME,
    'Content-Type': 'application/json',
  };

  const response = await callOpenRouterWithFallback(
    [
      {
        role: 'system',
        content: `You are an expert academic analyzer. Analyze the provided study material and return a JSON object.
        Use simple, clear language.
        
        Return:
        1. summary: A comprehensive summary.
        2. keyTopics: Array of 5-8 important topics.
        3. realLifeApplications: Array of 3 practical examples.
        4. simpleDetailedNotes: Standard detailed notes in Markdown.
        5. suggestedQuizQuestions: Array of 5 MCQs with 'question', 'options' (4), 'correctAnswer' (0-3), and 'explanation'.`
      },
      {
        role: 'user',
        content: `Material Title: ${title}\n\nContent:\n${content.substring(0, 15000)}`
      }
    ],
    MODELS.synthesis,
    headers,
    true
  );

  const rawJson = response.content || '{}';
  const cleanJson = rawJson.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleanJson);
};

export const generateFlashcardsWithOpenRouter = async (content: string, language: string = "English (US)", count: number = 10): Promise<{ question: string; answer: string }[]> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter key missing');

  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': SITE_URL,
    'X-OpenRouter-Title': SITE_NAME,
    'Content-Type': 'application/json',
  };

  const response = await callOpenRouterWithFallback(
    [
      {
        role: 'system',
        content: `Extract exactly ${count} important key terms and concepts from this material and create flashcards. 
        STRICT REQUIREMENT: All content MUST be in ${langPrompt}.
        Return exactly a JSON array of objects with "question" and "answer" properties.`
      },
      {
        role: 'user',
        content: `Material:\n${content.substring(0, 10000)}`
      }
    ],
    MODELS.synthesis,
    headers,
    true
  );

  const rawJson = response.content || '[]';
  const cleanJson = rawJson.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleanJson);
};

export const generateQuizQuestionsWithOpenRouter = async (
  content: string,
  language: string = "English (US)",
  count: number = 10,
  difficulty: "Easy" | "Medium" | "Hard" = "Medium",
  complexity: "Basic" | "Standard" | "Comprehensive" = "Standard"
): Promise<{ question: string; options: string[]; correctAnswer: number; explanation: string }[]> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter key missing');

  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': SITE_URL,
    'X-OpenRouter-Title': SITE_NAME,
    'Content-Type': 'application/json',
  };

  const response = await callOpenRouterWithFallback(
    [
      {
        role: 'system',
        content: `Generate exactly ${count} ${difficulty} difficulty level quiz questions with ${complexity} complexity.
        STRICT REQUIREMENT: All content MUST be in ${langPrompt}.
        Return exactly a JSON array of objects with: question, options (array of 4), correctAnswer (0-3 index), and explanation.`
      },
      {
        role: 'user',
        content: `Material:\n${content.substring(0, 10000)}`
      }
    ],
    MODELS.synthesis,
    headers,
    true
  );

  const rawJson = response.content || '[]';
  const cleanJson = rawJson.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleanJson);
};

export const chatWithTutorWithOpenRouter = async (
  materialTitle: string, 
  materialContent: string, 
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[], 
  userMessage: string, 
  language: string = "English (US)"
): Promise<string> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter key missing');

  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': SITE_URL,
    'X-OpenRouter-Title': SITE_NAME,
    'Content-Type': 'application/json',
  };

  const messages = [
    {
      role: 'system',
      content: `You are a helpful Interactive AI Tutor. Material Title: ${materialTitle}. Context: ${materialContent.substring(0, 5000)}. STRICT REQUIREMENT: Output MUST be in ${langPrompt}.`
    },
    ...chatHistory.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts.map(p => p.text).join('\n')
    })),
    { role: 'user', content: userMessage }
  ];

  const response = await callOpenRouterWithFallback(
    messages,
    MODELS.synthesis,
    headers
  );

  return response.content;
};

export const generateStudyPlanWithOpenRouter = async (
  materials: any[], 
  startDate: string, 
  duration: number, 
  goal: string, 
  complexity: string, 
  commitment: string
): Promise<any[]> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter key missing for fallback.');

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': SITE_URL,
    'X-OpenRouter-Title': SITE_NAME,
    'Content-Type': 'application/json',
  };

  const materialContext = materials.map(m => `Title: ${m.title}\nKey Topics: ${(m.keyTopics || []).join(', ')}`).join('\n\n');

  const response = await callOpenRouterWithFallback(
    [
      {
        role: 'system',
        content: `You are a world-class academic advisor and educational strategist. Your task is to generate a highly effective, personalized study plan.
        
        The plan must be structured specifically for the student's defined commitment, goal, and complexity level.
        
        ADAPTATION RULES:
        1. COMPLEXITY (${complexity}): 
           - 'Beginner': Explain concepts from scratch, no jargon.
           - 'Intermediate': Connect concepts, use standard industry terminology.
           - 'Advanced': Focus on nuances, optimizations, and deep theoretical analysis.
        
        2. DAILY COMMITMENT (${commitment}):
           - If short (30m), keep tasks extremely focused and high-leverage.
           - If long (4h+), include deep reading, multiple practice sets, and active recall sessions.
        
        3. LEARNING GOAL (${goal}):
           - 'Exam Prep': Heavily weight practice tests, memory techniques, and high-frequency topics.
           - 'Deep Dive': Focus on the "Why" and "How", encourage cross-referencing multiple materials.
           - 'Quick Review': Create high-level summaries and rapid-fire identification of key terms.
        
        OUTPUT FORMAT:
        A JSON array of objects, where each object represents one day's session.
        Each object MUST have:
        - "day": The day number (integer)
        - "date": The formatted date string (e.g., "Mon, Apr 20")
        - "topic": A specific study topic based on the material context
        - "duration": The commitment time ("${commitment}")
        - "completed": false
        - "dailySummary": A 2-3 sentence overview clearly tied to the ${goal} goal.
        - "detailedNotes": Markdown breakdown including: Daily Objectives, Detailed Task List, and a "Strategic Pro-Tip" relevant to the ${complexity} level.`
      },
      {
        role: 'user',
        content: `MATERIAL CONTEXT:\n${materialContext}\n\nDURATION: ${duration} days\nSTART DATE: ${startDate}`
      }
    ],
    MODELS.synthesis,
    headers,
    true
  );

  const rawJson = response.content || '[]';
  const cleanJson = rawJson.replace(/```json\n?|```/g, '').trim();
  const parsed = JSON.parse(cleanJson);
  
  if (Array.isArray(parsed)) return parsed;
  if (parsed.sessions && Array.isArray(parsed.sessions)) return parsed.sessions;
  if (parsed.plan && Array.isArray(parsed.plan)) return parsed.plan;
  
  return [];
};
