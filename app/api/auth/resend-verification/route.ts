import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address')
});

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function createVerificationToken() {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
}

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message || 'Invalid request data', field: issue?.path?.[0] || undefined },
        { status: 400 }
      );
    }

    await dbConnect();
    const user: any = await User.findOne({ email: parsed.data.email });
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true, data: { message: 'If the account exists, a verification email has been sent.' } });
    }

    const { rawToken, tokenHash, expiresAt } = createVerificationToken();
    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpiresAt = expiresAt;
    await user.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
    const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;
    await sendVerificationEmail(parsed.data.email, verifyUrl);

    return NextResponse.json({ success: true, data: { message: 'Verification email sent.' } });
  } catch (error) {
    console.error('RESEND VERIFICATION ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'Could not resend verification email. Please try again later' },
      { status: 500 }
    );
  }
}
