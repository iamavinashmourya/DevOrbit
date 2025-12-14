import axios from 'axios';

// Define the shape of an activity as awaited by the backend
interface ActivityPayload {
    type: string;
    title: string;
    source: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    metadata: {
        package: string;
        device: string;
        [key: string]: any;
    };
}



export const getQueueSize = async (): Promise<number> => {
    try {
        // @ts-ignore
        const queue = await window.api.queue.get();
        return Array.isArray(queue) ? queue.length : 0;
    } catch (err) {
        console.error("Failed to get queue size", err);
        return 0;
    }
};

export const addToQueue = async (activity: ActivityPayload) => {
    try {
        console.log(`[Queue] Adding item: ${activity.title}`);
        // @ts-ignore
        const currentQueue = await window.api.queue.get();
        const newQueue = Array.isArray(currentQueue) ? [...currentQueue, activity] : [activity];

        // @ts-ignore
        await window.api.queue.set(newQueue);
        console.log(`[Queue] Saved. Size: ${newQueue.length}`);
    } catch (err) {
        console.error("Failed to add to queue", err);
    }
};

export const flushQueue = async (): Promise<{ success: boolean; count: number }> => {
    try {
        // @ts-ignore
        const queue: ActivityPayload[] = await window.api.queue.get();

        if (!queue || queue.length === 0) {
            console.log('[Queue] Empty, nothing to sync.');
            return { success: true, count: 0 };
        }

        console.log(`[Queue] Flushing ${queue.length} items to backend...`);

        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');

        // Send Batch
        await axios.post('http://localhost:4000/api/v1/activities/batch', {
            activities: queue
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Clear Queue
        // @ts-ignore
        await window.api.queue.clear();
        console.log('[Queue] Flush successful.');

        return { success: true, count: queue.length };

    } catch (err) {
        console.error('[Queue] Flush failed:', err);
        return { success: false, count: 0 };
    }
};
