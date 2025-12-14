import { Request, Response } from 'express';

interface Client {
    id: string; // userId
    res: Response;
}

let clients: Client[] = [];

// Subscribe to sync events (SSE) - Called by Desktop App
export const subscribeToSync = (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user._id.toString();

    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);

    const clientId = userId;
    const newClient = { id: clientId, res };
    clients.push(newClient);

    console.log(`[Sync] Client connected: ${clientId}. Total clients: ${clients.length}`);

    // Initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Clean up on disconnect
    req.on('close', () => {
        console.log(`[Sync] Client disconnected: ${clientId}`);
        clients = clients.filter(client => client.res !== res);
    });
};

// Trigger sync event - Called by Dashboard
export const triggerSync = (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user._id.toString();

    console.log(`[Sync] Triggering sync for user: ${userId}`);

    // Send event to all connected clients for this user
    const userClients = clients.filter(client => client.id === userId);

    userClients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ type: 'sync_request' })}\n\n`);
    });

    res.json({
        message: 'Sync request sent to devices',
        deviceCount: userClients.length
    });
};
