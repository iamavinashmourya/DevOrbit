import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    timezone: string;
    birthday?: Date;
    settings: {
        notifyHourly: boolean;
        goals: {
            studyHoursPerDay: number;
            dsaProblemsPerWeek: number;
        };
        privacy: {
            shareData: boolean;
        };
    };
    integrations: {
        github: {
            accessTokenEncrypted?: string;
            username?: string;
            id?: string;
            connectedAt?: Date;
        };
    };
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    birthday: { type: Date },
    settings: {
        notifyHourly: { type: Boolean, default: false },
        goals: {
            studyHoursPerDay: { type: Number, default: 4 },
            dsaProblemsPerWeek: { type: Number, default: 5 },
        },
        privacy: {
            shareData: { type: Boolean, default: false },
        },
    },
    integrations: {
        github: {
            accessTokenEncrypted: { type: String },
            username: { type: String },
            id: { type: String },
            connectedAt: { type: Date },
        },
    },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);
