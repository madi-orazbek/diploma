export const dynamic = 'force-dynamic';

import Conversation from '@/models/Conversation';
import Application from '@/models/Application';
import ProjectModel from '@/models/Project';
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

    let rows: any[] = [];

    if (user.role === 'STUDENT') {
      const filter: any = { studentId: user.userId };
      if (applicationId) filter.applicationId = applicationId;
      rows = await Conversation.find(filter).sort({ updatedAt: -1 }).lean();
    } else if (user.role === 'CLIENT') {
      // 1. Find all this client's projects
      const clientProjects = await ProjectModel.find({ clientId: user.userId }).select('_id').lean() as any[];
      const projectIds = clientProjects.map((p: any) => p._id);

      // 2. Find applications for those projects
      const clientApps = await Application.find({
        $or: [
          { itemMongoId: { $in: projectIds } },
          { projectId: { $in: projectIds } },
        ],
      }).select('_id').lean() as any[];
      const appIds = clientApps.map((a: any) => a._id);

      // 3. Find conversations by employerId OR by applicationId (covers old data)
      const convFilter: any = {
        $or: [
          { employerId: new mongoose.Types.ObjectId(user.userId) },
          { applicationId: { $in: appIds } },
        ],
      };
      if (applicationId) convFilter.applicationId = applicationId;

      rows = await Conversation.find(convFilter).sort({ updatedAt: -1 }).lean();

      // Deduplicate (a conversation might match both conditions)
      const seen = new Set<string>();
      rows = rows.filter((r: any) => {
        const id = String(r._id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      // Enrich with student info and application details
      if (rows.length > 0) {
        const studentIds = [...new Set(rows.map((r: any) => String(r.studentId)).filter(Boolean))];
        const students = await User.find({ _id: { $in: studentIds } }).select('fullName email university').lean() as any[];
        const studentMap = new Map(students.map((s: any) => [String(s._id), s]));

        const rowAppIds = rows.map((r: any) => r.applicationId).filter(Boolean);
        const apps = await Application.find({ _id: { $in: rowAppIds } }).select('title coverLetter status').lean() as any[];
        const appMap = new Map(apps.map((a: any) => [String(a._id), a]));

        rows = rows.map((r: any) => ({
          ...r,
          student: studentMap.get(String(r.studentId)) || null,
          application: appMap.get(String(r.applicationId)) || null,
        }));
      }
    } else {
      // ADMIN sees all
      rows = await Conversation.find({}).sort({ updatedAt: -1 }).limit(100).lean();
    }

    return ok(rows);
  });
}
