import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  team_id: string;
  team_name: string;
  index: number;
  active: boolean;
  presentation_time: Date;
}

const TeamSchema = new Schema<ITeam>({
  team_id: {
    type: String,
    required: true,
    unique: true,
  },
  team_name: {
    type: String,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  presentation_time: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Use mongoose.models or create a new model to avoid model redefinition errors
export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema); 