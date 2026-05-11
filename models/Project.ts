import { Schema, model, models } from 'mongoose';
const ProjectSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  description: String,
  category: String,
  requiredSkills: [String],
  budgetMin: Number,
  budgetMax: Number,
  deadline: Date,
  city: String,
  employmentType: String,
  experienceLevel: String,
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'OPEN' }
}, { timestamps: true });
export default models.Project || model('Project', ProjectSchema);
