'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type CompanyProfile = {
  userId: string;
  companyName?: string;
  companyDescription?: string;
  website?: string;
  industry?: string;
  city?: string;
  companySize?: string;
  contactEmail?: string;
  linkedinUrl?: string;
  typicalProjects?: string[];
  activeProjects?: number;
  completedProjects?: number;
  recentProjects?: any[];
};

export default function CompanyPublicProfile() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/client/public/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => {
        if (!payload?.success) throw new Error(payload?.error || 'Company not found');
        setProfile(payload.data);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load company profile'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="card p-8 text-center">Loading company profile...</div>;
  if (error) return <div className="card p-8 text-center text-red-600">{error}</div>;
  if (!profile) return <div className="card p-8 text-center text-slate-500">Company not found.</div>;

  const initials = (profile.companyName || 'C').slice(0, 2).toUpperCase();
  const isVerifiedCompany = !!profile.companyDescription && !!profile.industry && (profile.activeProjects ?? 0) + (profile.completedProjects ?? 0) > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5 py-2">
      {/* Header */}
      <section className="card overflow-hidden p-0">
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-blue-700" />
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-white text-xl font-bold text-slate-600 shadow">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile.companyName || 'Company'}</h1>
              {profile.industry && <p className="mt-0.5 text-sm text-slate-600">{profile.industry}</p>}
              <p className="mt-1 text-xs text-slate-500">
                {profile.city && <span>📍 {profile.city}</span>}
                {profile.companySize && <span className="ml-2">· {profile.companySize} people</span>}
              </p>
            </div>
          </div>
          {isVerifiedCompany ? (
            <span className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              ✓ Verified company
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              Unverified
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          {/* About */}
          {profile.companyDescription && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{profile.companyDescription}</p>
            </section>
          )}

          {/* Typical projects */}
          {!!profile.typicalProjects?.length && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">What we work on</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.typicalProjects.map((p) => (
                  <span key={p} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{p}</span>
                ))}
              </div>
            </section>
          )}

          {/* Recent projects */}
          {!!profile.recentProjects?.length && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Active & Recent Projects</h2>
              <div className="mt-4 space-y-3">
                {profile.recentProjects.map((p: any) => (
                  <Link
                    key={p._id}
                    href={`/projects/${p._id}`}
                    className="block rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-sm text-slate-900">{p.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${
                        p.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                        'bg-red-100 text-red-600'
                      }`}>{p.status}</span>
                    </div>
                    {p.category && <p className="mt-0.5 text-xs text-slate-500">{p.category}</p>}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Stats */}
          <section className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700">Stats</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{profile.activeProjects ?? 0}</p>
                <p className="mt-0.5 text-xs text-slate-500">Active</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-bold text-slate-900">{profile.completedProjects ?? 0}</p>
                <p className="mt-0.5 text-xs text-slate-500">Completed</p>
              </div>
            </div>
          </section>

          {/* Links */}
          {(profile.website || profile.linkedinUrl || profile.contactEmail) && (
            <section className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700">Contact</h2>
              <div className="mt-3 space-y-2">
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noreferrer" className="block truncate text-sm text-blue-700 hover:underline">
                    🌐 {profile.website}
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="block truncate text-sm text-blue-700 hover:underline">
                    💼 LinkedIn
                  </a>
                )}
                {profile.contactEmail && (
                  <a href={`mailto:${profile.contactEmail}`} className="block truncate text-sm text-blue-700 hover:underline">
                    ✉️ {profile.contactEmail}
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="card p-5">
            <Link href="/projects" className="btn-primary w-full text-center block">
              View open projects
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
