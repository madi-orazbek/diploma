/**
 * Secure AI assistant endpoint — direct OpenAI model call.
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

const SYSTEM_PROMPT = `You are UniWork AI Assistant — a smart career and project-matching assistant for the UniWork platform, a student freelance marketplace in Kazakhstan (AITU university ecosystem).

Your role:
- STUDENT: Help find matching projects, write personalised cover letters, improve profiles, explain ML recommendations, suggest skills to learn, prepare for interviews.
- CLIENT/ADMIN: Help find student candidates, write invitation messages, improve project descriptions, explain matching scores, set competitive budgets.

You receive full platform context as JSON in the user message. Use it to give specific, personalised answers. Never reveal you are reading JSON — respond naturally as if you know the user.

Rules:
- Always respond in the language specified by the "language" field ("en" = English, "ru" = Russian).
- Be concise, practical, and encouraging.
- Use bullet points for lists.
- If projects or applications are provided, reference them by name.
- If match scores are provided, explain them clearly.
- Never say "please sign in" — the user is already authenticated.`;

// ─── OpenAI direct call ───────────────────────────────────────────────────────

async function callAI(contextPayload: object): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('AI route env:', { hasKey: Boolean(apiKey && !apiKey.startsWith('PASTE') && apiKey !== '') });

  if (!apiKey || apiKey.startsWith('PASTE') || apiKey.trim() === '') {
    console.log('AI assistant: OPENAI_API_KEY not configured — using local fallback');
    return null;
  }

  try {
    const openai = new OpenAI({ apiKey, timeout: 25_000 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai.responses.create as any)({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(contextPayload) },
      ],
    });

    const text: string = response?.output_text ?? '';
    console.log('AI assistant: OpenAI call succeeded, reply length:', text.length);
    return text.trim() || null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('AI assistant: OpenAI call failed —', msg);
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toObj(value: unknown): unknown {
  return value ?? {};
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
    // Accept both "message" and "userInput" as the user's question
    const message   = String(body?.message ?? body?.userInput ?? '').trim();
    const language  = String(body?.language ?? 'en');
    const page      = String(body?.page ?? '/');
    const historyRaw: Array<{ role: string; text: string }> =
      Array.isArray(body?.history) ? body.history.slice(-8) : [];

    if (!message) {
      return NextResponse.json({ ok: false, success: false, error: 'Message is required.' }, { status: 400 });
    }

    console.log('AI request context:', {
      isAuthenticated: true,
      userId: jwtUser.userId,
      role: jwtUser.role,
      language,
      page,
      bodyKeys: Object.keys(body),
    });

    await dbConnect();

    // ── 3. Load full user record ──────────────────────────────────────────────
    const userDoc: Record<string, unknown> =
      ((await User.findById(jwtUser.userId).lean()) as Record<string, unknown> | null) ?? {};
    const userName  = String(userDoc?.fullName ?? userDoc?.name ?? 'User');
    const userEmail = String(userDoc?.email ?? '');

    const currentUser = {
      id: jwtUser.userId,
      name: userName,
      email: userEmail,
      role: jwtUser.role,
    };

    // ── 4. STUDENT branch ─────────────────────────────────────────────────────
    if (jwtUser.role === 'STUDENT') {
      const localData = await runCareerAssistant(message, jwtUser.userId);

      const profileRaw = await StudentProfile.findOne({ userId: jwtUser.userId }).lean();
      const profile: Record<string, unknown> =
        (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) ?? {};

      const apps = await Application.find({ studentId: jwtUser.userId })
        .sort({ createdAt: -1 }).limit(5).lean();

      const studentProfile = {
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

      const projects = localData.jobs.map((j) => ({
        id: j.projectId,
        title: j.title,
        city: j.city,
        employmentType: j.employmentType,
        experienceLevel: j.experienceLevel,
        category: j.category,
        budget: j.budgetLabel,
      }));

      const matchScores = localData.jobs.map((j) => ({
        title: j.title,
        score: j.matchScore,
        matched: j.matchedSignals,
        missing: j.missingSignals,
      }));

      const applications = apps.map((a: Record<string, unknown>) => ({
        title: a.title ?? '',
        status: a.status ?? 'SENT',
        category: a.category ?? '',
        city: a.city ?? '',
      }));

      const messages = historyRaw.map((m) => ({ role: m.role, text: cut(m.text, 250) }));

      console.log('AI context (student detail):', {
        projectsCount: projects.length,
        applicationsCount: applications.length,
        profileSkillsCount: studentProfile.skills.length,
        hasAbout: !!studentProfile.about,
      });

      const contextPayload = {
        language,
        role: 'STUDENT',
        currentUser,
        page,
        userInput: message,
        studentProfile,
        clientProfile: {},
        projects,
        selectedProject: {},
        applications,
        messages,
        matchScores,
      };

      const aiAnswer = await callAI(contextPayload);
      const answer = aiAnswer ?? localData.reply;

      return NextResponse.json({
        ok: true,
        answer,
        success: true,
        data: {
          reply: answer,
          answer,
          jobs: localData.jobs,
          quickActions: localData.quickActions,
          profileTips: localData.profileTips,
          profilePatch: localData.profilePatch,
          aiPowered: aiAnswer !== null,
        },
      });
    }

    // ── 5. CLIENT / ADMIN branch ──────────────────────────────────────────────
    if (jwtUser.role === 'CLIENT' || jwtUser.role === 'ADMIN') {
      const localData = runClientAssistant(message);

      const cpRaw = await ClientProfile.findOne({ userId: jwtUser.userId }).lean();
      const cp: Record<string, unknown> = (Array.isArray(cpRaw) ? cpRaw[0] : cpRaw) ?? {};

      const clientProjects = await Project.find({ clientId: jwtUser.userId })
        .sort({ createdAt: -1 }).limit(5).lean();

      const clientProfile = {
        companyName: cp.companyName ?? userName,
        industry: cp.industry ?? '',
        city: cp.city ?? '',
        companySize: cp.companySize ?? '',
        companyDescription: cut(cp.companyDescription, 300),
        contactEmail: userEmail,
      };

      const projects = clientProjects.map((p: Record<string, unknown>) => ({
        title: p.title ?? '',
        category: p.category ?? '',
        status: p.status ?? '',
        budgetMin: p.budgetMin ?? 0,
        budgetMax: p.budgetMax ?? 0,
        requiredSkills: p.requiredSkills ?? [],
      }));

      const messages = historyRaw.map((m) => ({ role: m.role, text: cut(m.text, 250) }));

      console.log('AI context (client detail):', {
        projectsCount: projects.length,
        hasProfile: !!cp.companyName,
      });

      const contextPayload = {
        language,
        role: jwtUser.role,
        currentUser,
        page,
        userInput: message,
        studentProfile: {},
        clientProfile,
        projects,
        selectedProject: {},
        applications: [],
        messages,
        matchScores: [],
      };

      const aiAnswer = await callAI(contextPayload);
      const answer = aiAnswer ?? localData.reply;

      return NextResponse.json({
        ok: true,
        answer,
        success: true,
        data: {
          reply: answer,
          answer,
          tips: localData.tips,
          quickActions: localData.quickActions,
          aiPowered: aiAnswer !== null,
        },
      });
    }

    return NextResponse.json({ ok: false, success: false, error: 'Unsupported role.' }, { status: 403 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const status = (error as { status?: number })?.status ?? 500;
    console.error('AI ASSISTANT ERROR:', msg);
    return NextResponse.json(
      { ok: false, success: false, error: msg || 'Assistant unavailable.' },
      { status: Number(status) },
    );
  }
}
