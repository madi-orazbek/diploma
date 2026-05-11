import { Schema, model, models } from 'mongoose';
const ReviewSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  rating: Number,
  text: String
}, { timestamps: { createdAt: true, updatedAt: false } });
export default models.Review || model('Review', ReviewSchema);
