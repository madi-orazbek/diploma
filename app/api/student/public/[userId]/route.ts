import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(
  _: Request,
  { params }: { params: { userId: string } }
) {
  try {
    requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();

    const [user, profile] = await Promise.all([
      User.findById(params.userId).select('fullName university city').lean() as any,
      StudentProfile.findOne({ userId: params.userId })
        .select('skills experienceLevel city about headline githubUrl linkedinUrl portfolioLinks availabilityStatus experienceEntries')
        .lean() as any,
    ]);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: String(params.userId),
        fullName: user.fullName || 'Student',
        university: user.university || profile?.university || '',
        city: profile?.city || user.city || '',
        skills: profile?.skills || [],
        experienceLevel: profile?.experienceLevel || '',
        about: profile?.about || '',
        headline: profile?.headline || '',
        githubUrl: profile?.githubUrl || '',
        linkedinUrl: profile?.linkedinUrl || '',
        portfolioLinks: profile?.portfolioLinks || [],
        availabilityStatus: profile?.availabilityStatus || '',
        experienceEntries: profile?.experienceEntries || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load profile' },
      { status: Number(error?.status || 500) }
    );
  }
}
