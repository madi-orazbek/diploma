import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  role: { type: String, enum: ['STUDENT', 'CLIENT', 'ADMIN'], required: true },
  fullName: String,
  email: { type: String, unique: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpiresAt: Date,
  passwordHash: String,
  university: String,
  bio: String,
  avatarUrl: String,
  city: String,
  rating: { type: Number, default: 0 },
  suspended: { type: Boolean, default: false }
}, { timestamps: true });

export default models.User || model('User', UserSchema);
