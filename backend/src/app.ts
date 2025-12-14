import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import activityRoutes from './routes/activities';
import importRoutes from './routes/import';
import shareRoutes from './routes/share';
import reportRoutes from './routes/reports';
import githubRoutes from './routes/github';
import aiRoutes from './routes/ai';
import profileRoutes from './routes/profile';
import syncRoutes from './routes/sync';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/share', shareRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/auth/github', githubRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/sync', syncRoutes);

app.get('/', (req, res) => {
    res.send('StudyTrack API is running');
});

export default app;
