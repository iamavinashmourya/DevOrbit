import express from 'express';
import { protect } from '../middlewares/auth';
import { subscribeToSync, triggerSync } from '../controllers/syncController';

const router = express.Router();

router.get('/subscribe', protect, subscribeToSync);
router.post('/trigger', protect, triggerSync);

export default router;
