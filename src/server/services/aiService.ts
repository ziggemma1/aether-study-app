import { GoogleGenAI, Type, Modality } from "@google/genai";
import axios from 'axios';
import { NoteSection, PlanSession } from "../../types.js";
import { validateAndFillNote } from "../../lib/note-validator";

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

const GEMINI_MODEL = "gemini-1.5-flash"; 

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

export const callOpenRouter = async (messages: any[], useJson = false): Promise<any> => {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY missing');
  
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
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
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
  if (OPENROUTER_API_KEY) {
    try {
      console.log(`[AI-Service] Using OpenRouter for analysis...`);
      return await analyzeWithOpenRouter(content, title, langPrompt);
    } catch (err: any) {
      console.warn(`[AI-Service] OpenRouter analysis failed: ${err.message}.`);
    }
  }

  if (!ai && !OPENROUTER_API_KEY) {
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

  if (OPENROUTER_API_KEY) {
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

  if (OPENROUTER_API_KEY) {
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

  if (OPENROUTER_API_KEY) {
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

  if (OPENROUTER_API_KEY) {
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
  
  const systemInstruction = `ROLE
You are an expert study coach and master teacher. Your only job is to transform raw academic source material into a deeply educational, structured study note. You are NOT a summariser. You are a teacher.

CORE RULES
1. Generate comprehensive, detailed notes based on the material provided.
2. Never copy or quote the source directly. Always rewrite in your own words as if you're teaching a student.
3. Organize all notes into the 5 XML sections below. Each section MUST contain meaningful content.
4. Standalone Lesson: Do NOT make any references to the source material, the uploaded PDF, files, or chapters (e.g. do NOT say "as mentioned in the text", "according to the document", or "in Chapter 1"). The note must be written as a completely standalone, self-contained lesson teaching the topic from first principles, so that the student does not need to refer back to the original file.

MANDATORY OUTPUT STRUCTURE
You must produce exactly 5 sections with substantial content:

<eli5>
Write a simple, beginner-friendly explanation using an analogy or real-world example.
Length: 2-3 full paragraphs (minimum 100 words).
Make it accessible to someone with no prior knowledge.
End with a sentence that connects the analogy to the actual topic.
</eli5>

<concepts>
List the 5-8 most important terms from the topic.
For EACH term provide:
  TERM: [term name]
  DEFINITION: [your explanation in 1-2 sentences]
  CONNECTS TO: [one other concept and why]
Separate each concept with a blank line.
</concepts>

<deep>
Write a detailed, rigorous explanation of the topic.
Length: 4-6 paragraphs (minimum 300 words).
Structure: Do not write it as one massive block of text. Break it up into well-organized sub-sections using Markdown subheadings (e.g., "#### [Sub-Concept/Mechanism Name]").
Use prose only within each section — NO bullet points and NO numbered lists.
Include mechanisms, formal definitions, and logical progression.
Connect to wider subject area at the end.
</deep>

<examples>
Provide 1 complete worked example with step-by-step solution.
Then provide 2 practice problems with hints.
Format:
  PROBLEM: [clear problem statement]
  APPROACH: [strategy]
  SOLUTION:
    Step 1 — [detailed step]
    Step 2 — [detailed step]
    ...
  RESULT: [final answer + meaning]
  
  PRACTICE 1: [problem]
  HINT: [nudge]
  
  PRACTICE 2 (stretch): [harder problem]
  HINT: [nudge]
</examples>

<summary>
Write exactly 5 takeaway sentences that capture the most important insights.
Then add:
  WATCH OUT: [the single most common mistake and why it happens]
</summary>

FORMATTING RULES
1. Start directly with <eli5>. No preamble.
2. All content must be inside the XML tags.
3. Write in complete sentences. No fragments.
4. Be thorough and comprehensive in each section.
5. Generate as much detail as needed to fully teach the topic.

QUALITY CHECK
[ ] Did I fill ALL 5 sections with content?
[ ] Is the eli5 genuinely accessible?
[ ] Are the concepts fully defined?
[ ] Is the deep section detailed and rigorous?
[ ] Are the examples realistic and solvable?
[ ] Does the summary capture key insights.`;

  const parseXmlToStructuredNote = (xml: string, noteTitle: string): any => {
    const eli5Match = xml.match(/<eli5[^>]*>([\s\S]*?)<\/eli5>/i);
    const conceptsMatch = xml.match(/<concepts[^>]*>([\s\S]*?)<\/concepts>/i);
    const deepMatch = xml.match(/<deep[^>]*>([\s\S]*?)<\/deep>/i);
    const examplesMatch = xml.match(/<examples[^>]*>([\s\S]*?)<\/examples>/i);
    const summaryMatch = xml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);

    const eli5 = eli5Match ? eli5Match[1].trim() : "";
    const conceptsText = conceptsMatch ? conceptsMatch[1].trim() : "";
    const deep = deepMatch ? deepMatch[1].trim() : "";
    const examples = examplesMatch ? examplesMatch[1].trim() : "";
    const summaryText = summaryMatch ? summaryMatch[1].trim() : "";

    const keyTerms: any[] = [];
    const keyConcepts: any[] = [];
    
    const deepParagraphs = deep.split(/\n\s*\n+/).filter(p => p.trim().length > 10);

    if (conceptsText) {
      const entries = conceptsText.split(/\n\s*\n+/);
      entries.forEach((entry, idx) => {
        const termMatch = entry.match(/TERM:\s*\[?([^\]\n]+)\]?/i) || entry.match(/TERM:\s*(.+)/i);
        const defMatch = entry.match(/DEFINITION:\s*\[?([^\]\n]+)\]?/i) || entry.match(/DEFINITION:\s*(.+)/i);
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

          let conceptDeepDive = "";
          if (idx === entries.length - 1) {
            conceptDeepDive = deepParagraphs.slice(idx).join('\n\n');
          } else {
            conceptDeepDive = deepParagraphs[idx] || "";
          }

          keyConcepts.push({
            name: term,
            definition,
            keyPoints: connectsTo ? [`Connects to: ${connectsTo}`] : [],
            example: "Application context from examples section.",
            memoryTip: connectsTo ? `Links with ${connectsTo}` : "Review explanation details.",
            deepDive: conceptDeepDive
          });
        }
      });
    }

    const summaryLines: string[] = [];
    let watchOut = "";
    if (summaryText) {
      const lines = summaryText.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed.toUpperCase().startsWith("WATCH OUT:")) {
          watchOut = trimmed.substring(10).trim();
        } else {
          const cleaned = trimmed.replace(/^[-*•\d.]+\s*/, '');
          summaryLines.push(cleaned);
        }
      });
    }

    return {
      title: noteTitle || "Study Note",
      learningObjectives: [
        "Explain the core concept using the ELI5 analogy",
        "Understand the key vocabulary and terms",
        "Analyze the mechanism and details in the deep dive"
      ],
      keyTerms,
      prerequisites: ["Review basic definitions and the ELI5 analogy first."],
      executiveSummary: eli5 ? eli5.split('\n')[0] : "Pedagogical study notes.",
      keyConcepts,
      summary: summaryLines,
      activeRecallQuestions: keyTerms.map(t => `What is the definition of ${t.term}?`),
      mnemonic: watchOut ? `WATCH OUT: ${watchOut}` : undefined
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
          systemInstruction
        }
      }));

      const text = response.text || "";
      if (text) {
        console.log(`[AI-Service] Gemini response received. Length: ${text.length}. Parsing XML...`);
        const structuredNote = parseXmlToStructuredNote(text, title);
        const validatedNote = validateAndFillNote(structuredNote, content, title);
        return { structuredNote: validatedNote, detailedNotes: text };
      }
    } catch (error: any) {
      console.warn(`[AI-Service] Gemini detailed notes failed, falling back to OpenRouter:`, error.message);
    }
  }

  if (OPENROUTER_API_KEY) {
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
        const structuredNote = parseXmlToStructuredNote(text, title);
        const validatedNote = validateAndFillNote(structuredNote, content, title);
        return { structuredNote: validatedNote, detailedNotes: text };
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
 
  if (OPENROUTER_API_KEY) {
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

export const generateSpeech = async (text: string): Promise<string | null> => {
  const ai = getAiClient();
  if (!ai) {
    console.error(`[AI-Service] No AI client for speech`);
    return null;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Read this summary clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
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

