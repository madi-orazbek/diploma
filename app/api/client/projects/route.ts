import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Project from '@/models/Project';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = requireAuth(['CLIENT', 'ADMIN']);
    await dbConnect();

    const filter = user.role === 'ADMIN' ? {} : { clientId: user.userId };
    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load projects' },
      { status: Number(error?.status || 500) }
    );
  }
}
