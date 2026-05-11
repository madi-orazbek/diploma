import { Schema, model, models } from 'mongoose';
const RecommendationLogSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  score: Number,
  sourceModel: String
}, { timestamps: { createdAt: true, updatedAt: false } });
export default models.RecommendationLog || model('RecommendationLog', RecommendationLogSchema);
