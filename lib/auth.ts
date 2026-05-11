import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ApiError } from '@/lib/api';

const secret = process.env.JWT_SECRET || 'dev_secret';
const issuer = 'uniwork-platform';
export const ACCESS_COOKIE_NAME = 'auth_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';

export type AuthPayload = { userId: string; role: 'STUDENT' | 'CLIENT' | 'ADMIN'; tokenType?: 'access' | 'refresh' };

export function signAccessToken(payload: Omit<AuthPayload, 'tokenType'>) {
  return jwt.sign({ ...payload, tokenType: 'access' }, secret, { expiresIn: '1d', issuer, audience: 'web' });
}

export function signRefreshToken(payload: Omit<AuthPayload, 'tokenType'>) {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, secret, { expiresIn: '7d', issuer, audience: 'web' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, secret, { issuer, audience: 'web' }) as AuthPayload;
  } catch {
    return null;
  }
}

export function getUserFromCookie() {
  const token = cookies().get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.tokenType !== 'access') return null;
  return payload;
}

export function requireAuth(roles?: AuthPayload['role'][]) {
  const user = getUserFromCookie();
  if (!user) throw new ApiError('Unauthorized', 401);
  if (roles && !roles.includes(user.role)) throw new ApiError('Forbidden', 403);
  return user;
}
