import fs from 'fs';
import Activity, { IActivity } from '../models/activity';
import mongoose from 'mongoose';

interface TakeoutActivity {
    header: string;
    title: string;
    titleUrl?: string;
    time: string;
    products: string[];
    activityControls: string[];
}

export const parseAndImportTakeout = async (filePath: string, userId: string) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const rawData: TakeoutActivity[] = JSON.parse(fileContent);

        const activities: Partial<IActivity>[] = [];

        for (const item of rawData) {
            if (!item.titleUrl || !item.time) continue;

            // Deduplication check (basic) - in production, might want to do this in DB query
            // For now, we'll rely on the bulk write or pre-check if needed.
            // But to avoid too many DB calls, we'll just prepare the objects.

            let type = 'timepass';
            let videoType = 'long';

            if (item.titleUrl.includes('/shorts/')) {
                videoType = 'short';
            }

            // Simple keyword matching for 'learn'
            const learnKeywords = ['tutorial', 'course', 'learn', 'study', 'lecture', 'algo', 'structure', 'react', 'node', 'typescript', 'python', 'java', 'cpp', 'dsa'];
            const lowerTitle = item.title.toLowerCase();

            if (learnKeywords.some(k => lowerTitle.includes(k))) {
                type = 'learn';
            }

            // Guess duration (default 10 mins for long, 1 min for short)
            const durationMinutes = videoType === 'short' ? 1 : 10;
            const startTime = new Date(item.time);
            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

            activities.push({
                userId: new mongoose.Types.ObjectId(userId),
                type: type as any,
                title: item.title.replace('Watched ', ''),
                source: 'takeout',
                metadata: {
                    url: item.titleUrl,
                    videoType: videoType as any,
                },
                startTime,
                endTime,
                durationMinutes,
            });
        }

        // Bulk insert (ordered: false to continue even if duplicates fail unique index if we had one)
        // We don't have a unique index on url+time yet, but we should probably check for existing.
        // For MVP, we'll just insert.

        if (activities.length > 0) {
            await Activity.insertMany(activities);
        }

        return { imported: activities.length, skipped: 0 };
    } catch (error) {
        throw error;
    } finally {
        // Clean up file
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error('Failed to delete temp file', e);
        }
    }
};
