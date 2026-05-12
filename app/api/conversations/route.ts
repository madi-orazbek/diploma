export const dynamic = 'force-dynamic';

import Conversation from '@/models/Conversation';
import Application from '@/models/Application';
import User from '@/models/User';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  return handleApi(async () => {
    const user = requireAuth(['STUDENT', 'CLIENT', 'ADMIN']);
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    let filter: any = {};
    if (user.role === 'STUDENT') {
      filter.studentId = user.userId;
    } else if (user.role === 'CLIENT') {
      // Clients see conversations where they are the employer
      filter.employerId = new mongoose.Types.ObjectId(user.userId);
    }
    if (applicationId) filter.applicationId = applicationId;

    const rows = await Conversation.find(filter).sort({ updatedAt: -1 }).lean();

    // Enrich with student name for client view
    if (user.role === 'CLIENT' && rows.length > 0) {
      const studentIds = [...new Set(rows.map((r: any) => String(r.studentId)).filter(Boolean))];
      const students = await User.find({ _id: { $in: studentIds } }).select('fullName email university').lean() as any[];
      const studentMap = new Map(students.map((s: any) => [String(s._id), s]));

      const appIds = rows.map((r: any) => r.applicationId).filter(Boolean);
      const apps = await Application.find({ _id: { $in: appIds } }).select('title coverLetter status').lean() as any[];
      const appMap = new Map(apps.map((a: any) => [String(a._id), a]));

      const enriched = rows.map((r: any) => ({
        ...r,
        student: studentMap.get(String(r.studentId)) || null,
        application: appMap.get(String(r.applicationId)) || null,
      }));
      return ok(enriched);
    }

    return ok(rows);
  });
}
