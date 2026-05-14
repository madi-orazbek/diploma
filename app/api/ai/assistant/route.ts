/**
 * Secure AI assistant endpoint — uses OpenAI stored Prompt Template.
 * OPENAI_API_KEY is read server-side only; never sent to the browser.
 * Falls back gracefully to deterministic local logic when key is absent.
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

export const dynamic = 'force-dynamic';

// ─── Stored Prompt ID (published in OpenAI dashboard) ────────────────────────
const PROMPT_ID = 'pmpt_6a0645eda05081979faeee6759b7ccf908f5b70899dfc5ea';
const PROMPT_VERSION = '1';

// ─── OpenAI Responses API helper ─────────────────────────────────────────────
async function callStoredPrompt(
  variables: Record<string, string>,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('PASTE')) return null;

  try {
    const openai = new OpenAI({ apiKey, timeout: 20_000 });

    // responses.create uses the stored prompt template with dynamic variables
    const response = await openai.responses.create({
      prompt: {
        id: PROMPT_ID,
        version: PROMPT_VERSION,
        variables,
      } as any, // openai SDK types vary by version
    } as any);

    // output_text is the convenience accessor for the generated text
    const text =
      (response as any)?.output_text ??
      (response as any)?.output?.[0]?.content?.[0]?.text ??
      null;

    return typeof text === 'string' && text.trim() ? text.trim() : null;
  } catch (err: any) {
    console.error('OpenAI stored-prompt error:', err?.message ?? err);
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value ?? '');
  } catch {
    return '""';
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const user = requireAuth(['STUDENT', 'CLIENT', 'ADMIN']);
    const body = await req.json().catch(() => ({}));

    const message = String(body?.message ?? '').trim();
    const language = String(body?.language ?? 'en');           // 'en' | 'ru'
    const page = String(body?.page ?? '/');                    // current URL path
    const historyRaw: Array<{ role: string; text: string }> =
      Array.isArray(body?.history) ? body.history.slice(-8) : [];

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required.' },
        { status: 400 },
      );
    }

    await dbConnect();

    // ── STUDENT ──────────────────────────────────────────────────────────────
    if (user.role === 'STUDENT') {
      // 1. Local fallback data (recommendations, tips, etc.)
      const localData = await runCareerAssistant(message, user.userId);

      // 2. Student profile from DB
      const profileRaw = await StudentProfile.findOne({ userId: user.userId }).lean();
      const profile: Record<string, unknown> =
        (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) ?? {};

      // 3. Recent applications
      const apps = await Application.find({ studentId: user.userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // 4. Build variables for the stored prompt template
      const variables: Record<string, string> = {
        language,
        role: 'STUDENT',
        page,
        user_input: message,

        student_profile: safeJson({
          fullName: profile.fullName ?? '',
          university: profile.university ?? 'AITU',
          experienceLevel: profile.experienceLevel ?? 'JUNIOR',
          city: profile.city ?? '',
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          about: truncate(String(profile.about ?? ''), 300),
          githubUrl: profile.githubUrl ?? '',
          linkedinUrl: profile.linkedinUrl ?? '',
          availabilityStatus: profile.availabilityStatus ?? '',
          workplaceType: profile.workplaceType ?? '',
        }),

        client_profile: '{}',

        projects: safeJson(
          localData.jobs.map((j) => ({
            id: j.projectId,
            title: j.title,
            city: j.city,
            employmentType: j.employmentType,
            experienceLevel: j.experienceLevel,
            category: j.category,
            budget: j.budgetLabel,
          })),
        ),

        selected_project: '{}',

        applications: safeJson(
          apps.map((a: any) => ({
            title: a.title ?? '',
            status: a.status ?? 'SENT',
            category: a.category ?? '',
            city: a.city ?? '',
          })),
        ),

        messages: safeJson(
          historyRaw.map((m) => ({ role: m.role, text: truncate(m.text, 200) })),
        ),

        match_scores: safeJson(
          localData.jobs.map((j) => ({
            title: j.title,
            score: j.matchScore,
            matched: j.matchedSignals,
            missing: j.missingSignals,
          })),
        ),
      };

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

    // ── CLIENT / ADMIN ────────────────────────────────────────────────────────
    if (user.role === 'CLIENT' || user.role === 'ADMIN') {
      const localData = runClientAssistant(message);

      const cpRaw = await ClientProfile.findOne({ userId: user.userId }).lean();
      const cp: Record<string, unknown> =
        (Array.isArray(cpRaw) ? cpRaw[0] : cpRaw) ?? {};

      const clientProjects = await Project.find({ clientId: user.userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      const variables: Record<string, string> = {
        language,
        role: 'CLIENT',
        page,
        user_input: message,

        student_profile: '{}',

        client_profile: safeJson({
          companyName: cp.companyName ?? '',
          industry: cp.industry ?? '',
          city: cp.city ?? '',
          companySize: cp.companySize ?? '',
          companyDescription: truncate(String(cp.companyDescription ?? ''), 200),
        }),

        projects: safeJson(
          clientProjects.map((p: any) => ({
            title: p.title ?? '',
            category: p.category ?? '',
            status: p.status ?? '',
            budgetMin: p.budgetMin ?? 0,
            budgetMax: p.budgetMax ?? 0,
            requiredSkills: p.requiredSkills ?? [],
          })),
        ),

        selected_project: '{}',

        applications: '[]',

        messages: safeJson(
          historyRaw.map((m) => ({ role: m.role, text: truncate(m.text, 200) })),
        ),

        match_scores: '[]',
      };

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

    return NextResponse.json(
      { success: false, error: 'Unsupported role.' },
      { status: 403 },
    );
  } catch (error: any) {
    console.error('AI ASSISTANT ERROR:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Assistant unavailable.' },
      { status: Number(error?.status ?? 500) },
    );
  }
}
