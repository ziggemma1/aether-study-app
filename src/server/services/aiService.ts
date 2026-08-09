import { GoogleGenAI, Type, Modality } from "@google/genai";
import axios from 'axios';
import { NoteSection, PlanSession } from "../../types.js";
import { validateAndFillNote } from "../../lib/note-validator";

// Read lazily, NEVER at module scope.
//
// ES module imports are evaluated before the importing module's body, so this
// file used to capture process.env before server.ts had called dotenv.config().
// Both keys therefore read as undefined for the whole process lifetime — the
// logs showed "[AI-Service] Keys Status: Gemini=Missing, OpenRouter=Missing"
// immediately followed by "[INIT] Checking API Keys: Gemini=true,
// OpenRouter=true". Every AI call failed with "OPENROUTER_API_KEY missing"
// despite the key being present, so the Study Planner silently produced
// template plans instead of generated ones.
const getGeminiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY;

let aiClient: GoogleGenAI | null = null;
const getAiClient = () => {
  const key = getGeminiKey();
  if (!aiClient && key) {
    try {
      console.log(`[AI-Service] Initializing GoogleGenAI client...`);
      aiClient = new GoogleGenAI({ apiKey: key });
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

// gemini-1.5-flash now 404s on v1beta ("model is not found ... or is not supported
// for generateContent"), so every direct-Gemini call failed. 2.5-flash is the
// model this codebase already uses successfully via OpenRouter.
const GEMINI_MODEL = "gemini-2.5-flash"; 

// OpenRouter Logic
const FREE_MODELS = [
  'google/gemini-2.5-flash:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen3-coder:free',
  'openrouter/free'
];

const cleanJsonContent = (content: string): string => {
  if (!content) return "";
  
  // Strip safety wrappers like "User Safety: safe" prepended by some models
  let cleaned = content.replace(/^User Safety: safe\s*/i, '').trim();
  
  // Try to find the start and end of a JSON object/array
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return cleaned.substring(startIdx, endIdx + 1);
  }
  
  // Fallback: strip markdown code blocks
  cleaned = cleaned.replace(/```json\s?|```/g, '').trim();
  return cleaned;
};

const normalizeQuizQuestions = (questions: any) => {
  const raw = Array.isArray(questions) ? questions : (questions?.questions || []);
  
  // Filter out invalid items and things that don't look like questions
  return raw.filter((q: any) => 
    q && typeof q === 'object' && !Array.isArray(q) &&
    (q.question || q.text || q.prompt)
  ).map((q: any) => {
    // Extract options robustly
    let rawOptions = Array.isArray(q.options) ? q.options : (q.choices || q.answers || []);
    // Map options to strings if they are objects
    const options = rawOptions.map((opt: any) => {
      if (typeof opt === 'string') return opt;
      if (typeof opt === 'object' && opt !== null) return opt.text || opt.content || opt.option || JSON.stringify(opt);
      return String(opt);
    });
    
    // Fallback options if missing or too few
    const finalOptions = options.length >= 2 ? options.slice(0, 4) : ["A", "B", "C", "D"];

    // Determine correct answer index
    let correctAnswer = 0;
    if (!isNaN(Number(q.correctAnswer))) {
      correctAnswer = Number(q.correctAnswer);
    } else if (!isNaN(Number(q.answerIndex))) {
      correctAnswer = Number(q.answerIndex);
    } else if (!isNaN(Number(q.correctIndex))) {
      correctAnswer = Number(q.correctIndex);
    } else if (typeof q.correctAnswer === 'string') {
      // Try to find index of the string in options
      const idx = finalOptions.findIndex(opt => opt.toLowerCase() === q.correctAnswer.toLowerCase());
      if (idx !== -1) correctAnswer = idx;
    }

    return {
      question: String(q.question || q.text || q.prompt || "Question missing"),
      options: finalOptions,
      correctAnswer: Math.max(0, Math.min(correctAnswer, finalOptions.length - 1)),
      explanation: String(q.explanation || q.reasoning || q.answerDescription || "No explanation provided.")
    };
  });
};

const ANTI_GRAVITY_SYSTEM_PROMPT = `You are the Antigravity Curator—an invisible mentor inside the
Antigravity learning platform. You are not a generic AI assistant. You are a brilliant peer sitting
next to the user, helping them transform raw information into mastery.

## YOUR IDENTITY
- You explain like someone who genuinely wants the user to understand, not like a professor lecturing.
- You use analogies from unexpected domains (cooking, gaming, nature, coding, sports, music,
construction).
- You write conversationally: contractions, second person, sentence fragments, varied paragraph lengths.
- You are warm but precise. You are slightly irreverent but never arrogant.
- You NEVER reference "the uploaded material," "the source text," "the document," or "the provided
content." The notes ARE the knowledge. The source is invisible.

## YOUR OUTPUT STRUCTURE
You MUST output structured XML that will be parsed into JSON. Follow this exact structure:

<antigravity_notes>
<hook>
<!-- A provocative question or "What if..." scenario. Tied to real-world implication. NEVER starts
with "This document discusses..." or "The material covers..." -->
</hook>

<eli5>
<!-- One vivid metaphor from an unexpected domain. Real-world anchor. Explain it like the user is 5,
but respect their intelligence. -->
</eli5>

<concepts>
<!-- List of terms with core definitions. Frame them as "tools in your toolkit." Use bold for terms. -->
</concepts>

<deep>
<!-- High-density explanation using markdown headers. Headers MUST be phrased as user questions, not
topic labels. Example: "Why does this actually matter?" not "Significance" -->
</deep>

<examples>
<!-- Step-by-step worked problems or conceptual walkthroughs. Narrate them. Show the MISTAKE first,
then the fix. -->
</examples>

<watch_out>
<!-- Insider advice from someone who's seen students fail this exact concept. Specific. Slightly
irreverent. Bold the key warning. -->
</watch_out>

<antigravity_insight>
<!-- A single bolded pro-tip that feels like it came from the app itself, not the material. Format:
**🔥 Antigravity Insight:** [advice] -->
</antigravity_insight>
</antigravity_notes>

## VOICE RULES (MANDATORY)
1. NEVER start with "This document discusses...", "The material covers...", "The text explains...", or
any variant.
2. NEVER use "In conclusion," "Furthermore," "It is important to note," or robotic transitions.
3. NEVER use "think of it like..." more than once per section. Rotate metaphors.
4. NEVER reference the source material directly. The notes ARE the knowledge.
5. ALWAYS use second person ("you'll notice," "your job here is").
6. ALWAYS vary paragraph length. One-sentence paragraphs are encouraged.
7. ALWAYS end with the 🔥 Antigravity Insight.

## METAPHOR ROTATION (MANDATORY)
You MUST rotate through different metaphor domains. Do not repeat the same domain within a single output.
Allowed domains: cooking, gaming, nature, coding/tech, sports, music, construction.

## TIME-OF-DAY ADAPTATION
The current theme is: {{THEME}}
Adapt your tone accordingly:
- morning: Energetic, coffee-fueled enthusiasm. Quick wins. "Let's knock this out."
- day: Clear, structured, methodical. "Let's build this together."
- sunset: Reflective, narrative-driven, connecting dots across disciplines. "Here's something interesting..."
- night: Deep, philosophical, unafraid of complexity. "Let's get weird with this."`;

const getCurrentTheme = (): 'morning' | 'day' | 'sunset' | 'night' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'sunset';
  return 'night';
};

const getThemeAwareSystemPrompt = (): string => {
  const theme = getCurrentTheme();
  return ANTI_GRAVITY_SYSTEM_PROMPT.replace('{{THEME}}', theme);
};

export function sanitizeAntigravityOutput(rawOutput: string): string {
  const stripPatterns = [
    /^(This (document|text|material|source|content|passage|article|chapter|section))/gmi,
    /^(The (uploaded|provided|given|attached|submitted|input))/gmi,
    /^(Based on (the|this) (document|text|material|source|content))/gmi,
    /^(According to (the|this) (document|text|material|source|content))/gmi,
    /^(The (document|text|material|source|content) (discusses|covers|explains|describes|presents))/gmi,
    /In conclusion[,;:]?/gmi,
    /Furthermore[,;:]?/gmi,
    /Moreover[,;:]?/gmi,
    /It is important to note[,;:]?/gmi,
    /It should be noted[,;:]?/gmi,
    /As mentioned earlier[,;:]?/gmi,
    /To summarize[,;:]?/gmi,
    /In summary[,;:]?/gmi,
    /Think of it like/gmi,
    /Imagine that/gmi,
    /Picture this/gmi,
  ];

  const replacePatterns = [
    { from: /In addition[,;:]?/gmi, to: "Here's where it gets interesting:" },
    { from: /Additionally[,;:]?/gmi, to: "But wait—there's more:" },
    { from: /However[,;:]?/gmi, to: "Here's the twist:" },
    { from: /Therefore[,;:]?/gmi, to: "So here's the payoff:" },
    { from: /Thus[,;:]?/gmi, to: "Which means:" },
    { from: /Consequently[,;:]?/gmi, to: "And here's what happens:" },
    { from: /As a result[,;:]?/gmi, to: "Here's the result:" },
    { from: /For example[,;:]?/gmi, to: "Real talk:" },
    { from: /For instance[,;:]?/gmi, to: "Check this out:" },
    { from: /Specifically[,;:]?/gmi, to: "Here's the exact thing:" },
    { from: /In other words[,;:]?/gmi, to: "Translation:" },
    { from: /To put it simply[,;:]?/gmi, to: "Bottom line:" },
    { from: /Essentially[,;:]?/gmi, to: "At its core:" },
    { from: /Basically[,;:]?/gmi, to: "The real deal:" },
  ];

  let cleaned = rawOutput;

  // Strip patterns
  for (const pattern of stripPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Replace patterns
  for (const { from, to } of replacePatterns) {
    cleaned = cleaned.replace(from, to);
  }

  // Clean up extra whitespace from removals
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  return cleaned;
}

export function validateAntigravityOutput(output: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for source references
  if (/(this document|the material|the source|the text|uploaded content)/gi.test(output)) {
    errors.push("Output references source material directly");
  }

  // Check for generic transitions
  if (/(in conclusion|furthermore|moreover|it is important to note)/gi.test(output)) {
    errors.push("Output contains generic AI transitions");
  }

  // Check hook is question or "What if"
  const hookMatch = output.match(/<hook>([\s\S]*?)<\/hook>/);
  if (hookMatch && !/^\s*(What if|Why|How|When|Where|Who|Imagine|Picture|Consider)/i.test(hookMatch[1])) {
    errors.push("Hook does not start with a question or provocative scenario");
  }

  // Check for Antigravity Insight
  if (!/\*\*.*Antigravity Insight:/.test(output)) {
    errors.push("Missing 🔥 Antigravity Insight");
  }

  // Check for bolded terms in concepts
  const conceptsMatch = output.match(/<concepts>([\s\S]*?)<\/concepts>/);
  if (conceptsMatch && !/\*\*.*?\*\*/.test(conceptsMatch[1])) {
    errors.push("Concepts section missing bolded terms");
  }

  // Check for user-question headers in deep section
  const deepMatch = output.match(/<deep>([\s\S]*?)<\/deep>/);
  if (deepMatch) {
    const headers = deepMatch[1].match(/^#{1,3}\s+(.+)$/gm);
    if (headers) {
      for (const header of headers) {
        if (!/^#{1,3}\s+(Why|What|How|When|Where|Who|Which|Can|Could|Would|Should|Is|Are|Do|Does|Did|Will|Has|Have|Had)/i.test(header)) {
          errors.push(`Deep section header is not a user question: ${header}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}


export const callOpenRouter = async (messages: any[], useJson = false): Promise<any> => {
  if (!getOpenRouterKey()) throw new Error('OPENROUTER_API_KEY missing');
  
  let lastError: any = null;
  for (const model of FREE_MODELS) {
    // If json is requested, try first with response_format, then without it as fallback
    const attempts = (useJson && !model.includes('openrouter/free')) ? [true, false] : [false];
    
    for (const jsonMode of attempts) {
      try {
        const payload: any = { 
          model, 
          messages, 
          temperature: useJson ? 0.1 : 0.3 
        };
        
        if (jsonMode) {
          payload.response_format = { type: 'json_object' };
        }
        
        console.log(`[AI] Attempting OpenRouter model ${model} (JSON mode: ${jsonMode})`);
        
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', payload, {
          headers: {
            'Authorization': `Bearer ${getOpenRouterKey()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai.studio',
            'X-Title': 'Aether Study'
          },
          timeout: 90000 
        });

        if (response.data.choices?.[0]?.message) {
          const msg = response.data.choices[0].message;
          if (msg.content) return msg;
        }
        
        if (response.data?.error) {
          const errCode = response.data.error.code;
          console.warn(`[AI] Model ${model} returned API error (${errCode}):`, response.data.error.message);
          
          if (errCode === 429) {
            console.log(`[AI] Rate limited on ${model}, waiting 2s before next model...`);
            await sleep(2000);
            break; // Break the attempts loop, try next model
          }
          
          if (errCode === 400 && jsonMode) {
            console.log(`[AI] Model ${model} returned 400 error in JSON mode. Retrying without response_format...`);
            continue; // Try next attempt for this model
          }
        }
      } catch (err: any) {
        lastError = err;
        const status = err.response?.status;
        const details = err.response?.data?.error?.message || err.message;
        console.warn(`[AI] Model ${model} failed (${status || 'No Status'}): ${details}`);
        
        if (status === 429) {
          console.log(`[AI] Status 429 on ${model}, waiting 2s...`);
          await sleep(2000);
          break; // Break the attempts loop, try next model
        }
        
        if ((status === 400 || details.includes('format')) && jsonMode) {
          console.log(`[AI] Status ${status} in JSON mode, retrying without response_format...`);
          continue; // Try next attempt for this model
        }
      }
    }
  }
  throw lastError || new Error('All models failed');
};

// Shared Logic exported for controllers
export const analyzeStudyMaterial = async (content: string, title: string, language: string = "English (US)") => {
  console.log(`[AI-Service] analyzeStudyMaterial called for: ${title}`);
  
  const langPrompt = language === 'English (UK)' ? 'British English' : language === 'Indonesia' ? 'Indonesian (Bahasa Indonesia)' : 'American English';
  
  const ai = getAiClient();
  
  // Try direct Gemini FIRST for reliability
  if (ai) {
    try {
      console.log(`[AI-Service] Attempting direct Gemini analysis...`);
      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
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
      if (text) {
        const result = JSON.parse(cleanJsonContent(text));
        const normalizedQuiz = normalizeQuizQuestions(result.suggestedQuizQuestions);
        return { 
          ...result, 
          detailedNotes: result.simpleDetailedNotes,
          suggestedQuizQuestions: normalizedQuiz
        };
      }
    } catch (error: any) {
      console.warn(`[AI-Service] Direct Gemini analysis failed, falling back to OpenRouter:`, error.message);
    }
  }

  // Try OpenRouter as SECOND option
  if (getOpenRouterKey()) {
    try {
      console.log(`[AI-Service] Using OpenRouter for analysis...`);
      return await analyzeWithOpenRouter(content, title, langPrompt);
    } catch (err: any) {
      console.warn(`[AI-Service] OpenRouter analysis failed: ${err.message}.`);
    }
  }

  if (!ai && !getOpenRouterKey()) {
    console.error(`[AI-Service] No AI providers available!`);
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
};

const analyzeWithOpenRouter = async (content: string, title: string, langPrompt: string) => {
  const response = await callOpenRouter([
    {
      role: 'system',
      content: `Analyze the material and return JSON with summary, keyTopics, realLifeApplications, simpleDetailedNotes, and suggestedQuizQuestions. All text MUST be in ${langPrompt}.`
    },
    { role: 'user', content: `Title: ${title}\nContent: ${content.substring(0, 15000)}` }
  ], true);
  const result = JSON.parse(cleanJsonContent(response.content));
  const normalizedQuiz = normalizeQuizQuestions(result.suggestedQuizQuestions);
  
  return { 
    ...result, 
    detailedNotes: result.simpleDetailedNotes,
    suggestedQuizQuestions: normalizedQuiz
  };
};

export const generateFlashcards = async (content: string, language: string, count: number) => {
  const prompt = `Create ${count} flashcards in ${language} from the following content. Return a JSON array of objects with "question" and "answer" properties.`;
  
  const ai = getAiClient();
  if (ai) {
    try {
      console.log(`[AI-Service] Attempting direct Gemini for flashcards...`);
      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
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
      return JSON.parse(cleanJsonContent(response.text || "[]"));
    } catch (err: any) {
      console.warn(`[AI-Service] Gemini flashcards failed, falling back to OpenRouter:`, err.message);
    }
  }

  if (getOpenRouterKey()) {
    try {
      console.log(`[AI-Service] Using OpenRouter for flashcards (Fallback)...`);
      const response = await callOpenRouter([
        { role: 'system', content: prompt + " Return JSON array with question/answer." },
        { role: 'user', content: content.substring(0, 10000) }
      ], true);
      return JSON.parse(cleanJsonContent(response.content));
    } catch (err: any) {
      console.warn(`[AI-Service] OpenRouter flashcards fallback failed:`, err.message);
    }
  }

  // Final static fallback
  return [
    { question: "Summary of main topic?", answer: "The provided content covers key aspects of the study material." }
  ];
};

export const generateQuiz = async (content: string, language: string, count: number, difficulty: string, complexity: string) => {
  const prompt = `Create ${count} ${difficulty} level MCQs with ${complexity} complexity in ${language} based on the content. Return a JSON array of objects with "question", "options" (array of 4 strings), "correctAnswer" (index 0-3), and "explanation".`;

  const ai = getAiClient();
  if (ai) {
    try {
      console.log(`[AI-Service] Attempting direct Gemini for quiz...`);
      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
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
      return normalizeQuizQuestions(JSON.parse(response.text || "[]"));
    } catch (err: any) {
      console.warn(`[AI-Service] Gemini quiz failed, falling back to OpenRouter:`, err.message);
    }
  }

  if (getOpenRouterKey()) {
    try {
      console.log(`[AI-Service] Using OpenRouter for quiz generation (Fallback)...`);
      const response = await callOpenRouter([
        { role: 'system', content: prompt + " Return JSON array." },
        { role: 'user', content: content.substring(0, 10000) }
      ], true);
      return normalizeQuizQuestions(JSON.parse(cleanJsonContent(response.content)));
    } catch (err: any) {
      console.warn(`[AI-Service] OpenRouter quiz fallback failed:`, err.message);
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
  const systemPrompt = `You are a friendly and academic tutor for the study material: "${materialTitle}". 
  Context: ${materialContent.substring(0, 5000)}.
  All your responses MUST be in ${language}. 
  Be encouraging, explain concepts clearly, and ask occasional follow-up questions to test understanding.`;

  const ai = getAiClient();
  if (ai) {
    try {
      console.log(`[AI-Service] Attempting direct Gemini for tutor chat...`);
      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
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
      console.warn(`[AI-Service] Gemini tutor failed, falling back to OpenRouter:`, err.message);
    }
  }

  if (getOpenRouterKey()) {
    try {
      console.log(`[AI-Service] Using OpenRouter for tutor chat (Fallback)...`);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map((h: any) => ({ role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user', content: h.parts?.[0]?.text || h.content })),
        { role: 'user', content: userMessage }
      ];
      const response = await callOpenRouter(messages);
      return response.content;
    } catch (err: any) {
      console.warn(`[AI-Service] OpenRouter tutor chat fallback failed:`, err.message);
    }
  }

  return "I'm having trouble connecting to my AI brain. Please try again later!";
};

export const generateStudyPlan = async (materials: any[], startDate: string, duration: number, goal: string, complexity: string, commitment: string, language: string) => {
  const materialContext = materials.map(m => `Title: ${m.title}`).join(', ');
  const systemPrompt = `Create a study plan for ${duration} days starting ${startDate} for the following materials: ${materialContext}. 
  Goal: ${goal}. 
  Complexity: ${complexity}.
  Commitment Level: ${commitment}.
  Language: ${language}.
  Return valid JSON array of session objects.`;

  const ai = getAiClient();
  if (ai) {
    try {
      console.log(`[AI-Service] Attempting direct Gemini for study plan...`);
      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
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
      return JSON.parse(cleanJsonContent(response.text || "[]"));
    } catch (err: any) {
      console.warn(`[AI-Service] Gemini study plan failed, falling back to OpenRouter:`, err.message);
    }
  }

  if (getOpenRouterKey()) {
    try {
      console.log(`[AI-Service] Using OpenRouter for study plan (Fallback)...`);
      const response = await callOpenRouter([
        { role: 'system', content: systemPrompt + " Return JSON array of sessions." },
        { role: 'user', content: `Generate JSON study plan.` }
      ], true);
      return JSON.parse(cleanJsonContent(response.content));
    } catch (err: any) {
      console.warn(`[AI-Service] OpenRouter study plan fallback failed:`, err.message);
    }
  }

  return [{ day: 1, topic: "Quick Review", activities: ["Read through materials"], duration: "30 mins" }];
};

export const generateDetailedNotes = async (content: string, title: string) => {
  console.log(`[AI-Service] generateDetailedNotes called for: ${title}`);
  
  const systemInstruction = getThemeAwareSystemPrompt();

  const parseXmlToStructuredNote = (xml: string, noteTitle: string): any => {
    const hookMatch = xml.match(/<hook[^>]*>([\s\S]*?)<\/hook>/i);
    const eli5Match = xml.match(/<eli5[^>]*>([\s\S]*?)<\/eli5>/i);
    const conceptsMatch = xml.match(/<concepts[^>]*>([\s\S]*?)<\/concepts>/i);
    const deepMatch = xml.match(/<deep[^>]*>([\s\S]*?)<\/deep>/i);
    const examplesMatch = xml.match(/<examples[^>]*>([\s\S]*?)<\/examples>/i);
    const watchOutMatch = xml.match(/<watch_out[^>]*>([\s\S]*?)<\/watch_out>/i);
    const insightMatch = xml.match(/<antigravity_insight[^>]*>([\s\S]*?)<\/antigravity_insight>/i);

    const hook = hookMatch ? hookMatch[1].trim() : "";
    const eli5 = eli5Match ? eli5Match[1].trim() : "";
    const conceptsText = conceptsMatch ? conceptsMatch[1].trim() : "";
    const deep = deepMatch ? deepMatch[1].trim() : "";
    const examples = examplesMatch ? examplesMatch[1].trim() : "";
    const watchOut = watchOutMatch ? watchOutMatch[1].trim() : "";
    const rawInsight = insightMatch ? insightMatch[1].trim() : "";
    
    // Clean up LaTeX or format nicely
    let insight = rawInsight;
    if (insight.includes("Antigravity Insight:")) {
      const idx = insight.indexOf("Antigravity Insight:");
      insight = insight.substring(idx).trim();
      insight = insight.replace(/\*\*$/, "").trim();
      insight = `**🔥 Antigravity Insight:** ${insight.substring("Antigravity Insight:".length).replace(/^[^a-zA-Z0-9]*/, "").trim()}`;
    } else if (insight && !insight.startsWith("**")) {
      insight = `**🔥 Antigravity Insight:** ${insight}`;
    }

    const keyTerms: any[] = [];
    const keyConcepts: any[] = [];

    // Parse conceptsText line by line
    if (conceptsText) {
      const lines = conceptsText.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const lineMatch = trimmed.match(/^\s*[-*•]?\s*\*\*(.*?)\*\*:\s*(.*)$/);
        if (lineMatch) {
          const term = lineMatch[1].trim();
          const rawDef = lineMatch[2].trim();
          
          const connMatch = rawDef.match(/connects to\s*(?:\[|["'])?([^.\]]+)(?:\]|["'])?/i);
          const connectsTo = connMatch ? connMatch[1].trim() : "";
          
          let definition = rawDef;
          const connectsToIdx = rawDef.toLowerCase().indexOf("how it connects to");
          if (connectsToIdx !== -1) {
            definition = rawDef.substring(0, connectsToIdx).trim();
            if (!definition.endsWith('.')) {
              definition += '.';
            }
          }

          keyTerms.push({
            term,
            definition,
            memoryTip: connectsTo ? `Connects to: ${connectsTo}` : ""
          });
        }
      });
    }

    // Legacy fallback
    if (keyTerms.length === 0 && conceptsText) {
      const entries = conceptsText.split(/\n\s*\n+/);
      entries.forEach((entry) => {
        const termMatch = entry.match(/TERM:\s*\[?([^\]\n]+)\]?/i) || entry.match(/TERM:\s*(.+)/i) || entry.match(/^\s*\*\*(.*?)\*\*/);
        const defMatch = entry.match(/DEFINITION:\s*\[?([^\]\n]+)\]?/i) || entry.match(/DEFINITION:\s*(.+)/i) || entry.match(/:\s*(.*)$/);
        const connMatch = entry.match(/CONNECTS TO:\s*\[?([^\]\n]+)\]?/i) || entry.match(/CONNECTS TO:\s*(.+)/i);
        if (termMatch && defMatch) {
          const term = termMatch[1].trim();
          const definition = defMatch[1].trim();
          const connectsTo = connMatch ? connMatch[1].trim() : "";
          
          keyTerms.push({
            term,
            definition,
            memoryTip: connectsTo ? `Connects to: ${connectsTo}` : ""
          });
        }
      });
    }

    // Split deep section by headers (### or ####) to generate multiple pages/keyConcepts
    const deepSections: { heading: string, content: string }[] = [];
    const headerRegex = /^(#{1,4})\s+(.+)$/gm;
    const matches = Array.from(deep.matchAll(headerRegex));

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index!;
        const end = i < matches.length - 1 ? matches[i + 1].index! : deep.length;
        const headerText = matches[i][0];
        const headerTitle = matches[i][2].trim();
        const sectionContent = deep.substring(start + headerText.length, end).trim();
        deepSections.push({ heading: headerTitle, content: sectionContent });
      }
    } else {
      const paragraphs = deep.split(/\n\s*\n+/).filter(p => p.trim().length > 10);
      paragraphs.forEach((p, idx) => {
        deepSections.push({ heading: `Deep Dive Part ${idx + 1}`, content: p });
      });
    }

    if (deepSections.length > 0) {
      deepSections.forEach((sec, idx) => {
        const keyPoints = sec.content
          .split(/[.!?]/)
          .map(s => s.replace(/^[-*•\s\d.]+\s*/, '').trim())
          .filter(s => s.length > 15)
          .slice(0, 3);

        const memoryTip = idx === 0 && insight ? insight : `Review ${sec.heading} details carefully.`;
        const exampleText = idx === 0 && examples ? examples : `Applying ${sec.heading} concepts in practice.`;

        keyConcepts.push({
          name: sec.heading,
          definition: cleanSentenceTruncate(sec.content, 250),
          keyPoints: keyPoints.length > 0 ? keyPoints : ["Core concept mechanics"],
          example: exampleText,
          memoryTip,
          deepDive: sec.content
        });
      });
    } else {
      keyConcepts.push({
        name: "Deep Dive Analysis",
        definition: "Detailed deconstruction of the concepts.",
        keyPoints: ["System mechanics", "Core definitions"],
        example: examples || "Worked walkthroughs.",
        memoryTip: insight || "Pay close attention to key definitions.",
        deepDive: deep || "Review notes detail."
      });
    }

    const summaryLines: string[] = [];
    if (deep) {
      const sentences = deep.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 20);
      for (let i = 0; i < Math.min(5, sentences.length); i++) {
        summaryLines.push(sentences[i] + ".");
      }
    }
    if (summaryLines.length === 0) {
      summaryLines.push("Focus on core terms and deconstructed explanations.");
    }
    if (watchOut) {
      summaryLines.push(`**WATCH OUT:** ${watchOut}`);
    }

    const execSummary = hook ? `${hook}\n\n${eli5}` : (eli5 || "Pedagogical study notes.");

    return {
      title: noteTitle || "Study Note",
      learningObjectives: [
        "Explain the core concept using the ELI5 analogy",
        "Understand the key vocabulary and terms",
        "Analyze the mechanism and details in the deep dive"
      ],
      keyTerms,
      prerequisites: ["Review basic definitions and the ELI5 analogy first."],
      executiveSummary: execSummary,
      keyConcepts,
      summary: summaryLines,
      activeRecallQuestions: keyTerms.map(t => `What is the definition of ${t.term}?`),
      mnemonic: insight || (watchOut ? `WATCH OUT: ${watchOut}` : undefined)
    };
  };

  const promptText = `Generate structured study notes on the following material:
  
  ${content.substring(0, 15000)}`;

  const ai = getAiClient();
  if (ai) {
    try {
      console.log(`[AI-Service] Attempting direct Gemini for XML detailed notes...`);
      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: promptText }]}],
        config: {
          temperature: 0.4,
          maxOutputTokens: 8192,
          systemInstruction: systemInstruction
        }
      }));

      const text = response.text || "";
      if (text) {
        console.log(`[AI-Service] Gemini response received. Length: ${text.length}. Parsing XML...`);
        const sanitized = sanitizeAntigravityOutput(text);
        const validation = validateAntigravityOutput(sanitized);
        if (!validation.valid) {
          console.warn(`[AI-Service] Output validation failed (Gemini):`, validation.errors);
        }
        const structuredNote = parseXmlToStructuredNote(sanitized, title);
        const validatedNote = validateAndFillNote(structuredNote, content, title);
        return { structuredNote: validatedNote, detailedNotes: sanitized };
      }
    } catch (error: any) {
      console.warn(`[AI-Service] Gemini detailed notes failed, falling back to OpenRouter:`, error.message);
    }
  }

  if (getOpenRouterKey()) {
    console.log(`[AI-Service] Using OpenRouter for XML detailed notes (Fallback)...`);
    try {
      const response = await callOpenRouter([
        { 
          role: 'system', 
          content: systemInstruction 
        },
        { role: 'user', content: promptText }
      ], false);
      
      const text = response.content || "";
      if (text) {
        console.log(`[AI-Service] OpenRouter response received. Length: ${text.length}. Parsing XML...`);
        const sanitized = sanitizeAntigravityOutput(text);
        const validation = validateAntigravityOutput(sanitized);
        if (!validation.valid) {
          console.warn(`[AI-Service] Output validation failed (OpenRouter):`, validation.errors);
        }
        const structuredNote = parseXmlToStructuredNote(sanitized, title);
        const validatedNote = validateAndFillNote(structuredNote, content, title);
        return { structuredNote: validatedNote, detailedNotes: sanitized };
      }
    } catch (err: any) {
      console.error(`[AI-Service] OpenRouter detailed notes fallback failed:`, err.message);
    }
  }

  // Final static fallback - validated and filled
  console.warn(`[AI-Service] Using static fallback for detailed notes...`);
  const finalFallback = validateAndFillNote({}, content, title);
  return {
    structuredNote: finalFallback,
    detailedNotes: `<eli5>No notes available. Please try regenerating.</eli5><concepts></concepts><deep></deep><examples></examples><summary></summary>`
  };
};

const cleanSentenceTruncate = (text: string, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  
  const sub = text.substring(0, maxLength);
  const lastDot = Math.max(sub.lastIndexOf('.'), sub.lastIndexOf('!'), sub.lastIndexOf('?'));
  
  if (lastDot > maxLength * 0.5) {
    return text.substring(0, lastDot + 1);
  }
  
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return text.substring(0, lastSpace) + '...';
  }
  
  return sub + '...';
};

export const generateAcademicMegaNotes = async (content: string, title: string) => {
  console.log(`[AI-Service] generateAcademicMegaNotes (12+ Pages Cornell/Feynman Deep Analysis) called for: ${title}`);
  
  const systemInstruction = `You are an elite academic curriculum designer and expert in cognitive learning frameworks.
      Your goal is to transform the provided study material into an intensive, 6-to-8 page comprehensive, high-yield study guide.
      
      You MUST generate 6 to 8 entries in the JSON array (each representing an in-depth webpage text section/chapter/slide).
      For each entry, you must intelligently choose between two specialized, powerful learning styles:
      
      1. 'Cornell': Highly-structured lecture and book study layouts. MUST use this exact format structure:
         ### 📑 CORNELL STUDY MODULE: [Heading]
         
         #### 🎯 Central Focus
         * **Concept to Master:** [conceptAnalyzed]
         * **Target recall:** [What study goals should be reached]
         
         #### 🔍 CUE COLUMN (Active Recall Prompts)
         * *Prompt 1:* [Thought-provoking recall trigger]
         * *Prompt 2:* [Analytical question connecting system concepts]
         * *Prompt 3:* [Applied operational drill question]
         
         #### 📝 HIGH-DENSITY LECTURE NOTES (Textbook Style)
         [Extensive, highly detailed explanation of subtopics with deep definitions, steps, parameters, and full architectural breakdowns. Write in concise, structured bullet points rather than long paragraphs to keep it readable and focused.]
         
         #### 🛠️ PRACTICAL SCENARIO IN ACTION
         * **Context:** [Detailed real-life scenario background]
         * **Application:** [How this theory resolves the problem in practice]
         * **Observed Outcome:** [Detailed results and structural analysis]
         
         #### 📑 SYNTHESISED SUMMARY
         [A high-level synthesis combining all key takeaways into a cohesive, memorable structural outline.]
 
      2. 'Feynman': Mastering tricky, abstract, or complex concepts by explaining simply, utilizing powerful metaphors, and addressing deep blind spots. MUST use this exact format structure:
         ### 🧠 FEYNMAN MASTERCLASS: [Heading]
         
         #### 🎯 Conceptual Anchor
         * **Concept:** [conceptAnalyzed]
         * **Pedagogical aim:** Deconstructing high-complexity abstractions into elegant simplicity.
         
         #### 👶 ELI5 (Explain Like I'm Five)
         [An incredibly simple, crystal-clear conceptual explanation that uses a highly creative, simple real-world analogy. Ensure it reads with absolute clarity, bypassing any heavy terminology list.]
         
         #### ⚙️ MECHANICS DECONSTRUCTION (Deep, Rigorous Explanation)
         [Explain the complex system mechanism step-by-step with high logical precision. We simplify the vocabulary and retain absolute structural depth and textbook accuracy. Every detail of how the theory actually works under the hood is fully explained in clear bullet points or short punchy paragraphs.]
         
         #### 💡 DEEP ANALOGY & GAP IDENTIFICATION (Pinpoint Gaps)
         * **The Analogy:** [A powerful analogy structured to highlight relationships of elements]
         * **Typical Student Blindspot (Misconception):** [Identify where students make false logical transitions or false assumptions]
         * **The Correction:** [The precise academic correction to establish absolute technical correctness]
         
         #### 🛠️ COMPREHENSIVE SCENARIO IN ACTION
         * **Scenario:** [A rich, immersive, real-world narrative detailing how this mechanism works in an actual production, business, scientific, or academic context]
         * **Mechanic Breakdown:** [Step-by-step analysis of how it is applied in this scenario]
 
      CRITICAL REQUIREMENTS:
      - Each page/entry must be highly concise, structured, and easy to read on mobile. Avoid massive, long-winded paragraphs. Keep each entry's content to a clear, bulleted summary (around 400-600 characters max per section) containing active recall cues, clear comparisons, and concise definitions.
      - Alternate or select the style that truly fits each topic/subtopic analyzed.
      - Never leave fields blank.
      - Return valid JSON matching the schema.`;
 
  const promptText = `Generate 6 to 8 full detailed pages. Ensure each page is highly concise (400-600 characters max per section) and formatted beautifully with markdown bullet points covering key sections and subtopics of the material.
Material Title: ${title}
Source Content to Analyze:
${content.substring(0, 18000)}`;
 
  const ai = getAiClient();
  if (ai) {
    try {
      console.log(`[AI-Service] Attempting direct Gemini for Academic Mega Notes...`);
      const response = await withRetry(() => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: promptText }]}],
        config: {
          temperature: 0.4,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                content: { type: Type.STRING },
                noteStyle: { type: Type.STRING },
                conceptAnalyzed: { type: Type.STRING }
              },
              required: ["heading", "content", "noteStyle", "conceptAnalyzed"]
            }
          },
          systemInstruction
        }
      }));
 
      const text = response.text || "";
      if (text) {
        try {
          const result = JSON.parse(cleanJsonContent(text));
          console.log(`[AI-Service] Gemini academic notes parsed successfully with ${result.length} chapters.`);
          return result;
        } catch (parseErr) {
          console.error("[AI-Service] Failed to parse Academic Mega Notes as JSON", parseErr);
        }
      }
    } catch (err: any) {
      console.warn(`[AI-Service] Gemini academic mega notes failed, falling back to OpenRouter:`, err.message);
    }
  }
 
  if (getOpenRouterKey()) {
    console.log(`[AI-Service] Using OpenRouter for Academic Mega Notes (Fallback)...`);
    try {
      const response = await callOpenRouter([
        { role: 'system', content: systemInstruction },
        { role: 'user', content: promptText }
      ], true);
      
      try {
        const result = JSON.parse(cleanJsonContent(response.content));
        console.log(`[AI-Service] OpenRouter academic notes parsed with ${result.length} chapters.`);
        console.log(`[AI-Service] OpenRouter academic notes parsed.`);
        return result;
      } catch (parseErr) {
        console.warn("[AI-Service] OpenRouter returned non-JSON for academic notes");
      }
    } catch (err: any) {
      console.warn(`[AI-Service] OpenRouter academic mega notes fallback failed:`, err.message);
    }
  }
 
  // Final static fallback - build dynamic, content-driven page designs from the user's uploaded material
  console.warn(`[AI-Service] Using dynamic fallback for Academic Mega Notes...`);
  
  const paragraphs = (content || "").split(/\n+/).map(p => p.trim()).filter(p => p.length > 25);
  const numPages = Math.min(6, Math.max(3, paragraphs.length));
  
  if (paragraphs.length >= 3) {
    const groupSize = Math.ceil(paragraphs.length / numPages);
    return Array.from({ length: numPages }).map((_, index) => {
      const chunkParagraphs = paragraphs.slice(index * groupSize, (index + 1) * groupSize);
      if (chunkParagraphs.length === 0) {
        return {
          heading: `Concept Overview ${index + 1}`,
          content: "No extra content available for this section.",
          noteStyle: index % 2 === 0 ? 'Cornell' : 'Feynman',
          conceptAnalyzed: `Deconstructing Concept ${index + 1}`
        };
      }
      const combinedText = chunkParagraphs.join('\n\n');
      const heading = chunkParagraphs[0].split(/\s+/).slice(0, 4).join(' ').replace(/[^a-zA-Z0-9 ]/g, '') || `Concept Part ${index + 1}`;
      const isCornell = index % 2 === 0;
      const style = isCornell ? 'Cornell' : 'Feynman';
      
      let simulatedContent = "";
      if (isCornell) {
        simulatedContent = `### 📑 CORNELL STUDY MODULE: ${heading}
 
#### 🎯 Central Focus
* **Concept to Master:** Deconstructing ${heading}
* **Target recall:** Master definitions, key mechanics, and practical applications.
 
#### 🔍 CUE COLUMN (Active Recall Prompts)
* *Prompt 1:* Define ${heading} based on the study text.
* *Prompt 2:* What are the primary subcomponents or implications of this concept?
 
#### 📝 HIGH-DENSITY LECTURE NOTES (Textbook Style)
* ${chunkParagraphs.join('\n* ')}
 
#### 🛠️ PRACTICAL SCENARIO IN ACTION
* **Context:** Understanding the real-world application of ${heading}.
* **Application:** Deploying these principles systematically to solve target challenges.
* **Observed Outcome:** Confirms efficiency and validates the core theory.
 
#### 📑 SYNTHESISED SUMMARY
* Establish a clear structural representation of ${heading}.
* Regularly answer cue prompts to check retention.`;
      } else {
        simulatedContent = `### 🧠 FEYNMAN MASTERCLASS: ${heading}
 
#### 🎯 Conceptual Anchor
* **Concept:** ${heading} (Simplified)
* **Pedagogical aim:** Deconstructing high-complexity abstractions into elegant simplicity.
 
#### 👶 ELI5 (Explain Like I'm Five)
${cleanSentenceTruncate(chunkParagraphs[0], 250)}
 
#### ⚙️ MECHANICS DECONSTRUCTION (Deep, Rigorous Explanation)
* ${chunkParagraphs.join('\n* ')}
 
#### 💡 DEEP ANALOGY & GAP IDENTIFICATION (Pinpoint Gaps)
* **The Analogy:** Mapped sequence similar to daily organization.
* **Typical Student Blindspot:** Overcomplicating basic definitions.
* **The Correction:** Focus first on the base definitions before building complex dependencies.
 
#### 🛠️ COMPREHENSIVE SCENARIO IN ACTION
* **Scenario:** Application in real-world environments.
* **Mechanic Breakdown:** Step-by-step analysis of how it manifests.`;
      }
 
      return {
        heading: `Page ${index + 1}: ${heading}`,
        content: simulatedContent,
        noteStyle: style,
        conceptAnalyzed: `Deconstructing ${heading}`
      };
    });
  }

  // Ultra-fallback if text is too short to split into paragraphs
  const topics = [
    "Core Structural Foundations", "System Architectural Mechanics", "Critical Logic & Control Workflows"
  ];
  return topics.map((heading, index) => {
    const isCornell = index % 2 === 0;
    const style = isCornell ? 'Cornell' : 'Feynman';
    return {
      heading: `Page ${index + 1}: ${heading}`,
      content: isCornell ? `### 📑 CORNELL STUDY MODULE: ${heading}\n\n#### 🎯 Central Focus\n* **Concept to Master:** Deconstructing ${heading}\n\n#### 📝 HIGH-DENSITY LECTURE NOTES\n* Focus on basic study guidelines.\n* Review definitions.` : `### 🧠 FEYNMAN MASTERCLASS: ${heading}\n\n#### 🎯 Conceptual Anchor\n* **Concept:** ${heading}\n\n#### 👶 ELI5\nImagine organizing a simple desk workspace.`,
      noteStyle: style,
      conceptAnalyzed: `Deconstructing ${heading}`
    };
  });
};

/** Gemini prebuilt voices the shop can sell. Anything else falls back to Kore. */
const ALLOWED_VOICES = new Set(['Kore', 'Puck', 'Charon', 'Aoede']);

/**
 * @param voiceName the caller's equipped voice. The name was hardcoded to
 *   'Kore' before, which is why the shop's two 300–500 point "AI Voices"
 *   changed nothing about what you heard.
 */
export const generateSpeech = async (text: string, voiceName?: string): Promise<string | null> => {
  const ai = getAiClient();
  if (!ai) {
    console.error(`[AI-Service] No AI client for speech`);
    return null;
  }
  const voice = voiceName && ALLOWED_VOICES.has(voiceName) ? voiceName : 'Kore';
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Read this summary clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error: any) {
    console.error("[AI-Service] Error generating speech:", error.message);
    return null;
  }
};

