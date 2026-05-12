'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KAZAKHSTAN_UNIVERSITIES } from '@/lib/kazakhstanUniversities';

type Tab = 'signin' | 'signup';
type FieldErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'password' | 'role' | 'university' | 'captchaToken', string>>;

type AuthPageClientProps = {
  initialTab: Tab;
};

export default function AuthPageClient({ initialTab }: AuthPageClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [captchaToken, setCaptchaToken] = useState('');
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'CLIENT' | ''>('');
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) => {
      setCaptchaToken(token);
      setFieldErrors((prev) => ({ ...prev, captchaToken: undefined }));
    };
    (window as any).onTurnstileExpired = () => setCaptchaToken('');

    return () => {
      delete (window as any).onTurnstileSuccess;
      delete (window as any).onTurnstileExpired;
    };
  }, []);

  const title = useMemo(() => (tab === 'signin' ? 'Sign in to UniWork' : 'Create your UniWork account'), [tab]);

  async function handleSignIn(formData: FormData) {
    setError('');
    setSuccess('');
    setFieldErrors({});

    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok || !payload?.success) {
      const message = typeof payload?.error === 'string' ? payload.error : payload?.error?.message;
      setError(message || 'Invalid credentials');
      return;
    }

    const role = payload.data.role;
    router.push(role === 'ADMIN' ? '/admin/dashboard' : role === 'CLIENT' ? '/client/dashboard' : '/student/dashboard');
    router.refresh();
  }

  async function handleSignUp(formData: FormData) {
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!captchaToken) {
      setFieldErrors({ captchaToken: 'Please complete the CAPTCHA' });
      return;
    }

    const values = Object.fromEntries(formData.entries());
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, captchaToken })
    });

    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok || !payload?.success) {
      const backendMessage = typeof payload?.error === 'string' ? payload.error : '';
      const backendField = typeof payload?.field === 'string' ? payload.field : '';
      if (backendField && backendMessage) {
        setFieldErrors({ [backendField]: backendMessage } as FieldErrors);
      } else {
        setError(backendMessage || 'Could not create the account. Please try again later');
      }
      return;
    }

    setSuccess(payload?.message || 'Account created successfully. You can now sign in.');
    setCaptchaToken('');
    setTab('signin');
    router.replace('/signin');
  }

  return (
    <main className="mx-auto max-w-5xl py-8 md:py-14">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="card p-8 md:p-10">
          <p className="text-sm font-medium text-slate-500">Authentication</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Access verified student talent, secure project workflows, and role-based collaboration tools in one platform.
          </p>

          <div className="mt-6 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab('signin')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
            >
              Sign up
            </button>
          </div>

          {tab === 'signin' ? (
            <form action={handleSignIn} className="mt-6 space-y-3">
              <input name="email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Email" />
              <input name="password" type="password" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Password" />
              <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                Sign in
              </button>
            </form>
          ) : (
            <form action={handleSignUp} className="mt-6 space-y-3">
              <select
                name="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'STUDENT' | 'CLIENT' | '')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="" disabled>Select role</option>
                <option value="STUDENT">Student — looking for freelance projects</option>
                <option value="CLIENT">Client — posting projects for students</option>
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input name="firstName" placeholder="First name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
                <input name="lastName" placeholder="Last name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              </div>
              {selectedRole !== 'CLIENT' && (
                <select name="university" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" defaultValue="">
                  <option value="" disabled>Select your university</option>
                  {KAZAKHSTAN_UNIVERSITIES.map((university) => (
                    <option key={university} value={university}>{university}</option>
                  ))}
                </select>
              )}
              <input name="email" placeholder="Email" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />
              <input name="password" type="password" placeholder="Password (min 8, letters and numbers)" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm" />

              {turnstileSiteKey ? (
                <>
                  <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
                  <div
                    className="cf-turnstile"
                    data-sitekey={turnstileSiteKey}
                    data-callback="onTurnstileSuccess"
                    data-expired-callback="onTurnstileExpired"
                  />
                </>
              ) : (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    onChange={(e) => setCaptchaToken(e.target.checked ? 'dev-captcha-pass' : '')}
                  />
                  I am not a robot (development CAPTCHA)
                </label>
              )}

              <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                Create account
              </button>
            </form>
          )}

          {Object.values(fieldErrors).filter(Boolean).length > 0 && (
            <div className="mt-4 space-y-1">
              {Object.entries(fieldErrors).map(([key, value]) => (
                value ? <p key={key} className="text-sm text-red-600">{value}</p> : null
              ))}
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-700">{success}</p>}
        </div>

        <aside className="card p-8 md:p-10">
          <p className="text-sm font-semibold text-slate-500">Why teams choose UniWork</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">A product-ready marketplace for student freelance execution</h2>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-4">Verified student identities connected to university context.</li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-4">Built-in project chat and collaboration with role-aware access.</li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 p-4">Transparent milestones and secure payout checkpoints.</li>
          </ul>
          <p className="mt-6 text-sm text-slate-500">
            Looking for opportunities first? Browse open work in the <Link href="/projects" className="font-medium text-slate-900 underline">Projects</Link> section.
          </p>
        </aside>
      </section>
    </main>
  );
}
