import { z } from 'zod';
import { NextResponse } from 'next/server';
import Project from '@/models/Project';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { loadUnifiedDataset } from '@/lib/recommendation/unified-dataset';

const createSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(4000),
  category: z.string().min(2).max(80),
  requiredSkills: z.union([z.string(), z.array(z.string())]),
  budgetMin: z.coerce.number().min(0),
  budgetMax: z.coerce.number().min(0),
  deadline: z.string().optional(),
  city: z.string().min(2).max(80).optional(),
  employmentType: z.string().min(2).max(40).optional(),
  experienceLevel: z.string().min(2).max(40).optional()
}).refine((v) => v.budgetMax >= v.budgetMin, 'budgetMax must be greater than or equal to budgetMin');

function includesText(value: unknown, query: string) {
  return String(value || '').toLowerCase().includes(query.toLowerCase());
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || '').trim();
    const city = (searchParams.get('city') || '').trim();
    const experienceLevel = (searchParams.get('experience') || '').trim();
    const employmentType = (searchParams.get('employment') || '').trim();
    const sort = (searchParams.get('sort') || 'newest').trim();

    const unified = await loadUnifiedDataset();
    const openItems = unified.filter((item) => item.status === 'OPEN');

    console.log('[projects] dataset summary', {
      unifiedItems: unified.length,
      openItems: openItems.length,
      sampleOpenItem: openItems[0]
        ? { id: openItems[0].id, title: openItems[0].title, company: openItems[0].company, city: openItems[0].city, skills: (openItems[0].requiredSkills || []).slice(0, 6) }
        : null,
    });

    let filtered = openItems.filter((item) => {
      if (q) {
        const haystack = [item.title, item.description, item.category, item.city, ...(item.requiredSkills || [])].join(' ');
        if (!includesText(haystack, q)) return false;
      }
      if (category && !includesText(item.category, category)) return false;
      if (city && !includesText(item.city, city)) return false;
      if (experienceLevel && !includesText(item.experienceLevel, experienceLevel)) return false;
      if (employmentType && !includesText(item.employmentType, employmentType)) return false;
      return true;
    });

    filtered = filtered.sort((a, b) => {
      if (sort === 'budget_asc') {
        return Number(a.budgetMin ?? Number.MAX_SAFE_INTEGER) - Number(b.budgetMin ?? Number.MAX_SAFE_INTEGER);
      }
      if (sort === 'budget_desc') {
        return Number(b.budgetMax ?? -1) - Number(a.budgetMax ?? -1);
      }
      return Number(new Date(b.createdAt || 0)) - Number(new Date(a.createdAt || 0));
    });

    console.log('[projects] filtered summary', {
      afterFilters: filtered.length,
      q,
      category,
      city,
      experienceLevel,
      employmentType,
      sort,
    });

    return NextResponse.json({ success: true, data: filtered.slice(0, 200) });
  } catch (error: any) {
    console.error('PROJECTS ERROR:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const user = requireAuth(['CLIENT', 'ADMIN']);
    const body = createSchema.parse(await req.json());

    const requiredSkills = Array.isArray(body.requiredSkills)
      ? body.requiredSkills
      : body.requiredSkills.split(',').map((x) => x.trim()).filter(Boolean);

    const project = await Project.create({
      clientId: user.userId,
      ...body,
      requiredSkills,
      deadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 14 * 86400000)
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error: any) {
    console.error('PROJECTS CREATE ERROR:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
