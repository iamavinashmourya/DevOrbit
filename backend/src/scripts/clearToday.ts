import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Activity from '../models/activity';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function clearTodayActivities() {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB');

        // Get start and end of today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const result = await Activity.deleteMany({
            startTime: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        console.log(`✅ Deleted ${result.deletedCount} activities from today`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

clearTodayActivities();
