/**
 * Secure AI assistant endpoint.
 * OPENAI_API_KEY is read server-side only — never sent to the browser.
 * Falls back to local deterministic logic when the key is absent or the call fails.
 */
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { runCareerAssistant } from '@/lib/assistant-chat';
import { runClientAssistant } from '@/lib/client-assistant';
import StudentProfile from '@/models/StudentProfile';

export const dynamic = 'force-dynamic';

// ─── OpenAI helper ───────────────────────────────────────────────────────────

async function callOpenAI(systemPrompt: string, userMessage: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'PASTE_KEY_HERE') return null;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return (data?.choices?.[0]?.message?.content as string | undefined)?.trim() ?? null;
  } catch {
    return null;
  }
}

// ─── System prompts ──────────────────────────────────────────────────────────

function buildStudentSystemPrompt(profile: Record<string, unknown>, langNote: string): string {
  const skills = Array.isArray(profile.skills)
    ? (profile.skills as string[]).slice(0, 10).join(', ')
    : 'not listed yet';
  const level = String(profile.experienceLevel || 'JUNIOR');
  const city = String(profile.city || 'not specified');
  const university = String(profile.university || 'AITU');
  const about = profile.about ? String(profile.about).slice(0, 150) : '';

  return `${langNote}You are an AI career assistant on UniWork — a student freelance marketplace at AITU (Astana IT University), Kazakhstan. Help students find projects, write cover letters, improve profiles, and grow their careers.

Student profile:
- University: ${university}
- Experience level: ${level}
- City: ${city}
- Skills: ${skills}${about ? `\n- Background: ${about}` : ''}

Guidelines:
- Be encouraging, specific, and practical.
- For general questions: 3–5 sentences max.
- For cover letters: write 3–4 professional sentences; start with "I am"; output ONLY the letter text, no header or signature.
- For skill advice: name concrete technologies relevant to their profile.
- Always reply in the same language the user writes in (Russian or English).`;
}

function buildClientSystemPrompt(langNote: string): string {
  return `${langNote}You are an AI project assistant on UniWork — a student freelance marketplace at AITU (Astana IT University), Kazakhstan. Help clients post better projects, understand ML candidate matching, set fair budgets, and evaluate applicants.

Guidelines:
- Be helpful, business-focused, and practical.
- Keep responses to 3–5 sentences unless the user asks for more.
- Reference Kazakhstan student freelance market rates when relevant ($100–1 500 per project).
- Explain that the platform uses ML matching to rank student candidates by skill overlap, experience level, and profile completeness.
- Always reply in the same language the user writes in (Russian or English).`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const user = requireAuth(['STUDENT', 'CLIENT', 'ADMIN']);
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message ?? '').trim();
    const language = String(body?.language ?? 'en') as 'en' | 'ru';

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required.' },
        { status: 400 },
      );
    }

    await dbConnect();

    const langNote =
      language === 'ru'
        ? 'IMPORTANT: Respond in Russian. '
        : 'IMPORTANT: Respond in English. ';

    // ── STUDENT / ADMIN acting as student ────────────────────────────────────
    if (user.role === 'STUDENT' || (user.role === 'ADMIN' && body?.actAs === 'STUDENT')) {
      const localData = await runCareerAssistant(message, user.userId);

      const profileRaw = await StudentProfile.findOne({ userId: user.userId }).lean();
      const profile: Record<string, unknown> =
        (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) ?? {};

      const systemPrompt = buildStudentSystemPrompt(profile, langNote);
      const aiReply = await callOpenAI(systemPrompt, message);

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

    // ── CLIENT ────────────────────────────────────────────────────────────────
    if (user.role === 'CLIENT' || user.role === 'ADMIN') {
      const localData = runClientAssistant(message);
      const systemPrompt = buildClientSystemPrompt(langNote);
      const aiReply = await callOpenAI(systemPrompt, message);

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
    console.error('AI ASSISTANT ERROR:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Assistant unavailable.' },
      { status: Number(error?.status ?? 500) },
    );
  }
}
