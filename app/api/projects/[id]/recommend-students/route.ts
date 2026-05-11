import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import Project from '@/models/Project';
import StudentProfile from '@/models/StudentProfile';
import Application from '@/models/Application';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

function skillOverlap(studentSkills: string[], projectSkills: string[]): number {
  if (!studentSkills.length || !projectSkills.length) return 0;
  const pSet = new Set(projectSkills.map((s) => s.toLowerCase().trim()));
  return studentSkills.filter((s) => pSet.has(s.toLowerCase().trim())).length;
}

function computeMatchScore(profile: any, project: any): number {
  const sSkills: string[] = profile.skills || [];
  const pSkills: string[] = project.requiredSkills || [];
  const overlap = skillOverlap(sSkills, pSkills);
  const overlapRatio = pSkills.length ? overlap / pSkills.length : 0;

  let score = 35 + overlapRatio * 45;

  if (
    profile.city &&
    project.city &&
    profile.city.toLowerCase() === project.city.toLowerCase()
  ) score += 6;

  if (
    profile.experienceLevel &&
    project.experienceLevel &&
    profile.experienceLevel.toLowerCase() === project.experienceLevel.toLowerCase()
  ) score += 7;

  if (profile.portfolioLinks?.length) score += 4;
  if (profile.githubUrl) score += 3;
  if (profile.about || profile.bio) score += 2;

  return Math.min(Math.round(score), 97);
}

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  return handleApi(async () => {
    requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();

    const project = (await Project.findById(params.id).lean()) as any;
    if (!project) {
      const { ApiError } = await import('@/lib/api');
      throw new ApiError('Project not found', 404);
    }

    const applications = (await Application.find({
      $or: [{ projectId: params.id }, { itemId: params.id }],
    }).lean()) as any[];

    const studentUserIds = [
      ...new Set(applications.map((a: any) => String(a.studentId))),
    ];

    if (!studentUserIds.length) return ok([]);

    const [profiles, users] = await Promise.all([
      StudentProfile.find({ userId: { $in: studentUserIds } }).lean() as any,
      User.find({ _id: { $in: studentUserIds } })
        .select('fullName email avatarUrl')
        .lean() as any,
    ]);

    const profileByUserId = new Map(
      (profiles as any[]).map((p: any) => [String(p.userId), p])
    );
    const userById = new Map(
      (users as any[]).map((u: any) => [String(u._id), u])
    );
    const appByStudentId = new Map(
      applications.map((a: any) => [String(a.studentId), a])
    );

    const ranked = studentUserIds
      .map((uid) => {
        const profile = profileByUserId.get(uid) as any;
        const user = userById.get(uid) as any;
        const app = appByStudentId.get(uid) as any;
        const score = profile ? computeMatchScore(profile, project) : 35;
        const matchedSkills: string[] = profile
          ? (profile.skills || []).filter((s: string) =>
              (project.requiredSkills || []).some(
                (ps: string) => ps.toLowerCase() === s.toLowerCase()
              )
            )
          : [];

        return {
          userId: uid,
          applicationId: String(app?._id || ''),
          applicationStatus: app?.status || 'SENT',
          coverLetter: app?.coverLetter || '',
          proposedPrice: app?.proposedPrice ?? null,
          estimatedDuration: app?.estimatedDuration || '',
          appliedAt: app?.createdAt || null,
          fullName: user?.fullName || 'Unknown Student',
          email: user?.email || '',
          skills: profile?.skills || [],
          experienceLevel: profile?.experienceLevel || '',
          city: profile?.city || '',
          githubUrl: profile?.githubUrl || '',
          linkedinUrl: profile?.linkedinUrl || '',
          portfolioLinks: profile?.portfolioLinks || [],
          about: profile?.about || profile?.bio || '',
          matchScore: score,
          matchedSkills,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return ok(ranked);
  });
}
