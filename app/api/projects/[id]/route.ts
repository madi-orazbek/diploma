import { z } from 'zod';
import mongoose from 'mongoose';
import Project from '@/models/Project';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok, ApiError } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { findProjectOrVacancyById } from '@/lib/projects/findProjectOrVacancyById';

const updateSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(20).max(4000).optional(),
  category: z.string().min(2).max(80).optional(),
  requiredSkills: z.array(z.string()).optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  deadline: z.string().optional(),
  city: z.string().min(2).max(80).optional(),
  employmentType: z.string().min(2).max(40).optional(),
  experienceLevel: z.string().min(2).max(40).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    const found = await findProjectOrVacancyById(params.id);
    if (!found?.doc) throw new ApiError('Project not found', 404);
    return ok({
      ...found.doc,
      sourceCollection: found.sourceCollection,
      lookupId: params.id,
    });
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();
    const payload = updateSchema.parse(await req.json());
    let targetId = params.id;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      const raw = await Project.collection.findOne({ id: targetId }, { projection: { _id: 1 } });
      if (!raw?._id) throw new ApiError('Project not found', 404);
      targetId = String(raw._id);
    }
    const updated = await Project.findByIdAndUpdate(targetId, payload, { new: true });
    if (!updated) throw new ApiError('Project not found', 404);
    return ok(updated);
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();
    let targetId = params.id;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      const raw = await Project.collection.findOne({ id: targetId }, { projection: { _id: 1 } });
      if (!raw?._id) throw new ApiError('Project not found', 404);
      targetId = String(raw._id);
    }
    const deleted = await Project.findByIdAndDelete(targetId);
    if (!deleted) throw new ApiError('Project not found', 404);
    return ok({ removed: true });
  });
}
