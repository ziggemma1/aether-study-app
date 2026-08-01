import { Request, Response } from 'express';
import { StudyPlan } from '../models/StudyPlan.js';
import { Material as MaterialModel } from '../models/Material.js';
import { GoogleGenAI, Type } from '@google/genai';
import { callOpenRouter } from '../services/aiService.js';

const getAiClient = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

export const generateStudyPlan = async (req: Request, res: Response) => {
  try {
    const { 
      materialIds = [], 
      startDate, 
      duration = 7, 
      goal = 'Exam Prep', 
      complexity = 'Intermediate', 
      dailyCommitment = 60, // in minutes
      preferredTime = 'Afternoon',
      focusAreas = []
    } = req.body;

    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!startDate) {
      return res.status(400).json({ message: 'Start date is required' });
    }

    // 1. Fetch material titles for context
    let materialTitles: string[] = [];
    if (materialIds && materialIds.length > 0) {
      try {
        const dbMaterials = await MaterialModel.find({
          _id: { $in: materialIds }
        });
        materialTitles = dbMaterials.map(m => `${m.title} (${m.type})`);
      } catch (err: any) {
        console.error('[StudyPlan] Error looking up materials:', err);
      }
    }

    if (materialTitles.length === 0) {
      materialTitles = ['General Curriculum / General Concepts'];
    }

    // 2. AI Plan Generation
    let planData = {
      title: `${goal} Study Plan`,
      days: [] as any[]
    };

    const systemPromptHead = `You are an expert pedagogical study planner. Create a highly optimized, day-by-day customized study plan.
        Input Materials: [${materialTitles.join(', ')}]
        Duration: ${duration} days
        Learning Goal: ${goal}
        Complexity Level: ${complexity}
        Daily Study Commitment: ${dailyCommitment} minutes
        Preferred Studying Time: ${preferredTime}
        Specific Focus Areas: ${focusAreas.join(', ') || 'Comprehensive General Coverage'}

        CRITICAL: Compile a realistic Day-by-Day sequence of activities mapped directly from the target learning materials.
        Each day must have a focused topic, and a list of 2-3 specific, actionable activities (e.g. read study notes, run quizzes, review flashcards, summary checks).
        The estimated review time for the activities should sum up to approximately ${dailyCommitment} minutes.`;

    const jsonSchemaInstructions = `Return valid JSON in the exact schema specified below:
        {
          "title": "A precise, inspiring academic title for the plan",
          "days": [
            {
              "day": 1,
              "topic": "Daily outcome focused topic (e.g., Core Principles of Set Theory)",
              "activities": ["Read Section 1.1 definitions", "Self-test with key terms Comparisons"],
              "estimatedTime": ${dailyCommitment}
            }
          ]
        }`;

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    let generationSucceeded = false;

    // Try OpenRouter First
    if (OPENROUTER_API_KEY) {
      try {
        console.log(`[StudyPlanController] Attempting generation with OpenRouter...`);
        const messages = [
          { role: 'system', content: systemPromptHead + "\n" + jsonSchemaInstructions },
          { role: 'user', content: "Please generate my personalized JSON study plan." }
        ];
        const response = await callOpenRouter(messages, true);
        const parsed = JSON.parse(response.content.replace(/```json|```/g, ''));
        if (parsed.title && parsed.days) {
          planData = parsed;
          generationSucceeded = true;
        }
      } catch (err: any) {
        console.error('[StudyPlanController] OpenRouter generation error:', err.message);
      }
    }

    // Fallback to direct Gemini
    if (!generationSucceeded) {
      const ai = getAiClient();
      if (ai) {
        try {
          console.log(`[StudyPlanController] Falling back to direct Gemini for study plan...`);
          const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: 'user', parts: [{ text: "Please generate my personalized JSON study plan." }]}],
            config: {
              systemInstruction: systemPromptHead + "\n" + jsonSchemaInstructions,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        day: { type: Type.NUMBER },
                        topic: { type: Type.STRING },
                        activities: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        },
                        estimatedTime: { type: Type.NUMBER }
                      },
                      required: ["day", "topic", "activities", "estimatedTime"]
                    }
                  }
                },
                required: ["title", "days"]
              }
            }
          });

          const parsed = JSON.parse(response.text || '{}');
          if (parsed.title && parsed.days) {
            planData = parsed;
            generationSucceeded = true;
          }
        } catch (err: any) {
          console.error('[StudyPlanController] Gemini generation fallback error:', err.message);
        }
      }
    }

    // Fallback if AI fails or isn't available
    if (planData.days.length === 0) {
      const parsedDuration = parseInt(duration, 10);
      const days = [];
      for (let i = 1; i <= parsedDuration; i++) {
        days.push({
          day: i,
          topic: `Review of Material: Topic Segment ${i}`,
          activities: [
            `Read and highlight core points from selected study materials`,
            `Test long-term retention using active recall reviews`,
            `Complete interactive quiz questions`
          ],
          estimatedTime: parseInt(dailyCommitment as any, 10) || 60
        });
      }
      planData = {
        title: `${goal} Study Roadmap (${parsedDuration} Days)`,
        days
      };
    }

    // 3. Construct chronological dates for each day starting from startDate
    const start = new Date(startDate);
    const parsedDays = planData.days.map((d: any) => {
      const dayOffset = (d.day - 1);
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + dayOffset);
      return {
        day: d.day,
        date: dayDate,
        topic: d.topic,
        activities: d.activities || [],
        estimatedTime: d.estimatedTime || parseInt(dailyCommitment as any, 10) || 45,
        completed: false
      };
    });

    const parsedDuration = parseInt(duration, 10);
    const end = new Date(start);
    end.setDate(end.getDate() + parsedDuration - 1);

    const totalMinutes = parsedDays.reduce((acc: number, d: any) => acc + d.estimatedTime, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    // 4. Save to db
    const newPlan = new StudyPlan({
      userId,
      title: planData.title,
      goal,
      complexity,
      dailyCommitment: parseInt(dailyCommitment as any, 10) || 60,
      startDate: start,
      endDate: end,
      days: parsedDays,
      totalHours,
      materialIds,
      calendarSync: req.body.calendarSync || false
    });

    const saved = await newPlan.save();
    res.status(201).json(saved);
  } catch (error: any) {
    console.error('Failed to generate study plan:', error);
    res.status(500).json({ message: 'Failed to generate study plan', error: error.message });
  }
};

export const getStudyPlans = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const plans = await StudyPlan.find({ userId }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch study plans', error: error.message });
  }
};

export const getStudyPlan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const plan = await StudyPlan.findOne({ _id: req.params.id, userId });
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch study plan', error: error.message });
  }
};

export const updateStudyPlan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, goal, complexity, days, dailyCommitment, startDate, calendarSync } = req.body;
    
    const plan = await StudyPlan.findOne({ _id: req.params.id, userId });
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }

    if (title !== undefined) plan.title = title;
    if (goal !== undefined) plan.goal = goal;
    if (complexity !== undefined) plan.complexity = complexity;
    if (dailyCommitment !== undefined) plan.dailyCommitment = dailyCommitment;
    if (calendarSync !== undefined) plan.calendarSync = calendarSync;

    if (days !== undefined) {
      plan.days = days;
      const totalMinutes = days.reduce((acc: number, d: any) => acc + (d.estimatedTime || 0), 0);
      plan.totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    }

    if (startDate !== undefined) {
      plan.startDate = new Date(startDate);
      // Recalculate each day's date based on new start date
      const start = new Date(startDate);
      plan.days.forEach((day: any) => {
        const offset = day.day - 1;
        const dDate = new Date(start);
        dDate.setDate(dDate.getDate() + offset);
        day.date = dDate;
      });
      const end = new Date(start);
      end.setDate(end.getDate() + plan.days.length - 1);
      plan.endDate = end;
    }

    plan.updatedAt = new Date();
    const updated = await plan.save();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update study plan', error: error.message });
  }
};

export const deleteStudyPlan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const plan = await StudyPlan.findOneAndDelete({ _id: req.params.id, userId });
    if (!plan) {
      return res.status(404).json({ message: 'Study plan not found' });
    }
    res.json({ message: 'Study plan deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete study plan', error: error.message });
  }
};
