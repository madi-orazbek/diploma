import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import ClientProfile from '@/models/ClientProfile';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';

export const dynamic = 'force-dynamic';

const schema = z.object({
  firstName: z.string({ required_error: 'Enter your first name' }).trim()
    .min(1, 'Enter your first name')
    .min(2, 'First name must be at least 2 characters long')
    .max(60),
  lastName: z.string({ required_error: 'Enter your last name' }).trim()
    .min(1, 'Enter your last name')
    .min(2, 'Last name must be at least 2 characters long')
    .max(60),
  email: z.string({ required_error: 'Enter your email' }).trim()
    .min(1, 'Enter your email')
    .email('Enter a valid email address'),
  password: z.string({ required_error: 'Enter a password' })
    .min(1, 'Enter a password')
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number')
    .max(128),
  role: z.enum(['STUDENT', 'CLIENT'], {
    required_error: 'Select a role',
    invalid_type_error: 'Select a role'
  }),
  university: z.string().trim().optional().default(''),
  captchaToken: z.string({ required_error: 'Please complete the CAPTCHA' })
    .min(1, 'Please complete the CAPTCHA')
});

async function verifyCaptcha(token: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return token === 'dev-captcha-pass';
  }

  const body = new URLSearchParams();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) return false;
  const payload = await response.json();
  return !!payload?.success;
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message || 'Invalid request data', field: issue?.path?.[0] || undefined },
        { status: 400 }
      );
    }
    const body = parsed.data;
    const fullName = `${body.firstName} ${body.lastName}`.trim();

    if (body.role === 'STUDENT' && !body.university) {
      return NextResponse.json(
        { success: false, error: 'Select your university', field: 'university' },
        { status: 400 }
      );
    }

    const isCaptchaValid = await verifyCaptcha(body.captchaToken, req.headers.get('x-forwarded-for'));
    if (!isCaptchaValid) {
      return NextResponse.json(
        { success: false, error: 'Please complete the CAPTCHA', field: 'captchaToken' },
        { status: 400 }
      );
    }

    const existingUser: any = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists', field: 'email' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({
      fullName,
      email: body.email,
      role: body.role,
      passwordHash,
      university: body.university,
      emailVerified: true
    });

    if (body.role === 'STUDENT') {
      await StudentProfile.create({
        userId: user._id,
        skills: [],
        interests: [],
        certificates: [],
        portfolioLinks: [],
        availabilityStatus: 'AVAILABLE',
        experienceLevel: 'JUNIOR'
      });
    } else {
      await ClientProfile.create({
        userId: user._id,
        companyName: `${fullName} Studio`,
        companyDescription: '',
        website: '',
        industry: ''
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. You can now sign in.',
        data: {
          userId: user._id.toString()
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('SIGNUP ERROR:', error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists', field: 'email' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Could not create the account. Please try again later' },
      { status: 500 }
    );
  }
}
