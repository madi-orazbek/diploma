import { z } from 'zod';
import Application from '@/models/Application';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth';

const schema = z.object({ action: z.enum(['WITHDRAW', 'ACCEPT', 'REJECT']) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'CLIENT', 'ADMIN']);
    await dbConnect();
    const { action } = schema.parse(await req.json());
    const row: any = await Application.findById(params.id);
    if (!row) throw new ApiError('Application not found', 404);

    if (action === 'WITHDRAW' && user.role === 'STUDENT') row.status = 'WITHDRAWN';
    if (action === 'ACCEPT' && (user.role === 'CLIENT' || user.role === 'ADMIN')) row.status = 'ACCEPTED';
    if (action === 'REJECT' && (user.role === 'CLIENT' || user.role === 'ADMIN')) row.status = 'REJECTED';

    await row.save();
    return ok(row);
  });
}
