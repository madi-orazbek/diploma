import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import Message from '@/models/Message';
import Project from '@/models/Project';
import { getOrCreateConversation, touchConversation } from '@/lib/conversations';

const inviteSchema = z.object({
  studentId: z.string().min(1),
  projectId: z.string().min(1),
});

export async function POST(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['CLIENT']);
    await dbConnect();

    const body = inviteSchema.parse(await req.json());
    const project = await Project.findById(body.projectId).lean() as any;
    if (!project) throw new Error('Project not found');
    if (String(project.clientId) !== user.userId) throw new Error('Forbidden');

    const conv = await getOrCreateConversation({
      studentId: body.studentId,
      employerId: user.userId,
      projectMongoId: body.projectId,
    });

    const inviteText = `Hi! I'd like to invite you to apply for our project: "${project.title}". Please check it out and apply if you're interested.`;

    // Check if an invite for this project was already sent to avoid spam
    const existing = await Message.findOne({
      conversationId: conv._id,
      senderId: user.userId,
      text: inviteText,
    }).lean();

    if (!existing) {
      await Message.create({
        conversationId: conv._id,
        senderId: user.userId,
        senderRole: 'CLIENT',
        text: inviteText,
      });
      await touchConversation(conv._id, inviteText);
    }

    return ok({ conversationId: String(conv._id) }, 201);
  });
}
