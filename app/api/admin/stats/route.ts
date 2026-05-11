import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import Project from '@/models/Project';
import Application from '@/models/Application';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json({ error: 'MONGODB_URI is not configured' }, { status: 500 });
  }

  await dbConnect();
  const [totalUsers, totalStudents, totalClients, totalProjects, totalApplications] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: 'STUDENT' }),
    User.countDocuments({ role: 'CLIENT' }),
    Project.countDocuments({}),
    Application.countDocuments({})
  ]);

  return NextResponse.json({ totalUsers, totalStudents, totalClients, totalProjects, totalApplications, flaggedItems: 0 });
}
