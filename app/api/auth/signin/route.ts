import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import User from '@/models/User';
import { dbConnect } from '@/lib/mongodb';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, signAccessToken, signRefreshToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email(), password: z.string().min(6).max(128) });

export async function POST(req: Request) {
  try {
    const { email, password } = schema.parse(await req.json());
    await dbConnect();

    const user: any = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signAccessToken({ userId: user._id.toString(), role: user.role });
    const refreshToken = signRefreshToken({ userId: user._id.toString(), role: user.role });

    const response = NextResponse.json({ success: true, data: { role: user.role, fullName: user.fullName } });
    response.cookies.set(ACCESS_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    return response;
  } catch (error) {
    console.error('SIGNIN ERROR:', error);
    return NextResponse.json({ success: false, error: 'Could not sign in. Please try again later' }, { status: 500 });
  }
}
