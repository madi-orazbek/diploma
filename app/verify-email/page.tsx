export const dynamic = 'force-dynamic';

type Props = {
  searchParams: {
    token?: string;
  };
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const token = searchParams.token ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';

  let success = false;
  let message = 'Invalid or expired verification link';

  if (token) {
    try {
      const res = await fetch(
        `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        { cache: 'no-store' }
      );

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        success = true;
        message = 'Email verified successfully. You can now sign in.';
      } else {
        message = data?.error || message;
      }
    } catch {
      message = 'Invalid or expired verification link';
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Verify email</h1>
        <p className={`mt-4 ${success ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>

        {success && (
          <a
            href="/signin"
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-white"
          >
            Go to sign in
          </a>
        )}
      </div>
    </main>
  );
}
