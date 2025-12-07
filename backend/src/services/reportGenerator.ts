import Activity from '../models/activity';
import mongoose from 'mongoose';

export const generateMonthlyReport = async (userId: string, year: number, month: number) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const userIdObj = new mongoose.Types.ObjectId(userId);

    // 1. Daily totals per type
    const dailyTotals = await Activity.aggregate([
        {
            $match: {
                userId: userIdObj,
                startTime: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: {
                    day: { $dayOfMonth: '$startTime' },
                    type: '$type',
                },
                totalMinutes: { $sum: '$durationMinutes' },
            },
        },
        { $sort: { '_id.day': 1 } },
    ]);

    // 2. Category distribution (Pie chart)
    const categoryDistribution = await Activity.aggregate([
        {
            $match: {
                userId: userIdObj,
                startTime: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: '$type',
                totalMinutes: { $sum: '$durationMinutes' },
            },
        },
    ]);

    // 3. Top timepass domains
    const topTimepass = await Activity.aggregate([
        {
            $match: {
                userId: userIdObj,
                startTime: { $gte: startDate, $lte: endDate },
                type: { $in: ['timepass', 'app_usage'] },
            },
        },
        {
            $group: {
                _id: '$metadata.domain', // Might be null for manual entries
                totalMinutes: { $sum: '$durationMinutes' },
            },
        },
        { $sort: { totalMinutes: -1 } },
        { $limit: 5 },
    ]);

    return {
        dailyTotals,
        categoryDistribution,
        topTimepass,
    };
};
