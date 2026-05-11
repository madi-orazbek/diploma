import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: tokenHash
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiresAt = undefined;

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('VERIFY EMAIL ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'Could not verify email' },
      { status: 500 }
    );
  }
}
