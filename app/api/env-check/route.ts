import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    nodeEnv: process.env.NODE_ENV || null
  });
}
