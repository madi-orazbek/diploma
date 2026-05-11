import { z } from 'zod';
import Favorite from '@/models/Favorite';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import { findProjectOrVacancyById } from '@/lib/projects/findProjectOrVacancyById';

const createSchema = z.object({
  itemId: z.string().min(2),
  itemType: z.enum(['vacancy', 'project']).optional(),
  title: z.string().optional(),
  companyName: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  source: z.string().optional(),
});

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth();
    await dbConnect();
    const rows = await Favorite.find({ userId: user.userId }).sort({ createdAt: -1 }).lean();
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const user = requireAuth();
    await dbConnect();
    const payload = createSchema.parse(await req.json());

    const found = await findProjectOrVacancyById(payload.itemId);
    const doc = found?.doc || null;

    const data = {
      itemType: payload.itemType || (String(doc?.entity_type || '').toLowerCase() === 'vacancy' ? 'vacancy' : 'project'),
      title: payload.title || doc?.title || 'Untitled item',
      companyName: payload.companyName || doc?.company?.name || doc?.companyName || '',
      city: payload.city || doc?.location?.city || doc?.city || '',
      category: payload.category || doc?.category || '',
      budgetMin: payload.budgetMin ?? doc?.budgetMin ?? doc?.salary?.from ?? null,
      budgetMax: payload.budgetMax ?? doc?.budgetMax ?? doc?.salary?.to ?? null,
      source: payload.source || doc?.source || '',
    };

    const existing = await Favorite.findOne({ userId: user.userId, itemId: payload.itemId });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return ok({ removed: true, itemId: payload.itemId });
    }

    const row = await Favorite.create({ userId: user.userId, itemId: payload.itemId, ...data });
    return ok({ removed: false, row }, 201);
  });
}
