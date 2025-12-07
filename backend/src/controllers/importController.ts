import { Request, Response } from 'express';
import { parseAndImportTakeout } from '../services/takeoutParser';

export const importYoutubeHistory = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const result = await parseAndImportTakeout(req.file.path, req.user._id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
