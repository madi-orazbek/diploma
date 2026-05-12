import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const university = (searchParams.get('university') || '').trim();
    const skill = (searchParams.get('skill') || '').trim();
    const city = (searchParams.get('city') || '').trim();
    const level = (searchParams.get('level') || '').trim();

    // Build profile filter
    const profileFilter: any = {};
    if (skill) profileFilter.skills = { $regex: skill, $options: 'i' };
    if (city) profileFilter.city = { $regex: city, $options: 'i' };
    if (level) profileFilter.experienceLevel = level.toUpperCase();

    // Build user filter for university
    const userFilter: any = { role: 'STUDENT', suspended: { $ne: true } };
    if (university) userFilter.university = university;

    const users = await User.find(userFilter).select('_id fullName university').lean() as any[];
    const userIds = users.map((u: any) => u._id);
    const userMap = new Map(users.map((u: any) => [String(u._id), u]));

    const profiles = await StudentProfile.find({
      userId: { $in: userIds },
      ...profileFilter,
    })
      .select('userId skills experienceLevel city about githubUrl portfolioLinks availabilityStatus')
      .limit(60)
      .lean() as any[];

    const result = profiles.map((p: any) => {
      const user = userMap.get(String(p.userId));
      return {
        _id: String(p.userId),
        fullName: user?.fullName || 'Student',
        university: user?.university || '',
        city: p.city || '',
        skills: p.skills || [],
        experienceLevel: p.experienceLevel || '',
        about: p.about || '',
        githubUrl: p.githubUrl || '',
        portfolioLinks: p.portfolioLinks || [],
        availabilityStatus: p.availabilityStatus || '',
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch students' },
      { status: Number(error?.status || 500) }
    );
  }
}
