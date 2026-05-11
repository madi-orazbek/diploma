export const dynamic = 'force-dynamic';

import Conversation from '@/models/Conversation';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'CLIENT', 'ADMIN']);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    const filter: any = user.role === 'STUDENT' ? { studentId: user.userId } : {};
    if (applicationId) filter.applicationId = applicationId;

    const rows = await Conversation.find(filter).sort({ updatedAt: -1 }).lean();
    return ok(rows);
  });
}
