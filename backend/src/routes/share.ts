import express from 'express';
import { shareVideo } from '../controllers/shareController';

const router = express.Router();

router.post('/video', shareVideo);

export default router;
