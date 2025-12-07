import express from 'express';
import { classifyActivity } from '../controllers/aiController';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.post('/classify', protect, classifyActivity);

export default router;
