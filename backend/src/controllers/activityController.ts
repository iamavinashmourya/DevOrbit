import { Request, Response } from 'express';
import Activity from '../models/activity';

export const getActivities = async (req: Request, res: Response) => {
    try {
        const pageSize = Number(req.query.limit) || 20;
        const page = Number(req.query.page) || 1;

        const query: any = { userId: req.user._id };

        if (req.query.type) {
            query.type = req.query.type;
        }

        if (req.query.start && req.query.end) {
            query.startTime = {
                $gte: new Date(req.query.start as string),
                $lte: new Date(req.query.end as string),
            };
        }

        const count = await Activity.countDocuments(query);
        const activities = await Activity.find(query)
            .sort({ startTime: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ activities, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createActivity = async (req: Request, res: Response) => {
    try {
        const { type, title, startTime, endTime, metadata, source } = req.body;

        let durationMinutes = 0;
        let finalEndTime = endTime;

        if (!endTime) {
            finalEndTime = new Date();
        }

        if (startTime && finalEndTime) {
            const start = new Date(startTime).getTime();
            const end = new Date(finalEndTime).getTime();
            durationMinutes = Math.ceil((end - start) / 60000);
        }

        // Get start and end of today (user's timezone)
        const activityDate = new Date(startTime);
        const startOfDay = new Date(activityDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(activityDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Check if there's already an activity for this domain/type today
        const domain = metadata?.domain;

        console.log(`[Activity] Checking for existing: domain=${domain}, type=${type}, title=${title}`);

        const existingActivity = await Activity.findOne({
            userId: req.user._id,
            'metadata.domain': domain,
            type: type, // Match on type instead of exact title
            startTime: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({ startTime: -1 }); // Get the most recent one

        if (existingActivity && domain) {
            console.log(`[Activity] MERGING with existing activity ID: ${existingActivity._id}`);

            // Merge: Add duration to existing activity
            existingActivity.durationMinutes += durationMinutes;

            // Update title to the latest (in case page changed)
            existingActivity.title = title;

            // Update endTime to the latest
            if (new Date(finalEndTime) > new Date(existingActivity.endTime)) {
                existingActivity.endTime = finalEndTime;
            }

            // Keep the earliest startTime
            if (new Date(startTime) < new Date(existingActivity.startTime)) {
                existingActivity.startTime = startTime;
            }

            const updatedActivity = await existingActivity.save();
            console.log(`[Activity] Merged! Total duration: ${updatedActivity.durationMinutes}min`);
            res.status(200).json(updatedActivity);
        } else {
            console.log(`[Activity] Creating NEW activity`);

            // Create new activity
            const activity = new Activity({
                userId: req.user._id,
                type,
                title,
                source: source || 'manual',
                startTime,
                endTime: finalEndTime,
                durationMinutes,
                metadata,
            });

            const createdActivity = await activity.save();
            res.status(201).json(createdActivity);
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const updateActivity = async (req: Request, res: Response) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (activity) {
            if (activity.userId.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            activity.type = req.body.type || activity.type;
            activity.title = req.body.title || activity.title;
            activity.startTime = req.body.startTime || activity.startTime;
            activity.endTime = req.body.endTime || activity.endTime;
            activity.metadata = req.body.metadata || activity.metadata;

            if (activity.startTime && activity.endTime) {
                const start = new Date(activity.startTime).getTime();
                const end = new Date(activity.endTime).getTime();
                activity.durationMinutes = Math.round((end - start) / 60000);
            }

            const updatedActivity = await activity.save();
            res.json(updatedActivity);
        } else {
            res.status(404).json({ message: 'Activity not found' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteActivity = async (req: Request, res: Response) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (activity) {
            if (activity.userId.toString() !== req.user._id.toString()) {
                res.status(401).json({ message: 'Not authorized' });
                return;
            }

            await activity.deleteOne();
            res.json({ message: 'Activity removed' });
        } else {
            res.status(404).json({ message: 'Activity not found' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
