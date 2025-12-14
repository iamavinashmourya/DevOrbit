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

        // --- SPLIT LOGIC FOR CROSS-DAY ACTIVITIES ---
        // If an activity spans across midnight, split it into two requests to ensure accuracy.
        // E.g. 11:50 PM -> 00:10 AM becomes (11:50 -> 11:59:59) and (00:00 -> 00:10).
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);

            if (start.getDate() !== end.getDate() || start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear()) {
                console.log(`[Activity] Splitting cross-day activity: ${start.toISOString()} -> ${end.toISOString()}`);

                // 1. First Part: Start -> Midnight
                const midnight = new Date(start);
                midnight.setHours(23, 59, 59, 999);

                const duration1 = Math.ceil((midnight.getTime() - start.getTime()) / 60000);

                // Recursively call for Part 1
                await createActivity({
                    ...req,
                    body: { ...req.body, endTime: midnight.toISOString(), durationMinutes: duration1 }
                } as Request, { status: () => ({ json: () => { } }) } as Response); // Mock Response

                // 2. Second Part: Midnight Next Day -> End
                const nextDayStart = new Date(start);
                nextDayStart.setDate(nextDayStart.getDate() + 1);
                nextDayStart.setHours(0, 0, 0, 0);

                const duration2 = Math.ceil((end.getTime() - nextDayStart.getTime()) / 60000);

                // Recursively call for Part 2
                // We return this response as the "Main" response
                req.body.startTime = nextDayStart.toISOString();
                req.body.durationMinutes = duration2;
                return createActivity(req, res);
            }
        }

        // --- GLOBAL IGNORE LIST ---
        if (!title || title === 'New Tab' || title === 'New Tab Page' || title.includes("Windows Start Experience Host") || title.includes("Control Panel") || title.includes("ShellHost")) {
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

export const createBatchActivities = async (req: Request, res: Response) => {
    try {
        const { activities } = req.body;
        if (!activities || !Array.isArray(activities)) {
            return res.status(400).json({ message: 'Invalid payload: activities array required' });
        }

        console.log(`[Batch] Received ${activities.length} activities for user ${req.user._id}`);

        // 1. Pre-process and Deduplicate Titles for AI
        // Identify unique items that need classification
        const uniqueToClassify = new Set<string>();
        const titleContextMap = new Map<string, string>();


        activities.forEach((act: any) => {
            // Basic Ignore first
            if (!act.title || act.title === 'New Tab' || act.title.includes("Windows Start Experience Host") || act.title.includes("Control Panel")) return;

            // Sanitize Title (same logic as single create)
            let finalTitle = act.title;
            if (act.source === 'desktop_app' && act.metadata?.package) {
                const browserNames = ['chrome', 'brave', 'edge', 'firefox', 'opera', 'vivaldi', 'arc', 'browser'];
                if (browserNames.some(b => act.metadata.package.toLowerCase().includes(b))) {
                    finalTitle = act.metadata.package;
                }
            }

            if ((act.source === 'desktop_app' || act.source === 'browser_extension') && act.type === 'app_usage' && finalTitle) {
                const key = finalTitle + '||' + (act.metadata?.package || act.metadata?.url || act.metadata?.domain || '');
                uniqueToClassify.add(key);
                titleContextMap.set(key, act);
            }
        });

        // 2. Parallel AI Classification
        // We will classify all unique items in parallel
        const classificationMap = new Map<string, string>();

        if (uniqueToClassify.size > 0) {
            console.log(`[Batch] Classifying ${uniqueToClassify.size} unique items...`);
            const { getAICategory } = await import('./aiController');

            // Convert Set to Array for Promise.all
            const items = Array.from(uniqueToClassify);

            // Throttle logic could be added here if > 10 items
            const results = await Promise.all(items.map(async (key) => {
                const [title, context] = key.split('||');
                try {
                    const category = await getAICategory(title, context);
                    return { key, category };
                } catch (e) {
                    return { key, category: 'app_usage' }; // Fallback
                }
            }));

            results.forEach(r => classificationMap.set(r.key, r.category));
        }

        // 3. Sequential Save
        // We must save chronologically to ensure history merging works correctly
        // Sort by startTime just in case
        activities.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        let savedCount = 0;

        for (const act of activities) {
            // Sanitize again (or could have stored)
            let finalTitle = act.title;
            if (act.source === 'desktop_app' && act.metadata?.package) {
                const browserNames = ['chrome', 'brave', 'edge', 'firefox', 'opera', 'vivaldi', 'arc', 'browser'];
                if (browserNames.some(b => act.metadata.package.toLowerCase().includes(b))) {
                    finalTitle = act.metadata.package;
                }
            }

            // Inject Classification result
            if ((act.source === 'desktop_app' || act.source === 'browser_extension') && act.type === 'app_usage') {
                const key = finalTitle + '||' + (act.metadata?.package || act.metadata?.url || act.metadata?.domain || '');
                if (classificationMap.has(key)) {
                    act.type = classificationMap.get(key);
                }
            }

            // reuse single create logic via internal helper
            // We can just call createActivity but we need to mock Req/Res which is messy
            // Better to extract logic, but for now to be safe and quick, we can use the Mock trick 
            // because createActivity handles the complex split/merge logic well.

            // Note: recursive logic in createActivity returns 'res.json()'. We need to capture that?
            // Actually, since we are in batch, we don't care about the indvidual response JSONs, just that it saved.
            // We mock Response.

            await createActivity({
                ...req,
                body: act
            } as Request, {
                status: () => ({ json: () => { } }),
                json: () => { },
                send: () => { }
            } as unknown as Response);

            savedCount++;
        }

        res.json({ message: 'Batch processed', count: savedCount });

    } catch (error) {
        console.error("Batch Error:", error);
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
