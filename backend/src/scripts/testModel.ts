import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.log('No API Key found');
        return;
    }

    try {
        console.log('Fetching models...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.log('No models found or error:', data);
        }
    } catch (error) {
        console.error('Error fetching models:', error);
    }
}

listModels();
