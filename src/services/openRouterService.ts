import axios from 'axios';
import { NoteSection } from '../types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = window.location.origin;
const SITE_NAME = 'Aether Study';

export const generateDetailedNotes = async (content: string, title: string, keyTopics?: string[]): Promise<{ detailedNotes: string, noteSections: NoteSection[] }> => {
  if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY is missing. Falling back to Gemini for detailed notes.');
    return { detailedNotes: '', noteSections: [] };
  }

  try {
    // Step 1: Deep Reasoning with Minimax
    console.log('Step 1: Deep Reasoning with Minimax...');
    const reasoningResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'minimax/minimax-m2.5:free',
        messages: [
          {
            role: 'user',
            content: `Analyze and reason deeply about the following study material titled "${title}". 
            Explain the core concepts, their relationships, and any complex logic or derivations involved.
            ${keyTopics ? `Focus specifically on these key topics: ${keyTopics.join(', ')}` : ''}
            
            Material Content:
            ${content}`
          }
        ],
        reasoning: { enabled: true }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-OpenRouter-Title': SITE_NAME,
          'Content-Type': 'application/json',
        }
      }
    );

    const reasoningMessage = reasoningResponse.data.choices[0]?.message;
    
    // Step 2: Structured Content Generation with Gemma
    console.log('Step 2: Structured Content Generation with Gemma...');
    const structuredResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemma-4-31b-it:free',
        messages: [
          {
            role: 'system',
            content: `You are an expert academic tutor. Take the provided reasoning and create extremely detailed, well-explained study notes.
            
            STRUCTURE REQUIREMENT:
            ${keyTopics ? `You MUST create a separate section for EACH of these specific key topics: ${keyTopics.join(', ')}.` : 'You MUST create a separate section for EACH of the key topics identified in the material.'}
            Each section must be a deep dive, explaining the topic in a very detailed and comprehensive form.
            
            Format the output as a JSON object with:
            1. "detailedNotes": A full markdown version of the notes.
            2. "noteSections": An array of objects, each containing:
               - "heading": The section title (MUST match one of the key topics).
               - "content": The extremely detailed explanation for this specific topic (Markdown).
               - "imagePrompt": A specific, descriptive prompt for an AI image generator to create a visual representation of this topic's core concept.
            
            Ensure each section is a "mini-lesson" on that specific key topic.`
          },
          {
            role: 'user',
            content: `Material Title: ${title}\n\nReasoning Context: ${reasoningMessage.content}`
          }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-OpenRouter-Title': SITE_NAME,
          'Content-Type': 'application/json',
        }
      }
    );

    const rawContent = structuredResponse.data.choices[0]?.message?.content || '{}';
    const cleanJson = rawContent.replace(/```json\n?|```/g, '').trim();
    const result = JSON.parse(cleanJson);
    
    return {
      detailedNotes: result.detailedNotes || '',
      noteSections: result.noteSections || []
    };
  } catch (error: any) {
    console.error('OpenRouter Error:', error.response?.data || error.message);
    return { detailedNotes: '', noteSections: [] };
  }
};
