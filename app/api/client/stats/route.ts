import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import Project from '@/models/Project';
import Application from '@/models/Application';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleApi(async () => {
    const user = requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();

    const clientId = user.userId;
    const myProjects = await Project.find({ clientId }).select('_id status title createdAt').lean() as any[];
    const projectIds = myProjects.map((p: any) => p._id);
    const projectIdStrings = projectIds.map(String);

    const [activeCount, completedCount, applicationCount, recentApplications] = await Promise.all([
      Promise.resolve(myProjects.filter((p: any) => p.status === 'OPEN').length),
      Promise.resolve(myProjects.filter((p: any) => p.status === 'COMPLETED').length),
      Application.countDocuments({
        $or: [
          { projectId: { $in: projectIds } },
          { itemId: { $in: projectIdStrings } },
        ],
      }),
      Application.find({
        $or: [
          { projectId: { $in: projectIds } },
          { itemId: { $in: projectIdStrings } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const recentProjects = myProjects
      .sort((a: any, b: any) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)))
      .slice(0, 5);

    return ok({
      activeProjects: activeCount,
      completedProjects: completedCount,
      totalProjects: myProjects.length,
      totalApplications: applicationCount,
      recentProjects,
      recentApplications,
    });
  });
}
