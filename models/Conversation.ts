import { Schema, model, models } from 'mongoose';

const ConversationSchema = new Schema({
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  studentId: { type: Schema.Types.ObjectId, ref: 'User' },
  employerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  projectMongoId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
  itemId: String,
  itemType: { type: String, enum: ['vacancy', 'project'], default: 'project' },
  lastMessageAt: { type: Date, default: null },
  lastMessageText: { type: String, default: '' },
}, { timestamps: true });

export default models.Conversation || model('Conversation', ConversationSchema);
