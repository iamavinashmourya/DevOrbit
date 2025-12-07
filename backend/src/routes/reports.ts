import express from 'express';
import { getMonthlyReport } from '../controllers/reportController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.get('/monthly', protect, getMonthlyReport);

export default router;
