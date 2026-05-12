'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Role = 'STUDENT' | 'CLIENT' | 'ADMIN';
type AuthMe = { userId: string; role: Role };

export function Navbar() {
  const [authUser, setAuthUser] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    const loadAuthUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        if (!mounted) return;
        if (!res.ok) {
          setAuthUser(null);
          return;
        }
        const payload = await res.json();
        setAuthUser(payload?.data || null);
      } catch {
        if (mounted) setAuthUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAuthUser();
    const onFocus = () => loadAuthUser();
    window.addEventListener('focus', onFocus);

    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
    };
  }, [pathname]);

  async function logout() {
    setLogoutBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthUser(null);
      router.push('/');
      router.refresh();
      setMobileOpen(false);
    } finally {
      setLogoutBusy(false);
    }
  }

  const roleLinks = useMemo(() => {
    if (!authUser) return [];
    if (authUser.role === 'STUDENT') return [
      ['Dashboard', '/student/dashboard'],
      ['Applications', '/student/applications'],
      ['Messages', '/student/messages'],
    ] as const;
    if (authUser.role === 'CLIENT') return [
      ['Dashboard', '/client/dashboard'],
      ['My Projects', '/client/projects'],
      ['Applicants', '/client/applicants'],
      ['Messages', '/client/messages'],
      ['Find Students', '/client/students'],
      ['Profile', '/client/profile'],
    ] as const;
    return [
      ['Admin', '/admin/dashboard'],
      ['Analytics', '/admin/analytics'],
      ['Users', '/admin/users'],
      ['Moderation', '/admin/projects']
    ] as const;
  }, [authUser]);

  const baseLinks = [
    ['Home', '/'],
    ['Projects', '/projects'],
  ] as const;

  const aboutLink = ['About', '/about'] as const;

  const profileHref = authUser?.role === 'STUDENT'
    ? '/student/profile'
    : authUser?.role === 'CLIENT'
      ? '/client/profile'
      : '/admin/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4 lg:h-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-sm">U</span>
            <div>
              <p className="text-xs text-slate-500 leading-tight">Marketplace</p>
              <p className="font-semibold text-slate-900 leading-tight">UniWork</p>
            </div>
          </Link>
          <span className="hidden xl:inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Verified students
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {baseLinks.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {label}
            </Link>
          ))}
          {roleLinks.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {label}
            </Link>
          ))}
          <Link href={aboutLink[1]} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
            {aboutLink[0]}
          </Link>
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {!loading && !authUser && (
            <>
              <Link href="/signin" className="btn-secondary">Sign in</Link>
              <Link href="/signin?tab=signup" className="btn-primary">Create account</Link>
            </>
          )}
          {!loading && authUser && (
            <>
              <Link href="/favorites" className="btn-secondary" title="Saved vacancies">
                ♥
              </Link>
              <Link href={profileHref} className="btn-secondary">
                Profile
              </Link>
              <button type="button" onClick={logout} disabled={logoutBusy} className="btn-primary disabled:opacity-50">
                {logoutBusy ? 'Signing out...' : 'Sign out'}
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((x) => !x)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 lg:hidden"
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-app grid gap-2 py-4">
            {[...baseLinks, ...roleLinks, aboutLink].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                {label}
              </Link>
            ))}
            {!loading && authUser && (
              <>
                <Link href="/favorites" onClick={() => setMobileOpen(false)} className="btn-secondary">♥ Favorites</Link>
                <Link href={profileHref} onClick={() => setMobileOpen(false)} className="btn-secondary">Profile</Link>
              </>
            )}
            {!loading && !authUser && (
              <>
                <Link href="/signin" onClick={() => setMobileOpen(false)} className="btn-secondary">Sign in</Link>
                <Link href="/signin?tab=signup" onClick={() => setMobileOpen(false)} className="btn-primary">Create account</Link>
              </>
            )}
            {!loading && authUser && (
              <button type="button" onClick={logout} disabled={logoutBusy} className="btn-primary disabled:opacity-50">
                {logoutBusy ? 'Signing out...' : 'Sign out'}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
