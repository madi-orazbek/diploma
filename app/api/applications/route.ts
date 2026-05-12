import { z } from 'zod';
import Application from '@/models/Application';
import Message from '@/models/Message';
import ProjectModel from '@/models/Project';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { findProjectOrVacancyById } from '@/lib/projects/findProjectOrVacancyById';
import { getOrCreateConversation, touchConversation } from '@/lib/conversations';
import mongoose from 'mongoose';
import Conversation from '@/models/Conversation';

const DEFAULT_COVER_LETTER = 'Hello, I am interested in this opportunity and would like to apply through UniWork.';

function normalizeCoverLetter(value: unknown) {
  const text = String(value || '').trim();
  return text.length ? text : DEFAULT_COVER_LETTER;
}

const createSchema = z.object({
  projectId: z.string().min(2).optional(),
  itemId: z.string().min(2).optional(),
  itemType: z.enum(['vacancy', 'project']).optional(),
  title: z.string().min(2).optional(),
  companyName: z.string().optional(),
  source: z.string().optional(),
  coverLetter: z.string().max(2000).optional(),
  proposedPrice: z.coerce.number().min(0).nullable().optional(),
  expectedSalary: z.coerce.number().min(0).nullable().optional(),
  estimatedDuration: z.string().min(2).max(120).nullable().optional()
});

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth();
    await dbConnect();
    const filter = user.role === 'STUDENT' ? { studentId: user.userId } : {};
    const rows = await Application.find(filter).sort({ createdAt: -1 }).lean();
    const appIds = rows.map((x: any) => x._id).filter(Boolean);
    const conversations = await Conversation.find({ applicationId: { $in: appIds } }).select({ _id: 1, applicationId: 1 }).lean();
    const byApplicationId = new Map(conversations.map((c: any) => [String(c.applicationId), String(c._id)]));
    const hydrated = rows.map((row: any) => ({ ...row, conversationId: byApplicationId.get(String(row._id)) || null }));
    return ok(hydrated);
  });
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT']);
    await dbConnect();
    const payload = createSchema.parse(await req.json());
    const coverLetter = normalizeCoverLetter(payload.coverLetter);

    const itemId = payload.itemId || payload.projectId;
    if (!itemId) throw new Error('itemId or projectId is required');

    const found = await findProjectOrVacancyById(itemId);
    const doc = found?.doc || null;
    const inferredType = payload.itemType || (String(doc?.entity_type || '').toLowerCase() === 'vacancy' ? 'vacancy' : 'project');
    const title = payload.title || doc?.title || 'Untitled item';
    const companyName = payload.companyName || doc?.company?.name || doc?.companyName || '';
    const city = doc?.location?.city || doc?.city || '';
    const category = doc?.category || '';
    const source = payload.source || doc?.source || '';
    const itemMongoId = mongoose.Types.ObjectId.isValid(String(doc?._id || '')) ? doc?._id : null;

    // Prevent duplicate applications
    const existingApp = await Application.findOne({
      studentId: user.userId,
      $or: [
        { itemMongoId: itemMongoId || undefined },
        { itemId },
        { projectId: itemId },
      ],
    }).lean();

    if (existingApp) {
      const existingConv = await Conversation.findOne({ applicationId: (existingApp as any)._id }).lean();
      const plain = existingApp as any;
      return ok({ ...plain, conversationId: existingConv ? String((existingConv as any)._id) : null, alreadyApplied: true });
    }

    const app = await Application.create({
      studentId: user.userId,
      projectId: itemMongoId || itemId,
      itemId,
      itemType: inferredType,
      itemMongoId,
      title,
      companyName,
      city,
      category,
      source,
      coverLetter,
      proposedPrice: payload.proposedPrice ?? null,
      expectedSalary: payload.expectedSalary ?? null,
      estimatedDuration: payload.estimatedDuration ?? null,
      status: 'SENT',
    });

    // Resolve employerId from the Project model
    let employerId: string | null = null;
    if (itemMongoId) {
      const project = await ProjectModel.findById(itemMongoId).select('clientId').lean() as { clientId?: any } | null;
      if (project?.clientId) {
        employerId = String(project.clientId);
      }
    }

    let conversation;
    if (employerId) {
      conversation = await getOrCreateConversation({
        studentId: user.userId,
        employerId,
        projectMongoId: itemMongoId ? String(itemMongoId) : null,
        applicationId: String(app._id),
      });
      // Ensure applicationId is set on the conversation
      if (!conversation.applicationId) {
        await conversation.updateOne({ applicationId: app._id });
      }
    } else {
      // Fallback for legacy items without a project model
      conversation = await Conversation.create({
        applicationId: app._id,
        studentId: user.userId,
        employerId: null,
        itemId,
        itemType: inferredType,
      });
    }

    await Message.create({
      conversationId: conversation._id,
      applicationId: app._id,
      itemId,
      itemType: inferredType,
      senderId: user.userId,
      senderRole: 'STUDENT',
      text: coverLetter,
    });

    await touchConversation(conversation._id, coverLetter);

    const plain = app.toObject();
    return ok({ ...plain, conversationId: String(conversation._id) }, 201);
  });
}
