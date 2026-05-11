import { Schema, model, models } from 'mongoose';
const ApplicationSchema = new Schema({
  // legacy support
  projectId: { type: Schema.Types.Mixed, ref: 'Project' },
  itemId: String,
  itemType: { type: String, enum: ['vacancy', 'project'], default: 'project' },
  itemMongoId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
  title: String,
  companyName: String,
  city: String,
  category: String,
  source: String,
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  coverLetter: String,
  proposedPrice: Number,
  expectedSalary: Number,
  estimatedDuration: String,
  status: { type: String, enum: ['SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'], default: 'SENT' }
}, { timestamps: { createdAt: true, updatedAt: false } });
export default models.Application || model('Application', ApplicationSchema);
