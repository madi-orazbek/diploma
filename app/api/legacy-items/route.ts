import { NextResponse } from 'next/server';
import { loadUnifiedDataset } from '@/lib/recommendation/unified-dataset';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await loadUnifiedDataset();

    return NextResponse.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to load normalized legacy items.',
      },
      { status: 500 }
    );
  }
}
