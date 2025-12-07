import express from 'express';
import multer from 'multer';
import { importYoutubeHistory } from '../controllers/importController';
import { protect } from '../middlewares/auth';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/takeout/youtube', protect, upload.single('file'), importYoutubeHistory);

export default router;
