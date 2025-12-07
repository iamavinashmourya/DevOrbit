import { Request, Response } from 'express';
import { generateMonthlyReport } from '../services/reportGenerator';

export const getMonthlyReport = async (req: Request, res: Response) => {
    try {
        const year = Number(req.query.year) || new Date().getFullYear();
        const month = Number(req.query.month) || new Date().getMonth() + 1;

        const report = await generateMonthlyReport(req.user._id, year, month);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
