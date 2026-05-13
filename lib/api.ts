import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { message, details } }, { status });
}

/** Turn Zod issues into a human-readable string like "title: too short · skills: required" */
function zodMessage(err: ZodError): string {
  return err.issues
    .map((issue) => {
      const field = issue.path.join('.') || 'value';
      return `${field}: ${issue.message}`;
    })
    .join(' · ');
}

export async function handleApi(fn: () => Promise<NextResponse>) {
  try {
    return await fn();
  } catch (error: any) {
    console.error('API ROUTE ERROR:', error);
    if (error instanceof ApiError) return fail(error.message, error.status);
    if (error instanceof ZodError) return fail(zodMessage(error), 422);
    return fail('Internal server error', 500, process.env.NODE_ENV === 'development' ? error?.message : undefined);
  }
}
