/**
 * Secure AI assistant endpoint — OpenAI stored Prompt Template.
 * OPENAI_API_KEY is read server-side only; never exposed to the browser.
 * Falls back gracefully to deterministic local logic when the key is absent or the call fails.
 */
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { runCareerAssistant } from '@/lib/assistant-chat';
import { runClientAssistant } from '@/lib/client-assistant';
import StudentProfile from '@/models/StudentProfile';
import ClientProfile from '@/models/ClientProfile';
import Application from '@/models/Application';
import Project from '@/models/Project';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

const PROMPT_ID = 'pmpt_6a0645eda05081979faeee6759b7ccf908f5b70899dfc5ea';
const PROMPT_VERSION = '1';

// ─── OpenAI Responses API ─────────────────────────────────────────────────────

async function callStoredPrompt(variables: Record<string, string>): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('PASTE')) {
    console.log('AI assistant: OPENAI_API_KEY not configured — using local fallback');
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey, timeout: 20_000 });

    const response = await openai.responses.create({
      prompt: {
        id: PROMPT_ID,
        version: PROMPT_VERSION,
        variables,
      },
    });

    // output_text is the direct string accessor on the Response object
    const text = response.output_text ?? '';
    return text.trim() || null;
  } catch (err: any) {
    console.error('AI assistant: OpenAI call failed —', err?.message ?? err);
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toJson(value: unknown): string {
  try { return JSON.stringify(value ?? {}); } catch { return '{}'; }
}

function cut(s: unknown, n: number): string {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // ── 1. Auth (JWT cookie — server-side only) ───────────────────────────────
    const jwtUser = requireAuth(['STUDENT', 'CLIENT', 'ADMIN']);

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const message   = String(body?.message ?? '').trim();
    const language  = String(body?.language ?? 'en');
    const page      = String(body?.page ?? '/');
    const historyRaw: Array<{ role: string; text: string }> =
      Array.isArray(body?.history) ? body.history.slice(-8) : [];

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required.' }, { status: 400 });
    }

    await dbConnect();

    // ── 3. Load full user record (for name/email) ─────────────────────────────
    const userDoc: any = await User.findById(jwtUser.userId).lean();
    const userName  = String(userDoc?.fullName ?? userDoc?.name ?? 'User');
    const userEmail = String(userDoc?.email ?? '');

    // ── 4. Debug log (no secrets) ─────────────────────────────────────────────
    console.log('AI context', {
      isAuthenticated: true,
      userId: jwtUser.userId,
      role: jwtUser.role,
      userName,
      language,
      page,
      historyLength: historyRaw.length,
    });

    // ── 5. STUDENT branch ─────────────────────────────────────────────────────
    if (jwtUser.role === 'STUDENT') {
      const localData = await runCareerAssistant(message, jwtUser.userId);

      const profileRaw = await StudentProfile.findOne({ userId: jwtUser.userId }).lean();
      const profile: Record<string, unknown> =
        (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) ?? {};

      const apps = await Application.find({ studentId: jwtUser.userId })
        .sort({ createdAt: -1 }).limit(5).lean();

      const studentProfileObj = {
        fullName: profile.fullName ?? userName,
        university: profile.university ?? 'AITU',
        experienceLevel: profile.experienceLevel ?? 'JUNIOR',
        city: profile.city ?? '',
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        about: cut(profile.about, 400),
        githubUrl: profile.githubUrl ?? '',
        linkedinUrl: profile.linkedinUrl ?? '',
        availabilityStatus: profile.availabilityStatus ?? '',
        workplaceType: profile.workplaceType ?? '',
        preferredRoles: profile.preferredRoles ?? '',
      };

      const variables: Record<string, string> = {
        language,
        role:             'STUDENT',
        is_authenticated: 'true',
        current_user:     toJson({ id: jwtUser.userId, name: userName, email: userEmail, role: 'STUDENT' }),
        page,
        user_input:       message,
        student_profile:  toJson(studentProfileObj),
        client_profile:   '{}',
        projects:         toJson(localData.jobs.map(j => ({
          id: j.projectId, title: j.title, city: j.city,
          employmentType: j.employmentType, experienceLevel: j.experienceLevel,
          category: j.category, budget: j.budgetLabel,
        }))),
        selected_project: '{}',
        applications:     toJson(apps.map((a: any) => ({
          title: a.title ?? '', status: a.status ?? 'SENT', category: a.category ?? '', city: a.city ?? '',
        }))),
        messages:         toJson(historyRaw.map(m => ({ role: m.role, text: cut(m.text, 250) }))),
        match_scores:     toJson(localData.jobs.map(j => ({
          title: j.title, score: j.matchScore,
          matched: j.matchedSignals, missing: j.missingSignals,
        }))),
      };

      console.log('AI context (student detail)', {
        projectsCount:      localData.jobs.length,
        applicationsCount:  apps.length,
        profileSkills:      studentProfileObj.skills.length,
        hasAbout:           !!studentProfileObj.about,
      });

      const aiReply = await callStoredPrompt(variables);

      return NextResponse.json({
        success: true,
        data: {
          reply: aiReply ?? localData.reply,
          jobs: localData.jobs,
          quickActions: localData.quickActions,
          profileTips: localData.profileTips,
          profilePatch: localData.profilePatch,
          aiPowered: aiReply !== null,
        },
      });
    }

    // ── 6. CLIENT / ADMIN branch ──────────────────────────────────────────────
    if (jwtUser.role === 'CLIENT' || jwtUser.role === 'ADMIN') {
      const localData = runClientAssistant(message);

      const cpRaw = await ClientProfile.findOne({ userId: jwtUser.userId }).lean();
      const cp: Record<string, unknown> = (Array.isArray(cpRaw) ? cpRaw[0] : cpRaw) ?? {};

      const clientProjects = await Project.find({ clientId: jwtUser.userId })
        .sort({ createdAt: -1 }).limit(5).lean();

      const clientProfileObj = {
        companyName: cp.companyName ?? userName,
        industry: cp.industry ?? '',
        city: cp.city ?? '',
        companySize: cp.companySize ?? '',
        companyDescription: cut(cp.companyDescription, 300),
        contactEmail: userEmail,
      };

      const variables: Record<string, string> = {
        language,
        role:             jwtUser.role,
        is_authenticated: 'true',
        current_user:     toJson({ id: jwtUser.userId, name: userName, email: userEmail, role: jwtUser.role }),
        page,
        user_input:       message,
        student_profile:  '{}',
        client_profile:   toJson(clientProfileObj),
        projects:         toJson(clientProjects.map((p: any) => ({
          title: p.title ?? '', category: p.category ?? '',
          status: p.status ?? '', budgetMin: p.budgetMin ?? 0,
          budgetMax: p.budgetMax ?? 0, requiredSkills: p.requiredSkills ?? [],
        }))),
        selected_project: '{}',
        applications:     '[]',
        messages:         toJson(historyRaw.map(m => ({ role: m.role, text: cut(m.text, 250) }))),
        match_scores:     '[]',
      };

      console.log('AI context (client detail)', {
        projectsCount: clientProjects.length,
        hasProfile: !!cp.companyName,
      });

      const aiReply = await callStoredPrompt(variables);

      return NextResponse.json({
        success: true,
        data: {
          reply: aiReply ?? localData.reply,
          tips: localData.tips,
          quickActions: localData.quickActions,
          aiPowered: aiReply !== null,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported role.' }, { status: 403 });

  } catch (error: any) {
    console.error('AI ASSISTANT ERROR:', error?.message ?? error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Assistant unavailable.' },
      { status: Number(error?.status ?? 500) },
    );
  }
}
