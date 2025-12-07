import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const classifyActivity = async (req: Request, res: Response) => {
    try {
        const { title, url } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            res.status(500).json({ message: 'Gemini API Key not configured' });
            return;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        You are an intelligent productivity assistant. Classify the following website visit into one of these categories:
        - 'learn' (Educational, tutorials, documentation, courses, research)
        - 'project' (Development tools, GitHub, localhost, cloud consoles, design tools)
        - 'dsa' (LeetCode, HackerRank, algorithm problems)
        - 'timepass' (Entertainment, social media, funny videos, games, movies, music)
        - 'social' (LinkedIn, Twitter/X, professional networking)
        - 'app_usage' (General tools, email, calendar, banking, misc)

        Input:
        URL: ${url}
        Title: ${title}

        Rules:
        - If it's a coding tutorial or documentation, it's 'learn'.
        - If it's a funny video or meme, it's 'timepass'.
        - If it's a specific project management tool, it's 'project'.
        - Return ONLY the category code (e.g., 'learn'). Do not add any explanation.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().toLowerCase().replace(/['"]/g, '');

        // Validate response
        const validCategories = ['learn', 'project', 'dsa', 'timepass', 'social', 'app_usage'];
        const category = validCategories.includes(text) ? text : 'app_usage';

        res.json({ category });

    } catch (error) {
        console.error('AI Classification Error:', error);
        res.status(500).json({ message: 'Failed to classify', error: (error as Error).message });
    }
};
