import { z } from 'zod';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Project from '@/models/Project';
import mongoose from 'mongoose';

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

    // Find or create conversation between this client and student (no applicationId)
    let conv = await Conversation.findOne({
      studentId: body.studentId,
      employerId: new mongoose.Types.ObjectId(user.userId),
      applicationId: { $exists: false },
    });

    if (!conv) {
      conv = await Conversation.create({
        studentId: body.studentId,
        employerId: new mongoose.Types.ObjectId(user.userId),
      });
    }

    await Message.create({
      conversationId: conv._id,
      senderId: user.userId,
      senderRole: 'CLIENT',
      text: `Hi! I'd like to invite you to apply for our project: "${project.title}". Please check it out and apply if you're interested.`,
    });

    return ok({ conversationId: String(conv._id) }, 201);
  });
}
