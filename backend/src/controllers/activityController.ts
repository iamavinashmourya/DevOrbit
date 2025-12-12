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
        const { type, title, url, durationMinutes, source, metadata, startTime, endTime } = req.body;

        // --- GLOBAL IGNORE LIST ---
        if (!title || title === 'New Tab' || title === 'New Tab Page' || title.includes("Windows Start Experience Host") || title.includes("Control Panel")) {
            return res.status(200).json({ message: 'Ignored: System/Empty page' });
        }

        // --- DESKTOP TITLE SANITIZATION ---
        // If Desktop App reports a browser, just use the App Name (e.g. "Google Chrome") to avoid "New Tab" spam
        // and keep it clean (as per user request).
        let finalTitle = title;
        if (source === 'desktop_app' && metadata?.package) {
            const browserNames = ['chrome', 'brave', 'edge', 'firefox', 'opera', 'vivaldi', 'arc', 'browser'];
            if (browserNames.some(b => metadata.package.toLowerCase().includes(b))) {
                finalTitle = metadata.package; // Overwrite "Google Chrome - New Tab" -> "Google Chrome"
            }
        }

        // Define date for querying
        const activityDate = startTime ? new Date(startTime) : new Date();
        const startOfDay = new Date(activityDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(activityDate);
        endOfDay.setHours(23, 59, 59, 999);

        // --- DEDUPLICATION LOGIC ---
        // If this is a DESKTOP ping for a Browser, check if the Extension is already tracking it.
        // If Extension is active, we IGNORE this desktop ping to avoid double counting.
        if (source === 'desktop_app' && metadata?.package) {
            const browserNames = ['chrome', 'brave', 'edge', 'firefox', 'opera', 'vivaldi', 'arc', 'browser'];
            const isBrowser = browserNames.some(b => metadata.package.toLowerCase().includes(b));

            if (isBrowser) {
                // Check for RECENT (last 1 min) extension activity
                // If the user just switched from Chrome (Ext) to Edge (No Ext), we want Edge to pick up quickly.
                const oneAgo = new Date(Date.now() - 1 * 60 * 1000);
                const activeExtension = await Activity.findOne({
                    userId: req.user._id,
                    source: 'browser_extension',
                    updatedAt: { $gte: oneAgo } // Very recent update
                });

                if (activeExtension) {
                    console.log(`[Activity] Ignored Desktop ping for ${metadata.package} (Extension is active)`);
                    return res.status(200).json({ message: 'Ignored: Extension handling this' });
                }
            }
        }

        let finalDuration = durationMinutes || 0;
        let finalEndTime = endTime;
        if (!finalEndTime) finalEndTime = new Date();

        // Recalculate duration if needed and times provided
        if (startTime && finalEndTime && !finalDuration) {
            const start = new Date(startTime).getTime();
            const end = new Date(finalEndTime).getTime();
            finalDuration = Math.ceil((end - start) / 60000);
        }

        // ** AI Classification for Desktop App & Browser **
        let finalType = type;
        if ((source === 'desktop_app' || source === 'browser_extension') && finalType === 'app_usage' && finalTitle) {
            try {
                // Dynamic import to avoid cycles/loading issues
                // const { getAICategory } = await import('./aiController'); 
                // Using require to ensure it works synchronously if needed, but import is fine in async func
                const { getAICategory } = await import('./aiController');
                const context = metadata?.package || metadata?.url || metadata?.domain || ''; // Use package or URL
                console.log(`[Activity] AI Classifying: ${finalTitle} (${context})`);

                const aiCategory = await getAICategory(finalTitle, context);
                if (aiCategory && aiCategory !== 'app_usage') {
                    finalType = aiCategory as any;
                    console.log(`[Activity] Classified as: ${finalType}`);
                }
            } catch (err) {
                console.error('[Activity] AI Classification Failed:', err);
            }
        }

        // Check if there's already an activity for this domain/type today
        const domain = metadata?.domain;
        const pkg = metadata?.package;

        console.log(`[Activity] Checking for existing: domain=${domain}, pkg=${pkg}, type=${finalType}, title=${title}`);

        const query: any = {
            userId: req.user._id,
            type: finalType, // Match on FINAL Type
            startTime: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        };

        if (domain) {
            query['metadata.domain'] = domain;
        } else if (pkg) {
            query['metadata.package'] = pkg;
        } else {
            // Fallback: match by title if no domain/package (e.g. manual entry)
            query['title'] = title;
        }

        const existingActivity = await Activity.findOne(query).sort({ startTime: -1 }); // Get the most recent one

        if (existingActivity) {
            console.log(`[Activity] MERGING with existing activity ID: ${existingActivity._id}`);

            // Merge: Add duration to existing activity
            existingActivity.durationMinutes += finalDuration;

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

            // *** HISTORY LOGIC ***
            if (!existingActivity.history) {
                existingActivity.history = [];
            }

            const lastHistoryItem = existingActivity.history[existingActivity.history.length - 1];

            // Check if same title (accumulate duration)
            if (lastHistoryItem && lastHistoryItem.title === title) {
                lastHistoryItem.duration = (lastHistoryItem.duration || 0) + finalDuration;
                // Update timestamp to latest? No, keep start timestamp.
                console.log(`[Activity] Increased duration for existing history item: ${title} (+${finalDuration}m)`);
            } else {
                // New history item
                existingActivity.history.push({
                    title: title,
                    url: metadata?.url || '',
                    timestamp: new Date(startTime),
                    duration: finalDuration
                });
                console.log(`[Activity] Added new history item: ${title}`);
            }

            // Mark modified to ensure deep update saves
            existingActivity.markModified('history');

            const updatedActivity = await existingActivity.save();
            console.log(`[Activity] Merged! Total duration: ${updatedActivity.durationMinutes}min`);
            res.status(200).json(updatedActivity);
        } else {
            console.log(`[Activity] Creating NEW activity`);

            // Create new activity
            const activity = new Activity({
                userId: req.user._id,
                type: finalType,
                title,
                source: source || 'manual',
                startTime,
                endTime: finalEndTime,
                durationMinutes: finalDuration,
                metadata,
                // Initialize history
                history: [{
                    title: title,
                    url: metadata?.url || '',
                    timestamp: new Date(startTime),
                    duration: finalDuration
                }]
            });

            const createdActivity = await activity.save();
            res.status(201).json(createdActivity);
        }
    } catch (error) {
        console.error("Create Activity Error:", error);
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
