import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'learn' | 'dsa' | 'project' | 'assignment' | 'exam' | 'timepass' | 'commute' | 'sleep' | 'wake' | 'app_usage' | 'github_event' | 'lecture_cancelled' | 'social';
    title: string;
    source: 'manual' | 'browser_extension' | 'mobile_tracker' | 'takeout' | 'share' | 'github' | 'desktop_app';
    metadata: {
        domain?: string;
        url?: string;
        package?: string;
        repo?: string;
        videoType?: 'short' | 'long';
        device?: string;
    };
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    history?: {
        title: string;
        url?: string;
        timestamp: Date;
        duration?: number;
    }[];
    createdAt: Date;
}

const ActivitySchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['learn', 'dsa', 'project', 'assignment', 'exam', 'timepass', 'commute', 'sleep', 'wake', 'app_usage', 'github_event', 'lecture_cancelled', 'social'],
        required: true,
    },
    title: { type: String, required: true },
    source: {
        type: String,
        enum: ['manual', 'browser_extension', 'mobile_tracker', 'takeout', 'share', 'github', 'desktop_app'],
        required: true,
    },
    metadata: {
        domain: String,
        url: String,
        package: String,
        repo: String,
        videoType: { type: String, enum: ['short', 'long'] },
        device: String,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number },
    history: [{
        title: String,
        url: String,
        timestamp: Date,
        duration: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now },
});

// Indexes
ActivitySchema.index({ userId: 1, startTime: -1 });

export default mongoose.model<IActivity>('Activity', ActivitySchema);
