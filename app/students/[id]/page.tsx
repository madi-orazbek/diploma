'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type StudentProfile = {
  userId: string;
  fullName?: string;
  headline?: string;
  university?: string;
  city?: string;
  about?: string;
  skills?: string[];
  interests?: string[];
  experienceLevel?: string;
  availabilityStatus?: string;
  workplaceType?: string;
  preferredRoles?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioLinks?: string[];
  languages?: string;
  experienceEntries?: any[];
  certificateDocuments?: any[];
  avatarDataUrl?: string;
};

const LEVEL_COLOR: Record<string, string> = {
  SENIOR: 'bg-purple-100 text-purple-700',
  MIDDLE: 'bg-blue-100 text-blue-700',
  JUNIOR: 'bg-emerald-100 text-emerald-700',
};

const AVAIL_COLOR: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  BUSY: 'bg-red-100 text-red-700',
  OPEN_TO_OFFERS: 'bg-amber-100 text-amber-700',
};

export default function StudentPublicProfile() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/student/public/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => {
        if (!payload?.success) throw new Error(payload?.error || 'Profile not found');
        setProfile(payload.data);
      })
      .catch((e: any) => setError(e?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="card p-8 text-center">Loading profile...</div>;
  if (error) return <div className="card p-8 text-center text-red-600">{error}</div>;
  if (!profile) return <div className="card p-8 text-center text-slate-500">Profile not found.</div>;

  const initials = (profile.fullName || 'U').split(' ').map((x) => x[0]).slice(0, 2).join('');

  return (
    <div className="mx-auto max-w-4xl space-y-5 py-2">
      {/* Header card */}
      <section className="card overflow-hidden p-0">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4 px-6 pb-6">
          <div className="flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow">
              {profile.avatarDataUrl
                ? <img src={profile.avatarDataUrl} alt="avatar" className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-600">{initials}</div>}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile.fullName || 'Student'}</h1>
              {profile.headline && <p className="mt-0.5 text-sm text-slate-600">{profile.headline}</p>}
              <p className="mt-1 text-xs text-slate-500">
                {profile.university && <span>{profile.university}</span>}
                {profile.city && <span> · 📍 {profile.city}</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.experienceLevel && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${LEVEL_COLOR[profile.experienceLevel] || 'bg-slate-100 text-slate-600'}`}>
                {profile.experienceLevel}
              </span>
            )}
            {profile.availabilityStatus && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${AVAIL_COLOR[profile.availabilityStatus] || 'bg-slate-100 text-slate-600'}`}>
                {profile.availabilityStatus.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* About */}
          {profile.about && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{profile.about}</p>
            </section>
          )}

          {/* Skills */}
          {!!profile.skills?.length && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span key={s} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{s}</span>
                ))}
              </div>
            </section>
          )}

          {/* Interests */}
          {!!profile.interests?.length && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Interests</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.interests.map((x) => (
                  <span key={x} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{x}</span>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {!!profile.experienceEntries?.length && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Experience</h2>
              <div className="mt-4 space-y-4">
                {profile.experienceEntries.map((x: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 h-9 w-9 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                      {(x.company || 'C')[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{x.jobTitle}</p>
                      <p className="text-xs text-slate-500">{x.company} · {x.employmentType}</p>
                      <p className="text-xs text-slate-400">
                        {x.startMonth} {x.startYear} – {x.currentlyWorking ? 'Present' : `${x.endMonth || ''} ${x.endYear || ''}`}
                      </p>
                      {x.description && <p className="mt-1 text-xs text-slate-600">{x.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certificates */}
          {!!profile.certificateDocuments?.length && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Certificates</h2>
              <div className="mt-3 space-y-3">
                {profile.certificateDocuments.map((c: any, i: number) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-semibold text-sm text-slate-900">{c.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{c.issuer}</p>
                    {!!c.skillsCovered?.length && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.skillsCovered.map((s: string) => (
                          <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Preferences */}
          <section className="card p-5">
            <h2 className="text-sm font-semibold text-slate-700">Preferences</h2>
            <div className="mt-3 space-y-2 text-sm">
              {profile.workplaceType && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Format</span>
                  <span className="font-medium text-slate-900">{profile.workplaceType}</span>
                </div>
              )}
              {profile.preferredRoles && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium text-slate-900 text-right max-w-[160px]">{profile.preferredRoles}</span>
                </div>
              )}
              {profile.languages && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Languages</span>
                  <span className="font-medium text-slate-900 text-right max-w-[160px]">{profile.languages}</span>
                </div>
              )}
            </div>
          </section>

          {/* Links */}
          {(profile.githubUrl || profile.linkedinUrl || !!profile.portfolioLinks?.length) && (
            <section className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700">Links</h2>
              <div className="mt-3 space-y-2">
                {profile.githubUrl && (
                  <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                    <span>GitHub</span>
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline">
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile.portfolioLinks?.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className="block truncate text-sm text-blue-700 hover:underline">{link}</a>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="card p-5">
            <Link href="/client/messages" className="btn-primary w-full text-center block">
              Message student
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
