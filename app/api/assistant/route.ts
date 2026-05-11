import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { runCareerAssistant } from '@/lib/assistant-chat';

export async function POST(req: Request) {
  try {
    const user = requireAuth(['STUDENT', 'ADMIN']);
    const { prompt } = await req.json();
    await dbConnect();
    const data = await runCareerAssistant(String(prompt || ''), user.userId);
    return NextResponse.json({ reply: data.reply, data });
  } catch (error: any) {
    return NextResponse.json({ reply: 'Assistant is temporarily unavailable.', error: error?.message || 'error' }, { status: Number(error?.status || 500) });
  }
}
