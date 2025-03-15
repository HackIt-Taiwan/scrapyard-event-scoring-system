import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  team_id: string;
  title: string;
  description: string;
  narrative: string;
  keywords: string[];
  technologies: string[];
  github_url?: string;
  demo_url?: string;
  image_url?: string;
}

const ProjectSchema = new Schema<IProject>({
  team_id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  narrative: {
    type: String,
    default: '',
  },
  keywords: {
    type: [String],
    default: [],
  },
  technologies: {
    type: [String],
    default: [],
  },
  github_url: {
    type: String,
  },
  demo_url: {
    type: String,
  },
  image_url: {
    type: String,
  },
}, {
  timestamps: true,
});

// Use mongoose.models or create a new model to avoid model redefinition errors
export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema); 