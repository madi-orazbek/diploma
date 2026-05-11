import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { runCareerAssistant } from '@/lib/assistant-chat';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message || body?.prompt || '').trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    await dbConnect();
    const data = await runCareerAssistant(message, user.userId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Assistant is temporarily unavailable.' },
      { status: Number(error?.status || 500) }
    );
  }
}
