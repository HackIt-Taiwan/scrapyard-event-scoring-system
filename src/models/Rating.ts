import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  team_id: string;
  user_id: string;
  creativity: number;
  completeness: number;
  presentation: number;
  comments: string;
}

const RatingSchema = new Schema<IRating>({
  team_id: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  creativity: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  completeness: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  presentation: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  comments: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Add a compound index to prevent duplicate ratings from the same user for the same team
RatingSchema.index({ team_id: 1, user_id: 1 }, { unique: true });

export default mongoose.models.Rating || mongoose.model<IRating>('Rating', RatingSchema); 