export const dynamic = 'force-dynamic';

import Conversation from '@/models/Conversation';
import Application from '@/models/Application';
import ProjectModel from '@/models/Project';
import User from '@/models/User';
import ClientProfile from '@/models/ClientProfile';
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
      rows = await Conversation.find(filter)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean();

      // Deduplicate by (employerId + projectMongoId) — keep only the most recent.
      // When BOTH are null/empty (e.g. demo-project conversations) skip dedup so
      // each conversation is shown individually instead of all being collapsed into one.
      const seen = new Set<string>();
      rows = rows.filter((r: any) => {
        const eid = String(r.employerId || '');
        const pid = String(r.projectMongoId || '');
        if (!eid && !pid) return true; // distinct conversations for demo projects
        const key = `${eid}_${pid}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Enrich with client/company info
      if (rows.length > 0) {
        const employerIds = [...new Set(rows.map((r: any) => String(r.employerId)).filter(Boolean))];
        const [employers, clientProfiles, appDocs, projects] = await Promise.all([
          User.find({ _id: { $in: employerIds } }).select('fullName email').lean() as any,
          ClientProfile.find({ userId: { $in: employerIds } }).select('userId companyName').lean() as any,
          Application.find({ _id: { $in: rows.map((r: any) => r.applicationId).filter(Boolean) } })
            .select('title status coverLetter')
            .lean() as any,
          ProjectModel.find({ _id: { $in: rows.map((r: any) => r.projectMongoId).filter(Boolean) } })
            .select('title')
            .lean() as any,
        ]);

        const employerMap = new Map((employers as any[]).map((e: any) => [String(e._id), e]));
        const clientProfileMap = new Map((clientProfiles as any[]).map((p: any) => [String(p.userId), p]));
        const appMap = new Map((appDocs as any[]).map((a: any) => [String(a._id), a]));
        const projectMap = new Map((projects as any[]).map((p: any) => [String(p._id), p]));

        rows = rows.map((r: any) => {
          const employer = employerMap.get(String(r.employerId));
          const cp = clientProfileMap.get(String(r.employerId));
          const app = appMap.get(String(r.applicationId));
          const project = projectMap.get(String(r.projectMongoId));
          return {
            ...r,
            employer: employer ? {
              fullName: employer.fullName,
              companyName: cp?.companyName || employer.fullName,
            } : null,
            application: app || null,
            project: project ? { title: project.title } : null,
          };
        });
      }

    } else if (user.role === 'CLIENT') {
      // Find all this client's projects
      const clientProjects = await ProjectModel.find({ clientId: user.userId }).select('_id title').lean() as any[];
      const projectIds = clientProjects.map((p: any) => p._id);
      const projectTitleMap = new Map((clientProjects as any[]).map((p: any) => [String(p._id), p.title]));

      // Find applications for those projects
      const clientApps = await Application.find({
        $or: [
          { itemMongoId: { $in: projectIds } },
          { projectId: { $in: projectIds } },
        ],
      }).select('_id').lean() as any[];
      const appIds = clientApps.map((a: any) => a._id);

      const convFilter: any = {
        $or: [
          { employerId: new mongoose.Types.ObjectId(user.userId) },
          { applicationId: { $in: appIds } },
        ],
      };
      if (applicationId) convFilter.applicationId = applicationId;

      rows = await Conversation.find(convFilter)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .lean();

      // Deduplicate by (studentId + projectMongoId)
      const seen = new Set<string>();
      rows = rows.filter((r: any) => {
        const key = `${String(r.studentId || '')}_${String(r.projectMongoId || r.applicationId || '')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

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
          project: r.projectMongoId
            ? { title: projectTitleMap.get(String(r.projectMongoId)) || null }
            : null,
        }));
      }
    } else {
      rows = await Conversation.find({}).sort({ lastMessageAt: -1, updatedAt: -1 }).limit(100).lean();
    }

    return ok(rows);
  });
}
