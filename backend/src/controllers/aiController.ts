import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ClassificationCache from '../models/classificationCache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const getAICategory = async (title: string, context: string): Promise<string> => {
    // 1. Smart Cache Key generation
    // For known desktop apps, ignore the window title to save quota (e.g. Word is always Assignment)
    // For browsers/YouTube, use the full title to distinguish Learn vs Timepass
    let cacheKey = `${title.trim()}|${context.trim()}`.toLowerCase();

    const simpleApps = ['microsoft word', 'word', 'microsoft powerpoint', 'powerpoint', 'microsoft excel', 'excel', 'visual studio code', 'code', 'cursor', 'windsurf', 'android studio', 'xcode'];
    const lowerContext = context.toLowerCase();

    if (simpleApps.some(app => lowerContext.includes(app))) {
        cacheKey = `__APP_ONLY__|${lowerContext}`; // Unique key for the APP itself
    }

    try {
        const cached = await ClassificationCache.findOne({ key: cacheKey });
        if (cached) {
            console.log(`[AI] Cache Hit: ${title} -> ${cached.category}`);
            return cached.category;
        }
    } catch (err) {
        console.error("[AI] Cache Read Error:", err);
    }

    if (!process.env.GEMINI_API_KEY) return 'app_usage';

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        You are an intelligent productivity assistant. Classify the following activity into one of these categories:
        - 'learn' (Educational, tutorials, documentation, courses, research)
        - 'project' (Development tools, IDEs, VS Code, Terminals, Localhost, Design tools like Figma)
        - 'dsa' (LeetCode, HackerRank, algorithm problems)
        - 'assignment' (Word, Docs, PowerPoint, Excel, Writing papers, Homework)
        - 'timepass' (Entertainment, Movies, Games, Music, Random Browsing)
        - 'social' (Messaging apps, Discord, Slack, Teams, Email, Social Media)
        - 'app_usage' (General OS tools, File Explorer, Settings, System)

        Input:
        Context (URL/App Name): ${context}
        Activity Title: ${title}

        Rules:
        - VS Code, Terminal, Postman => 'project'
        - Microsoft Word, Google Docs, PowerPoint => 'assignment'
        - Spotify, Netflix, VLC => 'timepass'
        - Zoom, Slack, Discord, Outlook => 'social'
        - Chrome/Edge => Depend on title.
        - Return ONLY the category code (e.g., 'learn').
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().toLowerCase().replace(/['"]/g, '');

        const validCategories = ['learn', 'project', 'dsa', 'assignment', 'timepass', 'social', 'app_usage'];
        const finalCategory = validCategories.includes(text) ? text : 'app_usage';

        // 2. Save to Cache
        try {
            await ClassificationCache.create({ key: cacheKey, category: finalCategory });
        } catch (err) {
            // Ignore duplicate key errors
        }

        return finalCategory;

    } catch (error: any) {
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('503')) {
            console.warn("[AI] Rate limit/Server error. Using local fallback.");
        } else {
            console.error("[AI] Error:", error.message);
        }
        return localRegexClassifier(title, context);
    }
};

const localRegexClassifier = (title: string, context: string): string => {
    const t = (title + ' ' + context).toLowerCase();

    // Dev Tools & Project
    if (t.includes('code') || t.includes('terminal') || t.includes('git') || t.includes('studio') || t.includes('localhost') || t.includes('electron') || t.includes('devorbit')) return 'project';

    // Assignments
    if (t.includes('word') || t.includes('powerpoint') || t.includes('excel') || t.includes('presentation') || t.includes('document')) return 'assignment';

    // DSA
    if (t.includes('leetcode') || t.includes('hackerrank') || t.includes('geeksforgeeks')) return 'dsa';

    // Timepass
    if (t.includes('game') || t.includes('movie') || t.includes('netflix') || t.includes('spotify') || t.includes('youtube') || t.includes('vlc')) return 'timepass';

    // Social
    if (t.includes('slack') || t.includes('discord') || t.includes('teams') || t.includes('whatsapp') || t.includes('telegram')) return 'social';

    // Learning
    if (t.includes('tutorial') || t.includes('learn') || t.includes('course') || t.includes('doc') || t.includes('pdf')) return 'learn';

    return 'app_usage';
};

export const classifyActivity = async (req: Request, res: Response) => {
    try {
        const { title, url } = req.body;
        const category = await getAICategory(title, url);
        res.json({ category });
    } catch (error) {
        console.error('AI Classification Error:', error);
        res.status(500).json({ message: 'Failed to classify', error: (error as Error).message });
    }
};
