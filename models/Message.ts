import { Schema, model, models } from 'mongoose';
const MessageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  applicationId: { type: Schema.Types.ObjectId, ref: 'Application' },
  itemId: String,
  itemType: String,
  projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
  senderRole: String,
  text: String
}, { timestamps: { createdAt: true, updatedAt: false } });
export default models.Message || model('Message', MessageSchema);
