import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';

export async function GET() {
  try {
    await dbConnect();

    return NextResponse.json({
      ok: true,
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host
    });
  } catch (error: any) {
    console.error('TEST DB ERROR:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Unknown DB error'
      },
      { status: 500 }
    );
  }
}
