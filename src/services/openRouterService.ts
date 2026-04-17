import axios from 'axios';
import { NoteSection } from '../types.js';

const getOpenRouterKey = () => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key === 'undefined' || key.length < 10) {
    console.warn('⚠️ OPENROUTER_API_KEY is missing or invalid. Detailed notes generation via OpenRouter will be skipped.');
    return null;
  }
  return key;
};

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://aether-study.app';
const SITE_NAME = 'Aether Study';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// List of free models to try in order of preference
const MODELS = {
  reasoning: [
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-2-9b-it:free'
  ],
  synthesis: [
    'google/gemma-2-9b-it:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'mistralai/pixtral-12b:free'
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

const callOpenRouterWithFallback = async (messages: any[], modelList: string[], headers: any, useJson = false): Promise<any> => {
  for (const model of modelList) {
    try {
      console.log(`Trying OpenRouter model: ${model}`);
      const payload: any = { model, messages };
      if (useJson) payload.response_format = { type: 'json_object' };
      
      const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', payload, headers);
      if (response.data.choices?.[0]?.message?.content) {
        return response.data.choices[0].message;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err.response?.data || err.message);
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
        content: `You are an elite academic professor and textbook author. Your goal is to write the MOST comprehensive, deep-dive chapter for a textbook about a specific topic.
        
        TOPIC TO EXPLAIN: "${topic}"
        
        GOAL: Write at least 800-1200 words for this specific topic alone. 
        
        STYLE GUIDELINES:
        1. FIRST PRINCIPLES: Start from the very base assumptions and build up.
        2. NO SUMMARIES: Do not summarize. Elaborate on every detail, nuance, and edge case.
        3. EXAMPLES: Include at least THREE very detailed, step-by-step real-world examples.
        4. STRUCTURE: Use multiple sub-headings (###), bolding ( ** ), and bullet points.
        5. ACADEMIC FLOW: Use blockquotes for major laws, definitions, or equations.
        6. LENGTH IS QUALITY: The more you explain, the better. Be extremely verbose but professional.
        
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

    // Step 2: Iterative Section Generation (500% more content approach)
    console.log(`Step 2: Generating ${topicsToProcess.length} massive chapters iteratively...`);
    
    // We do this one by one to ensure max tokens per section
    for (const topic of topicsToProcess) {
      try {
        console.log(`Generating massive chapter for: ${topic}`);
        const section = await generateTopicSection(content, title, topic, context);
        noteSections.push(section);
      } catch (err) {
        console.error(`Failed to generate section ${topic}:`, err);
      }
    }

    const detailedNotes = noteSections.map(s => `# ${s.heading}\n\n${s.content}`).join('\n\n---\n\n');
    
    return { detailedNotes, noteSections };
  } catch (error: any) {
    console.error('OpenRouter Pipeline Error:', error.message);
    return { detailedNotes: 'Generation failed.', noteSections: [] };
  }
};
