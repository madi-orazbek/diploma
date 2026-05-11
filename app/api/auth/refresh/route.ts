import { cookies } from 'next/headers';
import { handleApi, ok, ApiError } from '@/lib/api';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, signAccessToken, verifyToken } from '@/lib/auth';

export async function POST() {
  return handleApi(async () => {
    const refresh = cookies().get(REFRESH_COOKIE_NAME)?.value;
    if (!refresh) throw new ApiError('Refresh token is missing', 401);
    const payload = verifyToken(refresh);
    if (!payload || payload.tokenType !== 'refresh') throw new ApiError('Invalid refresh token', 401);

    const token = signAccessToken({ userId: payload.userId, role: payload.role });
    const response = ok({ refreshed: true });
    response.cookies.set(ACCESS_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    return response;
  });
}
