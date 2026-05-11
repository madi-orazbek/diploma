import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { runClientAssistant } from '@/lib/client-assistant';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    requireAuth(['CLIENT', 'ADMIN']);
    const body = await req.json().catch(() => ({}));
    const message = String(body?.message || body?.prompt || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }
    const data = runClientAssistant(message);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Assistant unavailable.' },
      { status: Number(error?.status || 500) }
    );
  }
}
