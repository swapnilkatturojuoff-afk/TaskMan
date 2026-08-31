import express from 'express';
import path from 'path';
import compression from 'compression';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(compression());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

const aiCache = new Map();
const MAX_CACHE_SIZE = 300;

function getCachedResponse(key) {
  const entry = aiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    aiCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedResponse(key, data, ttlSeconds = 600) {
  if (aiCache.size >= MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(aiCache.keys()).slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    keysToDelete.forEach(k => aiCache.delete(k));
  }
  aiCache.set(key, {
    data,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
}

function computeCacheKey(prefix, payload) {
  try {
    return `${prefix}:${JSON.stringify(payload)}`;
  } catch {
    return `${prefix}:${String(payload)}`;
  }
}

let genAIClient = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set. Using intelligent fallback heuristics.');
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

const MODEL_FALLBACK_LADDER = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

async function generateContentWithFallback(prompt, options = {}) {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('Gemini API key unavailable');
  }

  const { responseSchema, systemInstruction, maxOutputTokens = 800 } = options;
  let lastError = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const config = {
        temperature: 0.2,
        maxOutputTokens,
      };
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (responseSchema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });

      const text = response.text;
      if (!text) {
        throw new Error(`Empty response from ${model}`);
      }

      if (responseSchema) {
        try {
          return JSON.parse(text);
        } catch {
          const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(cleaned);
        }
      }

      return text;
    } catch (err) {
      console.warn(`Attempt with model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All model attempts in fallback ladder failed.');
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TaskMan AI Backend (JavaScript)',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    cacheEntries: aiCache.size,
    costOptimization: 'active (flash-lite primary + gzip + TTL caching)'
  });
});

app.post('/api/ai/breakdown', async (req, res) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const title = typeof data.title === 'string' ? data.title.trim().slice(0, 300) : 'Task';
    const description = typeof data.description === 'string' ? data.description.trim().slice(0, 500) : '';
    const energyLevel = data.energyLevel || 'medium';
    const priority = data.priority || 'medium';

    const cacheKey = computeCacheKey('breakdown', { title, energyLevel, priority });
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, _cached: true });
    }

    const systemInstruction = `You are an expert executive task decomposition and time-estimation AI engine.
Break down complex project objectives into 3 to 5 clear, sequential, actionable subtasks.
Provide precise minute estimates (10-60 mins each) and an empowering strategic rationale.`;

    const prompt = `Decompose the following task:
Title: "${title}"
Description: "${description}"
Energy Level Requirement: ${energyLevel}
Current Priority: ${priority}

Return structured JSON with subtasks (title and estimatedMinutes) and reasoning.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        reasoning: {
          type: Type.STRING,
          description: "A concise strategic tip on how to tackle these subtasks smoothly."
        },
        subtasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Action-oriented subtask title" },
              estimatedMinutes: { type: Type.INTEGER, description: "Estimated duration in minutes (e.g. 15, 25, 45)" }
            },
            required: ["title", "estimatedMinutes"]
          }
        }
      },
      required: ["subtasks", "reasoning"]
    };

    try {
      const result = await generateContentWithFallback(prompt, {
        responseSchema,
        systemInstruction,
        maxOutputTokens: 500
      });
      setCachedResponse(cacheKey, result, 1800);
      return res.json(result);
    } catch (aiError) {
      console.warn('Fallback to algorithmic decomposition:', aiError);
      const fallbackResult = {
        reasoning: `Decomposed "${title}" into structured milestones based on an estimated ${energyLevel}-energy workflow.`,
        subtasks: [
          { title: `Clarify requirements and scope boundaries for: ${title.slice(0, 40)}`, estimatedMinutes: 15 },
          { title: `Draft initial architecture and core implementation`, estimatedMinutes: 30 },
          { title: `Run comprehensive verification, unit checks, and documentation`, estimatedMinutes: 20 }
        ]
      };
      setCachedResponse(cacheKey, fallbackResult, 300);
      return res.json(fallbackResult);
    }
  } catch (error) {
    console.error('Magic Breakdown Error:', error);
    res.status(500).json({ error: error?.message || 'Internal breakdown failure' });
  }
});

app.post('/api/ai/prioritize', async (req, res) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const boardName = typeof data.boardName === 'string' ? data.boardName : 'Workspace';
    const tasks = Array.isArray(data.tasks) ? data.tasks.slice(0, 25) : [];

    if (tasks.length === 0) {
      return res.json({ prioritizations: [] });
    }

    const taskFingerprints = tasks.map(t => `${t.id}:${t.status}:${t.priority}:${t.energyLevel}`).join('|');
    const cacheKey = computeCacheKey('prioritize', { boardName, taskFingerprints });
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, _cached: true });
    }

    const systemInstruction = `You are an elite productivity strategist specializing in the Eisenhower Matrix decision framework.
Classify each task into one of 4 quadrants:
- q1_urgent_important: Do First (Crisis, deadlines, pressing problems) -> priority: urgent
- q2_important_not_urgent: Schedule (Long-term growth, strategic prep, high ROI) -> priority: high
- q3_urgent_not_important: Delegate / Batch (Interruptions, time-sensitive low value) -> priority: medium
- q4_neither: Don't Do / Minimize (Trivial, time wasters) -> priority: low`;

    const prompt = `Analyze and prioritize the following tasks from board "${boardName}":
${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title?.slice(0, 80), description: t.description?.slice(0, 100), status: t.status, priority: t.priority, energyLevel: t.energyLevel, dueDate: t.dueDate })))}

Return a list of prioritization objects with quadrant, suggestedPriority, reasoning, urgencyScore (1-10), and importanceScore (1-10).`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        prioritizations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              taskId: { type: Type.STRING },
              title: { type: Type.STRING },
              quadrant: {
                type: Type.STRING,
                enum: ['q1_urgent_important', 'q2_important_not_urgent', 'q3_urgent_not_important', 'q4_neither']
              },
              suggestedPriority: {
                type: Type.STRING,
                enum: ['urgent', 'high', 'medium', 'low']
              },
              reasoning: { type: Type.STRING },
              urgencyScore: { type: Type.INTEGER },
              importanceScore: { type: Type.INTEGER }
            },
            required: ["taskId", "quadrant", "suggestedPriority", "reasoning", "urgencyScore", "importanceScore"]
          }
        }
      },
      required: ["prioritizations"]
    };

    try {
      const result = await generateContentWithFallback(prompt, {
        responseSchema,
        systemInstruction,
        maxOutputTokens: 1000
      });
      setCachedResponse(cacheKey, result, 300);
      return res.json(result);
    } catch (aiError) {
      console.warn('Fallback prioritization heuristics:', aiError);
      const prioritizations = tasks.map((t, i) => {
        let quad = 'q2_important_not_urgent';
        let prio = 'high';
        if (t.priority === 'urgent' || t.status === 'in_progress') {
          quad = 'q1_urgent_important';
          prio = 'urgent';
        } else if (t.energyLevel === 'low') {
          quad = 'q3_urgent_not_important';
          prio = 'medium';
        }
        return {
          taskId: t.id,
          title: t.title,
          quadrant: quad,
          suggestedPriority: prio,
          reasoning: `Classified based on current status (${t.status}) and energy profile (${t.energyLevel}).`,
          urgencyScore: 8 - (i % 4),
          importanceScore: 8
        };
      });
      const fallbackResult = { prioritizations };
      setCachedResponse(cacheKey, fallbackResult, 120);
      return res.json(fallbackResult);
    }
  } catch (error) {
    console.error('Prioritize Error:', error);
    res.status(500).json({ error: error?.message || 'Internal prioritization error' });
  }
});

app.post('/api/ai/parse-task', async (req, res) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const input = typeof data.input === 'string' ? data.input.trim().slice(0, 500) : '';

    if (!input) {
      return res.status(400).json({ error: 'Input text is required' });
    }

    const cacheKey = computeCacheKey('parse-task', input.toLowerCase());
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, _cached: true });
    }

    const todayDate = new Date().toISOString().split('T')[0];
    const systemInstruction = `You are a natural language task parser. Convert conversational or spoken text into a structured task object.
Today's date is: ${todayDate}.
Infer: title (clean action statement), description, priority ("urgent", "high", "medium", "low"), energyLevel ("low", "medium", "high"), dueDate (YYYY-MM-DD), dueTime (HH:mm), estimatedMinutes (integer), subtasks (optional 2-3 steps).`;

    const prompt = `Parse this task input into structured JSON: "${input}"`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        priority: { type: Type.STRING, enum: ['urgent', 'high', 'medium', 'low'] },
        energyLevel: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
        dueDate: { type: Type.STRING },
        dueTime: { type: Type.STRING },
        estimatedMinutes: { type: Type.INTEGER },
        subtasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              estimatedMinutes: { type: Type.INTEGER }
            },
            required: ["title"]
          }
        }
      },
      required: ["title", "priority", "energyLevel", "estimatedMinutes"]
    };

    try {
      const result = await generateContentWithFallback(prompt, {
        responseSchema,
        systemInstruction,
        maxOutputTokens: 400
      });
      setCachedResponse(cacheKey, result, 600);
      return res.json(result);
    } catch (aiError) {
      console.warn('Fallback NLP extraction:', aiError);
      const isUrgent = /urgent|asap|critical/i.test(input);
      const isHigh = /high|important/i.test(input);
      const isLowEnergy = /quick|easy|low energy|5 min|10 min/i.test(input);
      const fallbackResult = {
        title: input.replace(/(high priority|urgent|due tomorrow|today|at \d+(pm|am)?)/gi, '').trim() || input,
        description: `Created via Quick Add: "${input}"`,
        priority: isUrgent ? 'urgent' : isHigh ? 'high' : 'medium',
        energyLevel: isLowEnergy ? 'low' : 'medium',
        dueDate: /tomorrow/i.test(input) ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : todayDate,
        estimatedMinutes: isLowEnergy ? 15 : 30,
        subtasks: []
      };
      setCachedResponse(cacheKey, fallbackResult, 300);
      return res.json(fallbackResult);
    }
  } catch (error) {
    console.error('Parse Task Error:', error);
    res.status(500).json({ error: error?.message || 'Internal parsing error' });
  }
});

app.post('/api/ai/daily-briefing', async (req, res) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const boardName = typeof data.boardName === 'string' ? data.boardName : 'Workspace';
    const tasks = Array.isArray(data.tasks) ? data.tasks.slice(0, 20) : [];

    const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    const taskIds = tasks.map(t => `${t.id}:${t.status}:${t.priority}`).join(',');
    const cacheKey = computeCacheKey('daily-briefing', { boardName, todayFormatted, taskIds });
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return res.json({ ...cached, _cached: true });
    }

    const systemInstruction = `You are a high-performance productivity coach. Review the user's current board tasks and generate an energizing, concise daily briefing with top 3 focus items, 1 quick win task, and a tailored productivity tip.`;

    const prompt = `Date: ${todayFormatted}
Board: "${boardName}"
Tasks: ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title?.slice(0, 80), status: t.status, priority: t.priority, energyLevel: t.energyLevel, dueDate: t.dueDate })))}

Generate a structured daily briefing JSON.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING },
        greeting: { type: Type.STRING },
        summary: { type: Type.STRING },
        topFocusTasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              reason: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['urgent', 'high', 'medium', 'low'] }
            },
            required: ["id", "title", "reason", "priority"]
          }
        },
        quickWinTask: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER }
          },
          required: ["id", "title", "estimatedMinutes"]
        },
        productivityTip: { type: Type.STRING }
      },
      required: ["date", "greeting", "summary", "topFocusTasks", "productivityTip"]
    };

    try {
      const result = await generateContentWithFallback(prompt, {
        responseSchema,
        systemInstruction,
        maxOutputTokens: 700
      });
      setCachedResponse(cacheKey, result, 600);
      return res.json(result);
    } catch (aiError) {
      console.warn('Fallback daily briefing generator:', aiError);
      const pendingTasks = tasks.filter(t => t.status !== 'done');
      const focus = pendingTasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        reason: `Priority item ready for execution in ${t.status || 'todo'}.`,
        priority: t.priority || 'medium'
      }));
      const quickWin = pendingTasks.find(t => t.energyLevel === 'low');

      const fallbackResult = {
        date: todayFormatted,
        greeting: "Good morning! Let's build unstoppable momentum today.",
        summary: `You currently have ${pendingTasks.length} active tasks on your ${boardName} board.`,
        topFocusTasks: focus,
        quickWinTask: quickWin ? {
          id: quickWin.id,
          title: quickWin.title,
          estimatedMinutes: 15
        } : undefined,
        productivityTip: 'Use the Pomodoro technique to complete your highest priority item in your first 25-minute focus block.'
      };
      setCachedResponse(cacheKey, fallbackResult, 300);
      return res.json(fallbackResult);
    }
  } catch (error) {
    console.error('Daily Briefing Error:', error);
    res.status(500).json({ error: error?.message || 'Internal briefing error' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));

    app.use(express.static(distPath, {
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));

    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskMan AI Server running at http://0.0.0.0:${PORT} [JavaScript Engine]`);
  });
}

startServer();
