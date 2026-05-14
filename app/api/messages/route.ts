import { z } from 'zod';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { touchConversation } from '@/lib/conversations';

const sendSchema = z.object({
  conversationId: z.string().min(8),
  text: z.string().min(1).max(2000),
});

export async function GET(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'CLIENT', 'ADMIN']);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) return ok([]);

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv) return ok([]);

    // Access control: student must own the conversation, client must be the employer
    const convStudentId = String((conv as any).studentId ?? '');
    const convEmployerId = String((conv as any).employerId ?? '');
    const participantIds: string[] = ((conv as any).participantIds ?? []).map(String);

    if (user.role === 'STUDENT') {
      const isParticipant =
        convStudentId === user.userId || participantIds.includes(user.userId);
      if (!isParticipant) return ok([]);
    }
    if (user.role === 'CLIENT') {
      const isEmployer = convEmployerId === user.userId || participantIds.includes(user.userId);
      if (!isEmployer) return ok([]);
    }

    const rows = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'CLIENT', 'ADMIN']);
    await dbConnect();

    const payload = sendSchema.parse(await req.json());
    const conv = await Conversation.findById(payload.conversationId);
    if (!conv) throw new Error('Conversation not found');

    const message = await Message.create({
      conversationId: conv._id,
      applicationId: conv.applicationId,
      itemId: conv.itemId,
      itemType: conv.itemType,
      senderId: user.userId,
      senderRole: user.role,
      text: payload.text,
    });

    await touchConversation(conv._id, payload.text);

    return ok(message, 201);
  });
}
