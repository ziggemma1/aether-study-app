import axios from 'axios';
import { NoteSection } from '../types.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
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

export const generateDetailedNotes = async (content: string, title: string, keyTopics?: string[]): Promise<{ detailedNotes: string, noteSections: NoteSection[] }> => {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'undefined' || OPENROUTER_API_KEY.length < 10) {
    console.warn('OPENROUTER_API_KEY is missing or invalid. Detailed notes generation via OpenRouter will be skipped.');
    return { detailedNotes: '', noteSections: [] };
  }

  const headers = {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': SITE_URL,
    'X-OpenRouter-Title': SITE_NAME,
    'Content-Type': 'application/json',
  };

  try {
    // Step 1: Reasoning
    console.log('Step 1: Reasoning with OpenRouter...');
    const reasoningMessage = await callOpenRouterWithFallback(
      [
        {
          role: 'user',
          content: `Analyze and reason deeply about the following study material titled "${title}". 
          Break down the core logic, explain the "why" behind every concept, provide derivations for formulas, and identify the deeper academic context.
          Create a highly informative intellectual map of this material.
          ${keyTopics ? `Focus specifically on these key topics: ${keyTopics.join(', ')}` : ''}
          
          Material Content:
          ${content}`
        }
      ],
      MODELS.reasoning,
      headers
    );
    
    // Step 2: Structured Content Generation
    console.log('Step 2: Structured Content Generation with OpenRouter...');
    const structuredMessage = await callOpenRouterWithFallback(
      [
        {
          role: 'system',
          content: `You are an elite academic tutor and textbook author. Your goal is to take the provided reasoning and create the most comprehensive, detailed, and beautifully structured study notes possible.
          
          STYLE GUIDELINES:
          - EXHAUSTIVE DETAIL: Every concept must be explained as if to a student who needs to understand the "first principles". Do not skip steps.
          - ACADEMIC RIGOR: Use professional terminology but explain it clearly.
          - LENGTH: Each section should be as long as possible (at least 3-5 thick paragraphs per section).
          - EXAMPLES: Include at least TWO concrete, step-by-step examples for every single key topic. Use a "#### Example:" heading for these.
          - FORMATTING: Use bolding for key terms, blockquotes for important laws/theorems, and clear sub-headings.
          
          STRUCTURE REQUIREMENT:
          ${keyTopics ? `You MUST create a massive, separate section for EACH of these specific key topics: ${keyTopics.join(', ')}.` : 'You MUST create a separate section for EACH of the key topics identified in the material.'}
          Each section is a complete "chapter" in a textbook dedicated to that topic.
          
          Format the output as a JSON object with:
          1. "detailedNotes": A massive full markdown version of the notes (the combination of all sections).
          2. "noteSections": An array of objects, each containing:
             - "heading": The section title (MUST match one of the key topics).
             - "content": The EXQUISITELY detailed, long-form explanation for this topic (Markdown).
             - "imagePrompt": A highly detailed, descriptive prompt for an AI image generator to create a high-quality, professional textbook illustration or diagram of the core concept.
          
          Be authoritative, incredibly thorough, and clear.`
        },
        {
          role: 'user',
          content: `Material Title: ${title}\n\nReasoning Context: ${reasoningMessage.content}`
        }
      ],
      MODELS.synthesis,
      headers,
      true
    );

    const rawContent = structuredMessage.content || '{}';
    const cleanJson = rawContent.replace(/```json\n?|```/g, '').trim();
    const result = JSON.parse(cleanJson);
    
    return {
      detailedNotes: result.detailedNotes || '',
      noteSections: result.noteSections || []
    };
  } catch (error: any) {
    console.error('OpenRouter Pipeline Error:', error.message);
    return { detailedNotes: '', noteSections: [] };
  }
};
