import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  user_id: string;
  email: string;
  team_id: string | null; // If user is a team member
  is_admin: boolean;
  is_judge: boolean;
}

const UserSchema = new Schema<IUser>({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  team_id: {
    type: String,
    default: null,
  },
  is_admin: {
    type: Boolean,
    default: false,
  },
  is_judge: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 