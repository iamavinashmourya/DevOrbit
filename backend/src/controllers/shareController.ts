import { Request, Response } from 'express';
import Activity from '../models/activity';
import jwt from 'jsonwebtoken';
import User from '../models/user';

export const shareVideo = async (req: Request, res: Response) => {
    try {
        const { title, url, timestamp, userToken } = req.body;

        if (!userToken) {
            res.status(401).json({ message: 'No user token provided' });
            return;
        }

        // Verify token (assuming it's a regular JWT for now, or a special share token)
        // For MVP, we'll use the same JWT secret.
        let decoded: any;
        try {
            decoded = jwt.verify(userToken, process.env.JWT_SECRET || 'secret');
        } catch (e) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        let type = 'learn'; // Default to learn for shared videos
        let videoType = 'long';

        if (url && url.includes('/shorts/')) {
            videoType = 'short';
        }

        const startTime = timestamp ? new Date(timestamp) : new Date();
        // Default 10 mins for long, 1 min for short
        const durationMinutes = videoType === 'short' ? 1 : 10;
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

        const activity = await Activity.create({
            userId: user._id,
            type,
            title,
            source: 'share',
            metadata: {
                url,
                videoType: videoType as 'long' | 'short',
            },
            startTime,
            endTime,
            durationMinutes,
        });

        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
