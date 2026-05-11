import { handleApi, ok, ApiError } from '@/lib/api';
import { getUserFromCookie } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleApi(async () => {
    await dbConnect();
    const user = getUserFromCookie();
    if (!user) {
      console.error('AUTH /me: missing or invalid auth cookie');
      throw new ApiError('Unauthorized', 401);
    }
    const existingUser = await User.findById(user.userId).lean();
    if (!existingUser) {
      console.error('AUTH /me: user not found for token payload', { userId: user.userId });
      throw new ApiError('Unauthorized', 401);
    }
    return ok(user);
  });
}
