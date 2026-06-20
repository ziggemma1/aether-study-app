import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Free models available on OpenRouter as of late 2024
const FREE_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemini-flash-1.5:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free"
];

interface AIResponse {
  content: string;
  modelUsed: string;
}

export const generateNoteWithOpenRouter = async (content: string): Promise<AIResponse> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables.');
  }

  const prompt = `You are a study guide creator. Convert the text below into a structured note.

Follow these rules exactly:
1. Start with "# [Topic Name]"
2. Use "## 📖 Key Concepts" for definitions
3. Use bullet points (-) for lists
4. Use "## ✅ Summary" at the end with 3-5 points
5. Keep each section short

Do not add extra commentary. Output only the note.
Do not compromise on content depth, ensure all key points are summarized.

Text to convert:
${content}`;

  let lastError: any = null;

  for (const model of FREE_MODELS) {
    try {
      console.log(`[AI] Attempting generation with model: ${model}`);
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.3, // Lower temp for more stable study notes
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://aether-study.app', // Optional for OpenRouter
            'X-Title': 'Aether Study', // Optional for OpenRouter
            'Content-Type': 'application/json'
          },
          timeout: 45000 // Free models can be slow
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        console.log(`[AI] Generation successful using ${model}`);
        return {
          content: response.data.choices[0].message.content,
          modelUsed: model
        };
      }
    } catch (error: any) {
      lastError = error;
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error?.message || error.message;
      
      console.warn(`[AI] Model ${model} failed (${status}): ${errorMsg}`);
      
      // If it's a rate limit or server error, we try the next model
      // If it's a specifically 401 (auth), we probably shouldn't bother with others but we do for safety
      continue;
    }
  }

  throw new Error(`AI generation failed across all free models. Last error: ${lastError?.message}`);
};
