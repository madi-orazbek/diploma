import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import ClientProfile from '@/models/ClientProfile';
import Project from '@/models/Project';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  return handleApi(async () => {
    await dbConnect();
    const { userId } = params;
    const profile = await ClientProfile.findOne({ userId }).lean() as any;
    const projects = await Project.find({ clientId: userId }).select('title status createdAt category budgetMin budgetMax').sort({ createdAt: -1 }).limit(10).lean();
    return ok({
      userId,
      companyName: profile?.companyName || 'Company',
      companyDescription: profile?.companyDescription || '',
      website: profile?.website || '',
      industry: profile?.industry || '',
      city: profile?.city || '',
      companySize: profile?.companySize || '',
      contactEmail: profile?.contactEmail || '',
      linkedinUrl: profile?.linkedinUrl || '',
      typicalProjects: profile?.typicalProjects || [],
      activeProjects: projects.filter((p: any) => p.status === 'OPEN' || p.status === 'IN_PROGRESS').length,
      completedProjects: projects.filter((p: any) => p.status === 'COMPLETED').length,
      recentProjects: projects.slice(0, 5),
    });
  });
}
