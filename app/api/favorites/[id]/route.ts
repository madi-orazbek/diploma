import Favorite from '@/models/Favorite';
import { dbConnect } from '@/lib/mongodb';
import { handleApi, ok } from '@/lib/api';
import { requireAuth } from '@/lib/auth';

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return handleApi(async () => {
    const user = requireAuth();
    await dbConnect();
    await Favorite.deleteOne({ userId: user.userId, itemId: params.id });
    return ok({ removed: true, itemId: params.id });
  });
}
