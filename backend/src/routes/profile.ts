import express from 'express';
import { protect as auth } from '../middlewares/auth';
import Activity from '../models/activity';
import User from '../models/user';

const router = express.Router();

// Get Profile Data (Streak, Heatmap, Stats)
router.get('/', auth, async (req: any, res) => {
    try {
        const userId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch all activities for the user to calculate streak and heatmap
        // Optimization: In a real app, we might aggregate this or limit the range (e.g., last 365 days)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        const activities = await Activity.find({
            user: userId,
            startTime: { $gte: oneYearAgo },
            type: { $in: ['learn', 'dsa', 'project', 'github_event'] } // Filter for productive work
        }).sort({ startTime: 1 });

        // 2. Calculate Heatmap Data
        const heatmap: Record<string, number> = {};
        const uniqueDays = new Set<string>();

        activities.forEach(act => {
            const dateStr = new Date(act.startTime).toISOString().split('T')[0];
            heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
            uniqueDays.add(dateStr);
        });

        // 3. Calculate Streak
        // We need to check consecutive days backwards from today
        let currentStreak = 0;
        let checkDate = new Date(today);

        // Check if there is activity today
        const todayStr = checkDate.toISOString().split('T')[0];
        if (uniqueDays.has(todayStr)) {
            currentStreak++;
        }

        // Check yesterday and backwards
        checkDate.setDate(checkDate.getDate() - 1);
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (uniqueDays.has(dateStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Longest Streak (Simple calculation based on the fetched year)
        let longestStreak = 0;
        let tempStreak = 0;
        const sortedDays = Array.from(uniqueDays).sort();

        if (sortedDays.length > 0) {
            let prevDate = new Date(sortedDays[0]);
            tempStreak = 1;
            longestStreak = 1;

            for (let i = 1; i < sortedDays.length; i++) {
                const currDate = new Date(sortedDays[i]);
                const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
                longestStreak = Math.max(longestStreak, tempStreak);
                prevDate = currDate;
            }
        }

        // 4. Recent Tasks (Today's activities)
        const recentTasks = activities.filter(act => {
            const actDate = new Date(act.startTime);
            return actDate >= today;
        }).reverse(); // Newest first

        // 5. User Info (already in req.user but let's return clean object)
        const userProfile = {
            name: req.user.name,
            email: req.user.email,
            joinedAt: req.user.createdAt,
            integrations: req.user.integrations
        };

        res.json({
            user: userProfile,
            stats: {
                currentStreak,
                longestStreak,
                totalActivities: activities.length,
                heatmap
            },
            recentTasks
        });

    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({ message: 'Failed to fetch profile data' });
    }
});

export default router;
