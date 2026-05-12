import mongoose from 'mongoose';
import Conversation from '@/models/Conversation';

export async function getOrCreateConversation({
  studentId,
  employerId,
  projectMongoId,
  applicationId,
}: {
  studentId: string;
  employerId: string;
  projectMongoId?: string | null;
  applicationId?: string | null;
}) {
  const sId = new mongoose.Types.ObjectId(studentId);
  const eId = new mongoose.Types.ObjectId(employerId);

  const filter: any = { studentId: sId, employerId: eId };
  if (projectMongoId && mongoose.Types.ObjectId.isValid(projectMongoId)) {
    filter.projectMongoId = new mongoose.Types.ObjectId(projectMongoId);
  }

  const existing = await Conversation.findOne(filter).sort({ createdAt: 1 });
  if (existing) return existing;

  const data: any = { studentId: sId, employerId: eId };
  if (projectMongoId && mongoose.Types.ObjectId.isValid(projectMongoId)) {
    data.projectMongoId = new mongoose.Types.ObjectId(projectMongoId);
  }
  if (applicationId && mongoose.Types.ObjectId.isValid(applicationId)) {
    data.applicationId = new mongoose.Types.ObjectId(applicationId);
  }
  return Conversation.create(data);
}

export async function touchConversation(conversationId: string | mongoose.Types.ObjectId, text: string) {
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessageAt: new Date(),
    lastMessageText: text.slice(0, 120),
  });
}
