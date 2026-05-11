import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import ClientProfile from '@/models/ClientProfile';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();
    const profile = await ClientProfile.findOne({ userId: user.userId }).lean();
    return ok(profile || {});
  });
}

export async function PUT(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();
    const body = await req.json();
    const { companyName, companyDescription, website, industry } = body;
    const profile = await ClientProfile.findOneAndUpdate(
      { userId: user.userId },
      { companyName, companyDescription, website, industry },
      { upsert: true, new: true, runValidators: false }
    ).lean();
    return ok(profile);
  });
}
