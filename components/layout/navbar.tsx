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
        if (!res.ok) { setAuthUser(null); return; }
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
    return () => { mounted = false; window.removeEventListener('focus', onFocus); };
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

  const navLinks = useMemo(() => {
    if (!authUser) {
      // Guest nav
      return [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: 'About', href: '/about' },
      ];
    }
    if (authUser.role === 'STUDENT') return [
      { label: 'Dashboard', href: '/student/dashboard' },
      { label: 'Projects', href: '/projects' },
      { label: 'My Applications', href: '/student/applications' },
      { label: 'Messages', href: '/student/messages' },
    ];
    if (authUser.role === 'CLIENT') return [
      { label: 'Dashboard', href: '/client/dashboard' },
      { label: 'My Projects', href: '/client/projects' },
      { label: 'Applicants', href: '/client/applicants' },
      { label: 'Find Students', href: '/client/students' },
      { label: 'Messages', href: '/client/messages' },
    ];
    // ADMIN
    return [
      { label: 'Admin', href: '/admin/dashboard' },
      { label: 'Analytics', href: '/admin/analytics' },
      { label: 'Users', href: '/admin/users' },
      { label: 'Moderation', href: '/admin/projects' },
    ];
  }, [authUser]);

  const profileHref = authUser?.role === 'STUDENT'
    ? '/student/profile'
    : authUser?.role === 'CLIENT'
      ? '/client/profile'
      : '/admin/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4 lg:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-sm text-lg">U</span>
          <div className="hidden sm:block">
            <p className="text-xs text-slate-500 leading-tight">Marketplace</p>
            <p className="font-semibold text-slate-900 leading-tight">UniWork</p>
          </div>
          {!authUser && (
            <span className="hidden xl:inline-flex ml-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Verified students
            </span>
          )}
          {authUser && (
            <span className={`hidden xl:inline-flex ml-1 rounded-full px-3 py-1 text-xs font-semibold ${
              authUser.role === 'CLIENT' ? 'border border-blue-200 bg-blue-50 text-blue-700' :
              authUser.role === 'ADMIN' ? 'border border-purple-200 bg-purple-50 text-purple-700' :
              'border border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              {authUser.role === 'CLIENT' ? 'Client' : authUser.role === 'ADMIN' ? 'Admin' : 'Student'}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === href || pathname?.startsWith(href + '/')
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop right side */}
        <div className="hidden lg:flex items-center gap-2">
          {!loading && !authUser && (
            <>
              <Link href="/signin" className="btn-secondary">Sign in</Link>
              <Link href="/signin?tab=signup" className="btn-primary">Create account</Link>
            </>
          )}
          {!loading && authUser && (
            <>
              {authUser.role === 'STUDENT' && (
                <Link href="/favorites" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50" title="Saved projects">
                  ♥ Saved
                </Link>
              )}
              <Link href={profileHref} className="btn-secondary">
                {authUser.role === 'CLIENT' ? 'Company Profile' : 'Profile'}
              </Link>
              <button type="button" onClick={logout} disabled={logoutBusy} className="btn-primary disabled:opacity-50">
                {logoutBusy ? 'Signing out...' : 'Sign out'}
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((x) => !x)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-app grid gap-2 py-4">
            {navLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                  pathname === href ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700'
                }`}
              >
                {label}
              </Link>
            ))}
            {!loading && authUser && (
              <>
                {authUser.role === 'STUDENT' && (
                  <Link href="/favorites" onClick={() => setMobileOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">♥ Saved projects</Link>
                )}
                <Link href={profileHref} onClick={() => setMobileOpen(false)} className="btn-secondary text-center">
                  {authUser.role === 'CLIENT' ? 'Company Profile' : 'My Profile'}
                </Link>
                <button type="button" onClick={logout} disabled={logoutBusy} className="btn-primary disabled:opacity-50">
                  {logoutBusy ? 'Signing out...' : 'Sign out'}
                </button>
              </>
            )}
            {!loading && !authUser && (
              <>
                <Link href="/signin" onClick={() => setMobileOpen(false)} className="btn-secondary text-center">Sign in</Link>
                <Link href="/signin?tab=signup" onClick={() => setMobileOpen(false)} className="btn-primary text-center">Create account</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
