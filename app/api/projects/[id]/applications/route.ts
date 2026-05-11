import Application from '@/models/Application';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();
    const rows = await Application.find({
      $or: [{ itemId: params.id }, { projectId: params.id }]
    }).sort({ createdAt: -1 }).lean();
    return ok(rows);
  });
}
