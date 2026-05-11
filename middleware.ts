import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const ACCESS_COOKIE_NAME = 'auth_token';

type TokenPayload = { role?: 'STUDENT' | 'CLIENT' | 'ADMIN'; exp?: number };

function decodeJwtPayload(token?: string): TokenPayload | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payloadBase64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const payload = decodeJwtPayload(token);
  const role = payload?.role;

  if (path.startsWith('/admin') && role !== 'ADMIN') return NextResponse.redirect(new URL('/signin', req.url));
  if (path.startsWith('/client') && !['CLIENT', 'ADMIN'].includes(role || '')) return NextResponse.redirect(new URL('/signin', req.url));
  if (path.startsWith('/student') && !['STUDENT', 'ADMIN'].includes(role || '')) return NextResponse.redirect(new URL('/signin', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/student/:path*', '/client/:path*'] };
