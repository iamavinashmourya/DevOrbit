import mongoose, { Document, Schema } from 'mongoose';

export interface IClassificationCache extends Document {
    key: string; // Composite key: "title|context"
    category: string;
    createdAt: Date;
}

const ClassificationCacheSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IClassificationCache>('ClassificationCache', ClassificationCacheSchema);
